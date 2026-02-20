/**
 * Payment routes.
 *
 * Same in most projects (boilerplate): protected router + mapping payment lifecycle endpoints.
 * Project-specific: Khalti endpoints used and admin/user listing paths.
 */

const express = require("express");
const { protect, requireAdmin } = require("../middlewares/authMiddleware");
const {
  initiatePayment,
  verifyPayment,
  cancelPayment,
  confirmPurchase,
  downloadReceiptPdf,
  listMyPayments,
  listAllPayments,
} = require("../controllers/paymentController");

const router = express.Router();

// All payment operations require authentication.
router.use(protect);

// User history and admin overview.
router.get("/mine", listMyPayments);
router.get("/admin", requireAdmin, listAllPayments);

// Khalti payment lifecycle.
router.post("/initiate", initiatePayment);
router.post("/verify", verifyPayment);
router.post("/cancel", cancelPayment);

// Business logic: decrement stock / confirm purchase.
router.post("/confirm", confirmPurchase);

// Generate a PDF receipt and stream it as a download.
router.get("/receipt/:pidx", downloadReceiptPdf);

module.exports = router;
