const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { allowedRoles } = require("../config/roles");

/**
 * User model.
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
  if (this.isModified("role")) {
    this.isAdmin = this.role === "admin";
  }

  if (this.isModified("isAdmin")) {
    this.role = this.isAdmin ? "admin" : "user";
  }

  if (!this.isModified("password")) {
    return;
  }

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
