/**
 * Auth routes.
 */

const express = require("express");
const {
  register,
  login,
  verifyOtp,
  resendOtp,
  logout,
  requestPasswordReset,
  verifyResetOtp,
  resetPassword,
} = require("../controllers/authController");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);
router.post("/logout", logout);
router.post("/request-password-reset", requestPasswordReset);
router.post("/verify-reset-otp", verifyResetOtp);
router.post("/reset-password", resetPassword);

module.exports = router;
