const mongoose = require("mongoose");

/**
 * UserSession model.
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

userSessionSchema.index({ user: 1, lastSeenAt: -1 });

module.exports = mongoose.model("UserSession", userSessionSchema);
