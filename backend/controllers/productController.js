/**
 * Product controller.
 *
 * Same in most projects (boilerplate): CRUD handlers with Joi validation + Mongo queries + consistent error responses.
 * Project-specific: product fields (images/isFavourite), and the admin/ownership authorization rules used by this app.
 */

const Product = require("../models/Product");
const Joi = require("joi");
const CustomError = require("../utils/CustomError");

const dataImagePattern =
  /^data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=\s]+$/;
const imageRefSchema = Joi.alternatives().try(
  Joi.string().uri(),
  Joi.string().pattern(dataImagePattern),
);

const productSchema = Joi.object({
  name: Joi.string().required().trim(),
  quantity: Joi.number().min(0).required(),
  price: Joi.number().min(0).required(),
  category: Joi.string().trim().allow(""),
  description: Joi.string().trim().allow(""),
  imageUrl: imageRefSchema.allow(""),
  images: Joi.array().items(imageRefSchema).max(4).default([]),
  isFavourite: Joi.boolean().optional(),
});

/**
 * POST /api/products
 * Admin-only (enforced in routes).
 * Validates product payload and creates a new Product owned by the current user.
 */
const createProduct = async (req, res, next) => {
  const { error } = productSchema.validate(req.body);
  if (error) return next(new CustomError(error.details[0].message, 400));

  try {
    // Normalize legacy single-image field into images[] while keeping compatibility.
    const payload = { ...req.body };
    if (!payload.images?.length && payload.imageUrl) {
      payload.images = [payload.imageUrl];
    }
    // Hard cap images to avoid storing very large arrays.
    if (payload.images?.length > 4) {
      payload.images = payload.images.slice(0, 4);
    }
    const product = await Product.create({ ...payload, user: req.user._id });
    res.status(201).json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/products
 * Supports pagination, text search (name/description), and favourites filtering.
 */
const getProducts = async (req, res, next) => {
  const { page = 1, limit = 10, search = "", favourite } = req.query;
  const pageNum = Math.max(parseInt(String(page), 10) || 1, 1);
  const limitNum = Math.max(parseInt(String(limit), 10) || 10, 1);
  const query = {};
  if (typeof favourite !== "undefined") {
    query.isFavourite = String(favourite) === "true";
  }
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  try {
    const [products, total] = await Promise.all([
      Product.find(query)
        .limit(limitNum)
        .skip((pageNum - 1) * limitNum)
        .sort({ updatedAt: -1 }),
      Product.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: products,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/products/:id/favourite
 * Toggles a boolean flag on a product.
 */
const toggleFavourite = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return next(new CustomError("Product not found", 404));
    }

    product.isFavourite = !product.isFavourite;
    await product.save();

    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/products/:id
 */
const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return next(new CustomError("Product not found", 404));
    }
    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/products/:id
 * Admin-only (enforced in routes). Additionally checks ownership for non-admins.
 */
const updateProduct = async (req, res, next) => {
  const { error } = productSchema.validate(req.body);
  if (error) return next(new CustomError(error.details[0].message, 400));

  try {
    const product = await Product.findById(req.params.id);
    if (
      !product ||
      (!req.user.isAdmin && product.user.toString() !== req.user._id.toString())
    ) {
      return next(new CustomError("Product not found", 404));
    }
    // Apply validated fields.
    Object.assign(product, req.body);
    await product.save();
    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/products/:id
 * Admin-only (enforced in routes). Additionally checks ownership for non-admins.
 */
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (
      !product ||
      (!req.user.isAdmin && product.user.toString() !== req.user._id.toString())
    ) {
      return next(new CustomError("Product not found", 404));
    }
    await product.deleteOne();
    res.json({ success: true, message: "Product deleted" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  toggleFavourite,
  updateProduct,
  deleteProduct,
};
