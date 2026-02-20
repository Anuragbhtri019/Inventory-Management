/**
 * Same in most projects (boilerplate): centralized Express error formatting middleware.
 * Project-specific: response shape (success/message/stack) and how status codes are inferred.
 */

/**
 * Express error-handling middleware.
 *
 * Any route/controller can call `next(err)` to end up here.
 * We normalize the HTTP status code and return a consistent JSON payload.
 */
const errorHandler = (err, _req, res, _next) => {
  const statusCode = Number.isInteger(err?.statusCode)
    ? err.statusCode
    : res.statusCode === 200
      ? 500
      : res.statusCode;

  res.status(statusCode).json({
    success: false,
    message: err.message || "Server Error",
    // Stack traces are useful in development but should not be exposed in production.
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};

module.exports = { errorHandler };
