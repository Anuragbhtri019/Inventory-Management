/**
 * User routes.
 *
 * Same in most projects (boilerplate): /me profile endpoints + admin user management endpoints.
 * Project-specific: role names, verification/session endpoints, and authorization rules.
 */

const express = require("express");
const { protect, requireAdmin } = require("../middlewares/authMiddleware");
const {
  getProfile,
  updateMe,
  changeMyPassword,
  adminUpdateUser,
  listUsers,
  getUserById,
  updateUserRole,
  verifyUser,
  deleteUser,
  getUserSessions,
} = require("../controllers/userController");

const router = express.Router();

// All user routes require authentication.
router.use(protect);

// "Me" routes: current authenticated user profile management.
router.get("/me", getProfile);
router.put("/me", updateMe);
router.patch("/me/password", changeMyPassword);

// Admin routes: manage users.
router.get("/", requireAdmin, listUsers);
router.get("/:id", requireAdmin, getUserById);
router.patch("/:id", requireAdmin, adminUpdateUser);
router.patch("/:id/role", requireAdmin, updateUserRole);
router.patch("/:id/verify", requireAdmin, verifyUser);
router.get("/:id/sessions", requireAdmin, getUserSessions);
router.delete("/:id", requireAdmin, deleteUser);

module.exports = router;
