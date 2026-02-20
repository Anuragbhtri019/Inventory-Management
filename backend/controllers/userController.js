/**
 * User controller.
 *
 * Same in most projects (boilerplate): profile endpoints, password change, admin user listing/updating.
 * Project-specific: OTP re-verification when email changes, avatar data-URL size checking, and roles/admin rules.
 */

const User = require("../models/User");
const UserSession = require("../models/UserSession");
const CustomError = require("../utils/CustomError");
const { isRoleAllowed } = require("../config/roles");
const Joi = require("joi");
const { generateOtp, hashOtp } = require("../utils/otp");
const { sendOtpEmail } = require("../utils/mailer");

// Convert a Mongoose document to a "safe" JSON object.
// Removes sensitive fields that should never be returned to the client.
const toSafeUser = (user) => {
  const data = user.toObject();
  delete data.password;
  delete data.otpHash;
  delete data.otpExpiresAt;
  delete data.resetOtpHash;
  delete data.resetOtpExpiresAt;
  return data;
};

/**
 * GET /api/users/me
 * Returns the authenticated user injected by auth middleware.
 */
const getProfile = (req, res) => {
  res.json({ success: true, data: req.user });
};

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

// Helper checks for base64 image data URL.
const isImageDataUrl = (value) =>
  typeof value === "string" &&
  value.startsWith("data:image/") &&
  value.includes(";base64,");

// Roughly estimate decoded bytes for a base64 data URL without fully decoding it.
const estimateDataUrlBytes = (dataUrl) => {
  if (!isImageDataUrl(dataUrl)) return 0;
  const base64 = String(dataUrl.split(",")[1] || "");
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  return Math.max(0, Math.floor((base64.length * 3) / 4) - padding);
};

const avatarSchema = Joi.alternatives()
  .try(
    Joi.string().uri().trim(),
    Joi.string()
      .pattern(/^data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=]+$/)
      .trim(),
  )
  .allow("")
  .optional();

const updateMeSchema = Joi.object({
  name: Joi.string().min(2).trim().optional(),
  email: Joi.string().email().trim().optional(),
  phone: Joi.string().trim().allow("").optional(),
  avatarUrl: avatarSchema,
});

/**
 * PUT /api/users/me
 * Updates current user profile fields.
 *
 * Side effects:
 * - If email changes, user becomes unverified and a new OTP is sent.
 * - Avatar data URLs are size-checked (2MB) to prevent huge payload storage.
 */
const updateMe = async (req, res, next) => {
  const { error } = updateMeSchema.validate(req.body);
  if (error) return next(new CustomError(error.details[0].message, 400));

  try {
    const user = await User.findById(req.user._id);
    if (!user) return next(new CustomError("User not found", 404));

    const nextEmail = req.body.email?.toLowerCase();
    const emailChanged =
      typeof nextEmail === "string" && nextEmail && nextEmail !== user.email;

    // Changing email triggers a new verification workflow.
    if (emailChanged) {
      const existing = await User.findOne({ email: nextEmail });
      if (existing) {
        return next(new CustomError("Email already in use", 400));
      }
      user.email = nextEmail;
      user.isEmailVerified = false;
      const otp = generateOtp();
      user.otpHash = hashOtp(otp);
      user.otpExpiresAt = new Date(Date.now() + 2 * 60 * 1000);
      await sendOtpEmail({ to: user.email, otp });
    }

    if (typeof req.body.name === "string") user.name = req.body.name;
    if (typeof req.body.phone === "string") user.phone = req.body.phone;
    // Allow either hosted URLs or data URLs for avatars.
    if (typeof req.body.avatarUrl === "string") {
      if (isImageDataUrl(req.body.avatarUrl)) {
        const bytes = estimateDataUrlBytes(req.body.avatarUrl);
        if (bytes > MAX_AVATAR_BYTES) {
          return next(
            new CustomError("Avatar image must be less than 2MB", 400),
          );
        }
      }
      user.avatarUrl = req.body.avatarUrl;
    }

    await user.save();

    res.json({
      success: true,
      data: toSafeUser(user),
      message: emailChanged
        ? "Profile updated. Verification code sent to your new email."
        : "Profile updated.",
      requiresEmailVerification: emailChanged,
    });
  } catch (err) {
    next(err);
  }
};

const changePasswordSchema = Joi.object({
  oldPassword: Joi.string().min(6).required(),
  newPassword: Joi.string().min(6).required(),
  confirmPassword: Joi.string().min(6).required(),
});

/**
 * PATCH /api/users/me/password
 * Checks old password and sets a new one.
 */
