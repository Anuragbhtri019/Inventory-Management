const mongoose = require("mongoose");

/**
 * UserSession model.
 *
 * Same in most projects (boilerplate): session/audit record tied to a user.
 * Project-specific: fields tracked by this app (ipAddress, userAgent, isActive, lastSeenAt) and how they're updated.
 *
 * A lightweight session record created at login.
 * - `isActive` is set false on logout
 * - `lastSeenAt` is updated by auth middleware when requests are made
 */
const userSessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  ipAddress: {
    type: String,
    default: "",
  },
  userAgent: {
    type: String,
    default: "",
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastSeenAt: {
    type: Date,
    default: Date.now,
  },
});

// Common access pattern: list a user's sessions sorted by lastSeenAt.
userSessionSchema.index({ user: 1, lastSeenAt: -1 });

module.exports = mongoose.model("UserSession", userSessionSchema);
