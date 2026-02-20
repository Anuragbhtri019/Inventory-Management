/**
 * Payment controller.
 *
 * Same in most projects (boilerplate): initiate/verify/cancel payment flows, listing history, receipt generation.
 * Project-specific: Khalti API integration, stock-decrement transaction in confirmPurchase, and the Payment/Product schema fields used.
 */

const axios = require("axios");
const mongoose = require("mongoose");
const PDFDocument = require("pdfkit");
const Payment = require("../models/Payment");
const Product = require("../models/Product");
const CustomError = require("../utils/CustomError");

/**
 * Reads provider configuration for Khalti.
 * We centralize it here so all payment endpoints use the same base url/keys.
 */
const getKhaltiConfig = () => {
  const baseUrl = process.env.KHALTI_BASE_URL || "https://a.khalti.com/api/v2";
  const secretKey =
    process.env.KHALTI_SECRET_KEY ||
    process.env.KHALTI_LIVE_SECRET_KEY ||
    process.env.LIVE_SECRET_KEY ||
    process.env.Live_secret_key;
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  if (!secretKey) {
    throw new CustomError(
      "Khalti secret key missing. Set KHALTI_SECRET_KEY (recommended) or Live_secret_key in backend/.env",
      500,
    );
  }
  return {
    baseUrl,
    secretKey,
    returnUrl: `${frontendUrl}/payment-success`,
    websiteUrl: frontendUrl,
  };
};

/**
 * POST /api/payment/initiate
 * Calls Khalti initiate endpoint and stores a local Payment record.
 *
 * Note: amount is expected in paisa (as used by Khalti).
 */
const initiatePayment = async (req, res, next) => {
  try {
    const { amount, orderId, orderName, metadata } = req.body;

    if (!amount || !orderId || !orderName) {
      return next(
        new CustomError("amount, orderId, and orderName are required", 400),
      );
    }

    const { baseUrl, secretKey, returnUrl, websiteUrl } = getKhaltiConfig();

    const response = await axios.post(
      `${baseUrl}/epayment/initiate/`,
      {
        return_url: returnUrl,
        website_url: websiteUrl,
        amount,
        purchase_order_id: orderId,
        purchase_order_name: orderName,
      },
      {
        headers: {
          Authorization: `Key ${secretKey}`,
          "Content-Type": "application/json",
        },
      },
    );

    const payload = response.data || {};

    // Persist the initiation response so we can later verify/confirm.
    await Payment.create({
      user: req.user._id,
      orderId,
      orderName,
      amount,
      pidx: payload.pidx,
      status: payload.status || "Initiated",
      meta: metadata,
      raw: payload,
    });

    res.json({ success: true, data: payload });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.response?.data || error.message,
    });
  }
};

/**
 * POST /api/payment/confirm
 * Confirms a completed payment and decrements product stock.
 * Uses a MongoDB transaction to ensure stock updates and "processedAt" are atomic.
 */
