/**
 * Product routes.
 *
 * Same in most projects (boilerplate): Express router + middleware + CRUD mapping.
 * Project-specific: admin-only rules and the endpoints used by this app (favourite toggle, etc.).
 */

const express = require("express");
const { protect, requireAdmin } = require("../middlewares/authMiddleware");
const {
  createProduct,
  getProducts,
  getProductById,
  toggleFavourite,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");

const router = express.Router();

// All product routes require authentication.
router.use(protect);

// Admin-only: create products. Everyone: list products.
router.route("/").post(requireAdmin, createProduct).get(getProducts);

// Users can mark items as favourites.
router.patch("/:id/favourite", toggleFavourite);

router
  .route("/:id")
  // Anyone can view a product.
  .get(getProductById)
  // Admin-only: update/delete products.
  .put(requireAdmin, updateProduct)
  .delete(requireAdmin, deleteProduct);

module.exports = router;
