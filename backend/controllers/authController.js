const User = require("../models/User");
const UserSession = require("../models/UserSession");
const jwt = require("jsonwebtoken");
const Joi = require("joi");
const CustomError = require("../utils/CustomError");
const { generateOtp, hashOtp } = require("../utils/otp");
const { sendOtpEmail } = require("../utils/mailer");

const OTP_EXPIRES_MS = 2 * 60 * 1000;

const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/;

const registerSchema = Joi.object({
  name: Joi.string().min(2).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).pattern(PASSWORD_REGEX).required().messages({
    "string.pattern.base":
      "Password must include at least 1 uppercase letter, 1 number, and 1 special character.",
  }),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

const verifyOtpSchema = Joi.object({
  email: Joi.string().email().required(),
  otp: Joi.string().length(6).required(),
});

const resendOtpSchema = Joi.object({
  email: Joi.string().email().required(),
});

const requestPasswordResetSchema = Joi.object({
  email: Joi.string().email().required(),
});

const verifyResetOtpSchema = Joi.object({
  email: Joi.string().email().required(),
  otp: Joi.string().length(6).required(),
});

const resetPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
  otp: Joi.string().length(6).required(),
  newPassword: Joi.string().min(6).pattern(PASSWORD_REGEX).required().messages({
    "string.pattern.base":
      "Password must include at least 1 uppercase letter, 1 number, and 1 special character.",
  }),
  confirmPassword: Joi.string().min(6).required(),
});

/**
 * Generates a signed JWT used by the frontend for authenticated requests.
 * `sessionId` is included so we can update session activity and support admin session views.
/**
 * Auth controller.
 */
const generateToken = (id, sessionId) =>
  jwt.sign({ id, sessionId }, process.env.JWT_SECRET, { expiresIn: "30d" });

// Always return a "safe" user payload (no password hashes, OTPs, etc.).
const buildUserResponse = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  isAdmin: user.isAdmin,
  isEmailVerified: user.isEmailVerified,
});

/**
 * POST /api/auth/register
 *
 * Flow:
 * - Validate input
 * - Create the user (first user becomes admin)
 * - Generate and store a hashed OTP with expiry
 * - Email the OTP to the user
 */
