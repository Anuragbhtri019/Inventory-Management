const mongoose = require("mongoose");

/**
 * Payment model.
 *
 * Same in most projects (boilerplate): persisting a payment attempt + provider reference + status.
 * Project-specific: Khalti `pidx`, receipt/metadata fields, and `processedAt` idempotency semantics.
 *
 * Stores the local representation of a Khalti payment attempt:
 * - `pidx` is the provider reference and is unique
 * - `status` is updated by verify/cancel endpoints
 * - `processedAt` marks that stock updates have been applied (idempotency)
 * - `raw` stores provider payload for debugging (excluded from list endpoints)
 */
const paymentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    orderId: { type: String, required: true },
    orderName: { type: String, required: true },
    amount: { type: Number, required: true },
    pidx: { type: String, required: true, unique: true, index: true },
    status: { type: String, default: "Initiated" },
    provider: { type: String, default: "Khalti" },
    meta: { type: mongoose.Schema.Types.Mixed },
    processedAt: { type: Date },
    raw: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true },
);

// Common access patterns: per-user history sorted by creation time, and filtering by status.
paymentSchema.index({ user: 1, createdAt: -1 });
paymentSchema.index({ user: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model("Payment", paymentSchema);
