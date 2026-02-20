/**
 * Auth/authorization middlewares.
 *
 * Same in most projects (boilerplate): JWT bearer token verification + role-based access checks.
 * Project-specific: loading User from MongoDB, updating UserSession.lastSeenAt, and the specific `isAdmin` flag used by this app.
 */

const jwt = require("jsonwebtoken");
const User = require("../models/User");
const UserSession = require("../models/UserSession");
const CustomError = require("../utils/CustomError");

/**
 * Auth middleware that enforces a valid JWT bearer token.
 *
 * - Reads `Authorization: Bearer <token>`
 * - Verifies JWT signature
 * - Loads the user from MongoDB and attaches it to `req.user`
 * - Updates session "last seen" timestamp when a sessionId is present
 */
const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  // No token means the request is unauthenticated.
  if (!token) return next(new CustomError("Not authorized, no token", 401));

  try {
    // `decoded` contains the fields signed in authController.generateToken().
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Always re-load the user from DB so role/flags are current.
    // Never attach sensitive secrets/hashes to req.user since /users/me returns it.
    req.user = await User.findById(decoded.id).select(
      "-password -otpHash -otpExpiresAt -resetOtpHash -resetOtpExpiresAt",
    );
    if (!req.user) return next(new CustomError("User not found", 401));

    // If the token includes a session id, update that session's last-seen time.
    // This is helpful for admin audit / session management screens.
    if (decoded.sessionId) {
      await UserSession.findByIdAndUpdate(decoded.sessionId, {
        lastSeenAt: new Date(),
      });
    }
    next();
  } catch (err) {
    // Any verification error is treated as an auth failure.
    next(new CustomError("Token failed", 401));
  }
};

/**
 * Authorization middleware: blocks non-admins.
 * Requires `protect` to have run earlier (so `req.user` exists).
 */
const requireAdmin = (req, res, next) => {
  if (!req.user?.isAdmin) {
    return next(new CustomError("Admin access required", 403));
  }
  next();
};

module.exports = { protect, requireAdmin };
