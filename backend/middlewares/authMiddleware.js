const jwt = require("jsonwebtoken");
const User = require("../models/User");
const UserSession = require("../models/UserSession");
const CustomError = require("../utils/CustomError");

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) return next(new CustomError("Not authorized, no token", 401));

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decoded.id).select(
      "-password -otpHash -otpExpiresAt -resetOtpHash -resetOtpExpiresAt",
    );
    if (!req.user) return next(new CustomError("User not found", 401));

    if (decoded.sessionId) {
      await UserSession.findByIdAndUpdate(decoded.sessionId, {
        lastSeenAt: new Date(),
      });
    }
    next();
  } catch (err) {
    next(new CustomError("Token failed", 401));
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.user?.isAdmin) {
    return next(new CustomError("Admin access required", 403));
  }
  next();
};

module.exports = { protect, requireAdmin };