const register = async (req, res, next) => {
  const { error } = registerSchema.validate(req.body);
  if (error) return next(new CustomError(error.details[0].message, 400));

  const { name, email, password } = req.body;
  const normalizedEmail = String(email || "")
    .trim()
    .toLowerCase();
  try {
    if (await User.findOne({ email: normalizedEmail }))
      return next(new CustomError("User already exists", 400));

    // Bootstrap behavior: the very first account becomes admin.
    const isFirstUser = (await User.countDocuments({})) === 0;
    const user = await User.create({
      name,
      email: normalizedEmail,
      password,
      role: isFirstUser ? "admin" : "user",
      isAdmin: isFirstUser,
    });

    // Store only a hash of the OTP (never store the raw code).
    const otp = generateOtp();
    user.otpHash = hashOtp(otp);
    user.otpExpiresAt = new Date(Date.now() + OTP_EXPIRES_MS);
    await user.save();

    await sendOtpEmail({ to: user.email, otp });

    res.status(201).json({
      success: true,
      message: "Verification code sent to your email.",
      email: user.email,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/login
 *
 * Flow:
 * - Validate input
 * - Check credentials
 * - Require verified email
 * - Create a UserSession record
 * - Return JWT + user payload
 */
const login = async (req, res, next) => {
  const { error } = loginSchema.validate(req.body);
  if (error) return next(new CustomError(error.details[0].message, 400));

  const { email, password } = req.body;
  try {
    const normalizedEmail = String(email || "")
      .trim()
      .toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user || !(await user.matchPassword(password))) {
      return next(new CustomError("Invalid credentials", 401));
    }

    // Email verification gate keeps login from unverified accounts.
    if (!user.isEmailVerified) {
      return next(new CustomError("Email not verified", 403));
    }

    const session = await UserSession.create({
      user: user._id,
      ipAddress: req.ip,
      userAgent: req.get("user-agent") || "",
    });

    const token = generateToken(user._id, session._id.toString());
    res.json({
      success: true,
      token,
      user: buildUserResponse(user),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/verify-otp
 * Verifies email OTP, marks email as verified, then logs the user in.
 */
const verifyOtp = async (req, res, next) => {
  const { error } = verifyOtpSchema.validate(req.body);
  if (error) return next(new CustomError(error.details[0].message, 400));

  const { email, otp } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return next(new CustomError("User not found", 404));

    if (user.isEmailVerified) {
      return next(new CustomError("Email already verified", 400));
    }

    if (!user.otpHash || !user.otpExpiresAt) {
      return next(
        new CustomError("OTP not found. Please request a new code.", 400),
      );
    }

    if (user.otpExpiresAt < new Date()) {
      return next(
        new CustomError("OTP expired. Please request a new code.", 400),
      );
    }

    // Compare hashes to avoid storing/processing plain OTP beyond the request.
    if (hashOtp(otp) !== user.otpHash) {
      return next(new CustomError("Invalid OTP", 400));
    }

    user.isEmailVerified = true;
    user.otpHash = null;
    user.otpExpiresAt = null;
    await user.save();

    const session = await UserSession.create({
      user: user._id,
      ipAddress: req.ip,
      userAgent: req.get("user-agent") || "",
    });
    const token = generateToken(user._id, session._id.toString());

    res.json({
      success: true,
      token,
      user: buildUserResponse(user),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/resend-otp
 * Generates a new OTP for email verification.
 */
const resendOtp = async (req, res, next) => {
  const { error } = resendOtpSchema.validate(req.body);
  if (error) return next(new CustomError(error.details[0].message, 400));

  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return next(new CustomError("User not found", 404));

    if (user.isEmailVerified) {
      return next(new CustomError("Email already verified", 400));
    }

    const otp = generateOtp();
    user.otpHash = hashOtp(otp);
    user.otpExpiresAt = new Date(Date.now() + OTP_EXPIRES_MS);
    await user.save();

    await sendOtpEmail({ to: user.email, otp });

    res.json({ success: true, message: "Verification code Resent." });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/logout
 * Marks the current session (if present in JWT) as inactive.
 */
const logout = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

    // Logout is best-effort: even if token is missing/invalid we respond success.
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded?.sessionId) {
        await UserSession.findByIdAndUpdate(decoded.sessionId, {
          isActive: false,
          lastSeenAt: new Date(),
        });
      }
    }

    res.json({ success: true, message: "Logged out successfully" });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/request-password-reset
 * Sends an OTP reset code if the account exists.
 * Always returns success to avoid leaking whether an email is registered.
 */
const requestPasswordReset = async (req, res, next) => {
  const { error } = requestPasswordResetSchema.validate(req.body);
  if (error) return next(new CustomError(error.details[0].message, 400));

  const { email } = req.body;
  try {
    const normalizedEmail = String(email || "")
      .trim()
      .toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.json({
        success: true,
        message: "If the account exists, a reset code has been sent.",
      });
    }

    const otp = generateOtp();
    user.resetOtpHash = hashOtp(otp);
    user.resetOtpExpiresAt = new Date(Date.now() + OTP_EXPIRES_MS);
    await user.save();

    await sendOtpEmail({ to: user.email, otp });

    res.json({
      success: true,
      message: "Password reset code sent to your email.",
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/verify-reset-otp
 * Checks whether a password-reset OTP is valid (does not change password).
 */
const verifyResetOtp = async (req, res, next) => {
  const { error } = verifyResetOtpSchema.validate(req.body);
  if (error) return next(new CustomError(error.details[0].message, 400));

  const { email, otp } = req.body;

  try {
    const normalizedEmail = String(email || "")
      .trim()
      .toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return next(new CustomError("User not found", 404));

    if (!user.resetOtpHash || !user.resetOtpExpiresAt) {
      return next(
        new CustomError(
          "Reset code not found. Please request a new code.",
          400,
        ),
      );
    }

    if (user.resetOtpExpiresAt < new Date()) {
      return next(
        new CustomError("Reset code expired. Please request a new code.", 400),
      );
    }

    if (hashOtp(otp) !== user.resetOtpHash) {
      return next(new CustomError("Invalid reset code", 400));
    }

    res.json({ success: true, message: "Reset code verified." });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/reset-password
 * Verifies reset OTP and sets a new password.
 */
const resetPassword = async (req, res, next) => {
  const { error } = resetPasswordSchema.validate(req.body);
  if (error) return next(new CustomError(error.details[0].message, 400));

  const { email, otp, newPassword, confirmPassword } = req.body;
  if (newPassword !== confirmPassword) {
    return next(new CustomError("Passwords do not match", 400));
  }

  try {
    const normalizedEmail = String(email || "")
      .trim()
      .toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return next(new CustomError("User not found", 404));

    if (!user.resetOtpHash || !user.resetOtpExpiresAt) {
      return next(
        new CustomError(
          "Reset code not found. Please request a new code.",
          400,
        ),
      );
    }

    if (user.resetOtpExpiresAt < new Date()) {
      return next(
        new CustomError("Reset code expired. Please request a new code.", 400),
      );
    }

    if (hashOtp(otp) !== user.resetOtpHash) {
      return next(new CustomError("Invalid reset code", 400));
    }

    user.password = newPassword;
    user.resetOtpHash = null;
    user.resetOtpExpiresAt = null;
    await user.save();

    res.json({ success: true, message: "Password reset successfully" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login,
  verifyOtp,
  resendOtp,
  logout,
  requestPasswordReset,
  verifyResetOtp,
  resetPassword,
};
