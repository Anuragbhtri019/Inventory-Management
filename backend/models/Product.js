const mongoose = require("mongoose");

/**
 * Product model.
 *
 * Same in most projects (boilerplate): an entity schema with created/updated timestamps.
 * Project-specific: fields like images/isFavourite and ownership (user ref) as used by this app.
 *
 * `user` points to the creator/owner.
 * `updatedAt` is refreshed on every save via pre-save hook.
 */
const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  quantity: { type: Number, required: true, min: 0 },
  price: { type: Number, required: true, min: 0 },
  category: { type: String, trim: true, default: "" },
  description: { type: String, trim: true },
  imageUrl: { type: String, trim: true },
  images: { type: [String], default: [] },
  isFavourite: { type: Boolean, default: false },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Common access pattern: list products sorted by updatedAt.
productSchema.index({ updatedAt: -1 });

productSchema.pre("save", function () {
  // Maintain a manual updatedAt field in addition to createdAt.
  this.updatedAt = Date.now();
});

module.exports = mongoose.model("Product", productSchema);
