/**
 * Same in most projects (boilerplate): simple request logging middleware.
 * Project-specific: exact log format and emoji/timestamp choices.
 */

/**
 * Simple request logger middleware.
 * Logs method + path + timestamp for quick debugging.
 */
const logger = (req, res, next) => {
  console.log(
    `📡 ${req.method} ${req.originalUrl} - ${new Date().toISOString()}`,
  );
  next();
};

module.exports = { logger };
