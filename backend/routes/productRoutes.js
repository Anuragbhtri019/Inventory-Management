/**
 * Product routes.
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

router.use(protect);

router.route("/").post(requireAdmin, createProduct).get(getProducts);

router.patch("/:id/favourite", toggleFavourite);

router
  .route("/:id")
  .get(getProductById)
  .put(requireAdmin, updateProduct)
  .delete(requireAdmin, deleteProduct);

module.exports = router;
