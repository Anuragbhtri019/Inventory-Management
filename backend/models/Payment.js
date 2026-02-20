const mongoose = require("mongoose");

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

paymentSchema.index({ user: 1, createdAt: -1 });
paymentSchema.index({ user: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model("Payment", paymentSchema);