const changeMyPassword = async (req, res, next) => {
  const { error } = changePasswordSchema.validate(req.body);
  if (error) return next(new CustomError(error.details[0].message, 400));

  const { oldPassword, newPassword, confirmPassword } = req.body;
  if (newPassword !== confirmPassword) {
    return next(new CustomError("Passwords do not match", 400));
  }

  try {
    const user = await User.findById(req.user._id);
    if (!user) return next(new CustomError("User not found", 404));

    if (!(await user.matchPassword(oldPassword))) {
      return next(new CustomError("Old password is incorrect", 400));
    }

    // Model pre-save hook re-hashes password.
    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: "Password changed successfully" });
  } catch (err) {
    next(err);
  }
};

const adminUpdateUserSchema = Joi.object({
  name: Joi.string().min(2).trim().optional(),
  email: Joi.string().email().trim().optional(),
  phone: Joi.string().trim().allow("").optional(),
  avatarUrl: avatarSchema,
  isEmailVerified: Joi.boolean().optional(),
});

/**
 * PATCH /api/users/:id
 * Admin-only: updates another user's profile.
 */
const adminUpdateUser = async (req, res, next) => {
  const { error } = adminUpdateUserSchema.validate(req.body);
  if (error) return next(new CustomError(error.details[0].message, 400));

  try {
    const user = await User.findById(req.params.id);
    if (!user) return next(new CustomError("User not found", 404));

    if (typeof req.body.email === "string") {
      const nextEmail = req.body.email.toLowerCase();
      if (nextEmail && nextEmail !== user.email) {
        const existing = await User.findOne({ email: nextEmail });
        if (existing && existing._id.toString() !== user._id.toString()) {
          return next(new CustomError("Email already in use", 400));
        }
        user.email = nextEmail;
      }
    }

    if (typeof req.body.name === "string") user.name = req.body.name;
    if (typeof req.body.phone === "string") user.phone = req.body.phone;
    if (typeof req.body.avatarUrl === "string") {
      if (isImageDataUrl(req.body.avatarUrl)) {
        const bytes = estimateDataUrlBytes(req.body.avatarUrl);
        if (bytes > MAX_AVATAR_BYTES) {
          return next(
            new CustomError("Avatar image must be less than 2MB", 400),
          );
        }
      }
      user.avatarUrl = req.body.avatarUrl;
    }
    if (typeof req.body.isEmailVerified === "boolean") {
      user.isEmailVerified = req.body.isEmailVerified;
    }

    await user.save();
    res.json({ success: true, data: toSafeUser(user) });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/users
 * Admin-only: returns all users (sensitive fields excluded).
 */
const listUsers = async (req, res, next) => {
  try {
    const users = await User.find({}).select(
      "-password -otpHash -otpExpiresAt -resetOtpHash -resetOtpExpiresAt",
    );
    res.json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/users/:id
 * Admin-only: fetch a single user.
 */
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select(
      "-password -otpHash -otpExpiresAt -resetOtpHash -resetOtpExpiresAt",
    );
    if (!user) return next(new CustomError("User not found", 404));
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/users/:id/role
 * Admin-only: set user's role to one of the allowed roles.
 */
const updateUserRole = async (req, res, next) => {
  const { role } = req.body;
  if (!role || !isRoleAllowed(role)) {
    return next(new CustomError("Invalid role", 400));
  }

  try {
    const user = await User.findById(req.params.id);
    if (!user) return next(new CustomError("User not found", 404));

    user.role = role;
    await user.save();

    res.json({ success: true, data: toSafeUser(user) });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/users/:id/verify
 * Admin-only: mark a user as verified and clear OTP fields.
 */
const verifyUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return next(new CustomError("User not found", 404));

    user.isEmailVerified = true;
    user.otpHash = null;
    user.otpExpiresAt = null;
    await user.save();

    res.json({ success: true, data: toSafeUser(user) });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/users/:id
 * Admin-only.
 * Prevents admins from deleting other admins (self-delete is allowed if needed).
 */
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return next(new CustomError("User not found", 404));

    if (user.isAdmin && user._id.toString() !== req.user._id.toString()) {
      return next(new CustomError("Admins cannot delete other admins", 403));
    }

    // Clean up sessions for the deleted account.
    await UserSession.deleteMany({ user: user._id });
    await user.deleteOne();

    res.json({ success: true, message: "User deleted" });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/users/:id/sessions
 * Admin-only: returns recent sessions for a user.
 */
const getUserSessions = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return next(new CustomError("User not found", 404));

    const sessions = await UserSession.find({ user: user._id }).sort({
      lastSeenAt: -1,
    });

    res.json({ success: true, data: sessions });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getProfile,
  updateMe,
  changeMyPassword,
  adminUpdateUser,
  listUsers,
  getUserById,
  updateUserRole,
  verifyUser,
  deleteUser,
  getUserSessions,
};
