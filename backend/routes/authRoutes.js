/**
 * Auth routes.
 *
 * Same in most projects (boilerplate): mapping HTTP endpoints to controller handlers.
 * Project-specific: the exact route paths and which auth flows exist (OTP verify/resend, password reset).
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

// Auth endpoints are intentionally unauthenticated:
// - register/login/OTP verification happen before a user can obtain a JWT.

router.post("/register", register);
router.post("/login", login);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);
router.post("/logout", logout);
router.post("/request-password-reset", requestPasswordReset);
router.post("/verify-reset-otp", verifyResetOtp);
router.post("/reset-password", resetPassword);

module.exports = router;
