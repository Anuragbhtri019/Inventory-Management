const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { allowedRoles } = require("../config/roles");

/**
 * User model.
 *
 * Same in most projects (boilerplate): user schema + password hashing + matchPassword helper.
 * Project-specific: role/isAdmin syncing, OTP/reset fields, and the exact allowed roles list.
 *
 * Notes:
 * - `role` and `isAdmin` are kept in sync via a pre-save hook.
 * - Passwords are hashed automatically when the `password` field changes.
 * - OTP fields store hashes only (never store raw OTP codes).
 */
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    trim: true,
  },
  role: {
    type: String,
    enum: allowedRoles,
    default: "user",
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  phone: {
    type: String,
    trim: true,
    default: "",
  },
  avatarUrl: {
    type: String,
    trim: true,
    default: "",
  },
  otpHash: {
    type: String,
    default: null,
  },
  otpExpiresAt: {
    type: Date,
    default: null,
  },
  resetOtpHash: {
    type: String,
    default: null,
  },
  resetOtpExpiresAt: {
    type: Date,
    default: null,
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [6, "Password must be at least 6 characters"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

userSchema.pre("save", async function () {
  // Keep role and isAdmin mutually consistent.
  if (this.isModified("role")) {
    this.isAdmin = this.role === "admin";
  }

  if (this.isModified("isAdmin")) {
    this.role = this.isAdmin ? "admin" : "user";
  }

  // 'this' must be the document → arrow function would break 'this'
  if (!this.isModified("password")) {
    return;
  }

  // More explicit salt + hash (safer and clearer)
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

/**
 * Compares a plaintext password with the stored bcrypt hash.
 * Used during login and password change.
 */
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
