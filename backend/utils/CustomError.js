/**
 * Custom error type used throughout controllers/middlewares.
 *
 * Same in most projects (boilerplate): an Error subclass carrying an HTTP status code.
 * Project-specific: the exact field names used by this repo (statusCode, isOperational) and how errorMiddleware formats responses.
 *
 * `statusCode` lets the error middleware map errors to HTTP responses.
 * `isOperational` is a common flag used to distinguish expected vs. unexpected errors.
 */
class CustomError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = CustomError;