const confirmPurchase = async (req, res, next) => {
  try {
    const { pidx } = req.body;
    if (!pidx) {
      return next(new CustomError("pidx is required", 400));
    }

    const payment = await Payment.findOne({ pidx, user: req.user._id });
    if (!payment) {
      return next(new CustomError("Payment record not found", 404));
    }

    if (payment.processedAt) {
      return res.json({ success: true, message: "Purchase already processed" });
    }

    if (payment.status !== "Completed") {
      return next(new CustomError("Payment is not completed", 400));
    }

    const single =
      payment.meta?.productId &&
      Number.isFinite(Number(payment.meta?.quantity)) &&
      Number(payment.meta?.quantity) > 0
        ? [
            {
              productId: payment.meta.productId,
              quantity: Number(payment.meta.quantity),
            },
          ]
        : null;

    const items = Array.isArray(payment.meta?.items)
      ? payment.meta.items
      : single;

    if (!items || !items.length) {
      return next(
        new CustomError("Payment is not linked to a product purchase", 400),
      );
    }

    const normalized = items
      .map((i) => ({
        productId: i?.productId,
        quantity: Math.floor(Number(i?.quantity) || 0),
      }))
      .filter((i) => i.productId && i.quantity > 0);

    if (!normalized.length) {
      return next(new CustomError("Invalid purchase items", 400));
    }

    // Transaction protects from partial stock updates when multiple products are purchased.
    const session = await mongoose.startSession();
    let updatedProducts = [];
    try {
      await session.withTransaction(async () => {
        for (const item of normalized) {
          const updated = await Product.findOneAndUpdate(
            { _id: item.productId, quantity: { $gte: item.quantity } },
            { $inc: { quantity: -item.quantity } },
            { new: true, session },
          );

          if (!updated) {
            throw new CustomError("Insufficient stock", 400);
          }
          updatedProducts.push(updated);
        }

        // Mark payment processed so this endpoint is idempotent.
        payment.processedAt = new Date();
        await payment.save({ session });
      });
    } finally {
      session.endSession();
    }

    res.json({
      success: true,
      message: "Purchase confirmed",
      data: { products: updatedProducts },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/payment/verify
 * Looks up payment status from Khalti and updates our local Payment record.
 * Includes logic to prevent downgrading a terminal status (e.g. Completed).
 */
const verifyPayment = async (req, res, next) => {
  try {
    const { pidx } = req.body;

    if (!pidx) {
      return next(new CustomError("pidx is required", 400));
    }

    const { baseUrl, secretKey } = getKhaltiConfig();

    const response = await axios.post(
      `${baseUrl}/epayment/lookup/`,
      { pidx },
      {
        headers: {
          Authorization: `Key ${secretKey}`,
          "Content-Type": "application/json",
        },
      },
    );

    const payload = response.data || {};

    const existing = await Payment.findOne({ pidx, user: req.user._id });
    if (!existing) {
      return next(new CustomError("Payment record not found", 404));
    }

    // Normalization helper for comparing statuses.
    const normalizeStatus = (s) =>
      String(s || "")
        .trim()
        .toLowerCase();
    const incomingStatus = payload.status || "Unknown";
    const incomingNorm = normalizeStatus(incomingStatus);
    const existingNorm = normalizeStatus(existing.status);

    // Prevent downgrading terminal-ish states back to Initiated/Pending/Unknown.
    // This helps when Khalti lookup is eventually-consistent or when user cancels.
    const terminalLike = new Set([
      "completed",
      "cancelled",
      "canceled",
      "expired",
      "failed",
    ]);
    const nonTerminalLike = new Set(["initiated", "pending", "unknown"]);

    const shouldPreserveExisting =
      terminalLike.has(existingNorm) && nonTerminalLike.has(incomingNorm);

    existing.status = shouldPreserveExisting ? existing.status : incomingStatus;
    existing.raw = payload;
    await existing.save();

    res.json({
      success: true,
      data: payload,
      isCompleted: payload.status === "Completed",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.response?.data || error.message,
    });
  }
};

/**
 * POST /api/payment/cancel
 * Client-side cancellation: marks local Payment as Cancelled for non-terminal states.
 */
const cancelPayment = async (req, res, next) => {
  try {
    const { pidx, reason } = req.body;
    if (!pidx) {
      return next(new CustomError("pidx is required", 400));
    }

    const payment = await Payment.findOne({ pidx, user: req.user._id });
    if (!payment) {
      return next(new CustomError("Payment record not found", 404));
    }

    const norm = (s) =>
      String(s || "")
        .trim()
        .toLowerCase();
    const current = norm(payment.status);

    if (current === "completed") {
      return next(new CustomError("Cannot cancel a completed payment", 400));
    }

    // Only override non-terminal states.
    if (["initiated", "pending", "unknown"].includes(current) || !current) {
      payment.status = "Cancelled";
    }

    payment.raw = {
      ...(payment.raw && typeof payment.raw === "object" ? payment.raw : {}),
      client_cancelled_at: new Date().toISOString(),
      client_cancel_reason: reason ? String(reason) : undefined,
    };
    await payment.save();

    res.json({
      success: true,
      data: { pidx: payment.pidx, status: payment.status },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/payment/receipt/:pidx
 * Streams a PDF receipt. This is generated on-demand from stored payment metadata.
 */
const downloadReceiptPdf = async (req, res, next) => {
  try {
    const { pidx } = req.params;
    if (!pidx) return next(new CustomError("pidx is required", 400));

    const payment = await Payment.findOne({ pidx, user: req.user._id });
    if (!payment) return next(new CustomError("Payment record not found", 404));

    const items = Array.isArray(payment.meta?.items)
      ? payment.meta.items
      : payment.meta?.productId
        ? [
            {
              productId: payment.meta.productId,
              quantity: payment.meta.quantity,
            },
          ]
        : [];

    const ids = items.map((i) => String(i.productId)).filter(Boolean);
    const products = ids.length
      ? await Product.find({ _id: { $in: ids } }).select("_id name price")
      : [];
    const productById = new Map(products.map((p) => [String(p._id), p]));

    const amountNpr = Number(payment.amount || 0) / 100;

    const sanitizeFilenamePart = (value) => {
      const raw = String(value || "").trim();
      const compact = raw.replace(/\s+/g, "");
      const safe = compact.replace(/[^A-Za-z0-9_-]/g, "");
      return safe || "Unknown";
    };

    const userPart = sanitizeFilenamePart(req.user?.name || "User");
    const appPart = sanitizeFilenamePart("InventoryManager");

    const productNames = items
      .map((item) => {
        const product = productById.get(String(item.productId));
        return String(product?.name || "").trim();
      })
      .filter(Boolean);

    const productPart = sanitizeFilenamePart(
      productNames.length === 1
        ? productNames[0]
        : productNames.length > 1
          ? "MultipleProducts"
          : payment.orderName || "Product",
    );

    // Keep filename safe for most OS/filesystems.
    const filename = `${userPart}_${appPart}_${productPart}_Recipt.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    const doc = new PDFDocument({ size: "A4", margin: 48 });
    doc.pipe(res);

    doc.fontSize(18).text("Inventory Manager - Receipt");
    doc.moveDown(0.5);
    doc.fontSize(10);
    doc.text(`Order ID: ${payment.orderId || ""}`);
    doc.text(`Order Name: ${payment.orderName || ""}`);
    doc.text(`Provider: ${payment.provider || "Khalti"}`);
    doc.text(`Status: ${payment.status || ""}`);
    doc.text(`Payment Ref (pidx): ${payment.pidx || ""}`);
    doc.text(
      `Created: ${payment.createdAt ? new Date(payment.createdAt).toLocaleString() : ""}`,
    );
    doc.text(
      `Processed: ${payment.processedAt ? new Date(payment.processedAt).toLocaleString() : ""}`,
    );

    doc.moveDown(0.75);
    doc.fontSize(12).text(`Total Amount: NPR ${amountNpr.toFixed(2)}`);

    doc.moveDown(1);
    doc.fontSize(12).text("Items", { underline: true });
    doc.moveDown(0.5);

    const startX = doc.x;
    const col1 = startX;
    const col2 = startX + 280;
    const col3 = startX + 340;
    const col4 = startX + 430;

    doc.fontSize(10).text("Product", col1, doc.y, { width: 270 });
    doc.text("Qty", col2, doc.y, { width: 50, align: "right" });
    doc.text("Unit (NPR)", col3, doc.y, { width: 80, align: "right" });
    doc.text("Line (NPR)", col4, doc.y, { width: 90, align: "right" });
    doc.moveDown(0.35);
    doc
      .moveTo(startX, doc.y)
      .lineTo(doc.page.width - doc.page.margins.right, doc.y)
      .strokeColor("#999999")
      .stroke();
    doc.moveDown(0.35);

    if (!items.length) {
      doc.fontSize(10).text("(No items recorded)");
    } else {
      for (const item of items) {
        const product = productById.get(String(item.productId));
        const name = product?.name || String(item.productId || "");
        const qty = Math.floor(Number(item.quantity) || 0);
        const unit = Number(product?.price) || 0;
        const line = qty * unit;

        const y = doc.y;
        doc.fontSize(10).text(name, col1, y, { width: 270 });
        doc.text(String(qty), col2, y, { width: 50, align: "right" });
        doc.text(unit ? unit.toFixed(2) : "-", col3, y, {
          width: 80,
          align: "right",
        });
        doc.text(unit ? line.toFixed(2) : "-", col4, y, {
          width: 90,
          align: "right",
        });
        doc.moveDown(0.4);
      }
    }

    doc.moveDown(1);
    doc.fontSize(9).fillColor("#666666").text("Thank you for your purchase.");
    doc.end();
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/payment/mine
 * Returns the authenticated user's payments.
 * Also performs a small cleanup of stale "Initiated" payments (TTL) to reduce clutter.
 */
const listMyPayments = async (req, res, next) => {
  try {
    const includeInitiated =
      String(req.query.includeInitiated || "").toLowerCase() === "true" ||
      String(req.query.includeInitiated || "") === "1";

    const ttlDaysRaw = Number(process.env.PAYMENT_INITIATED_TTL_DAYS || 7);
    const ttlDays = Number.isFinite(ttlDaysRaw) ? Math.max(ttlDaysRaw, 0) : 7;

    if (ttlDays > 0) {
      const cutoff = new Date(Date.now() - ttlDays * 24 * 60 * 60 * 1000);
      await Payment.deleteMany({
        user: req.user._id,
        status: "Initiated",
        createdAt: { $lt: cutoff },
      });
    }

    const query = includeInitiated
      ? { user: req.user._id }
      : { user: req.user._id, status: { $ne: "Initiated" } };

    const payments = await Payment.find(query)
      .select("-raw")
      .sort({ createdAt: -1 })
      .lean();

    const pickProductId = (v) => {
      if (!v) return "";
      if (typeof v === "string" || typeof v === "number") return String(v);
      if (typeof v === "object") {
        if (v.productId) return String(v.productId);
        if (v._id) return String(v._id);
        if (v.id) return String(v.id);
        if (v.product && (v.product._id || v.product.id)) {
          return String(v.product._id || v.product.id);
        }
      }
      return "";
    };

    const productIds = [];
    for (const p of payments) {
      const meta = p?.meta || {};
      const items = Array.isArray(meta.items)
        ? meta.items
        : meta.productId || meta._id || meta.id
          ? [
              {
                productId: meta.productId || meta._id || meta.id,
                quantity: meta.quantity,
              },
            ]
          : [];

      for (const item of items) {
        const id = pickProductId(item);
        if (id) productIds.push(id);
      }
    }

    const uniqueIds = Array.from(new Set(productIds));
    const products = uniqueIds.length
      ? await Product.find({ _id: { $in: uniqueIds } }).select("_id name")
      : [];
    const nameById = new Map(products.map((p) => [String(p._id), p.name]));

    const enriched = payments.map((p) => {
      const meta = p?.meta || {};
      const baseItems = Array.isArray(meta.items)
        ? meta.items
        : meta.productId || meta._id || meta.id
          ? [
              {
                productId: meta.productId || meta._id || meta.id,
                quantity: meta.quantity,
              },
            ]
          : [];

      const items = baseItems.map((item) => {
        const id = pickProductId(item);
        const productName =
          String(item?.productName || "").trim() || nameById.get(id) || "";
        return { ...item, productName };
      });

      return {
        ...p,
        meta: { ...meta, items },
      };
    });

    res.json({ success: true, data: enriched });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/payment/admin
 * Admin-only: list recent payments across all users.
 */
const listAllPayments = async (req, res, next) => {
  try {
    const limit = Math.min(
      Math.max(parseInt(req.query.limit || "50", 10), 1),
      200,
    );
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      Payment.find({})
        .select("-raw")
        .populate("user", "name email phone role isAdmin")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Payment.countDocuments({}),
    ]);

    res.json({
      success: true,
      data: payments,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      currentPage: page,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  initiatePayment,
  verifyPayment,
  cancelPayment,
  confirmPurchase,
  downloadReceiptPdf,
  listMyPayments,
  listAllPayments,
};
