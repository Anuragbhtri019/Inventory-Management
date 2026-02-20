/**
 * Payment routes.
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

router.use(protect);

router.get("/mine", listMyPayments);
router.get("/admin", requireAdmin, listAllPayments);

router.post("/initiate", initiatePayment);
router.post("/verify", verifyPayment);
router.post("/cancel", cancelPayment);

router.post("/confirm", confirmPurchase);

router.get("/receipt/:pidx", downloadReceiptPdf);

module.exports = router;
