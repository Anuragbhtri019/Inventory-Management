const errorHandler = (err, _req, res, _next) => {
  const statusCode = Number.isInteger(err?.statusCode)
    ? err.statusCode
    : res.statusCode === 200
      ? 500
      : res.statusCode;

  res.status(statusCode).json({
    success: false,
    message: err.message || "Server Error",
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};

module.exports = { errorHandler };
