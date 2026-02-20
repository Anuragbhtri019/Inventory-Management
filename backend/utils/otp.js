/**
 * OTP utilities.
 *
 * Same in most projects (boilerplate): generate short numeric OTP + store only a hash.
 * Project-specific: OTP length and hashing algorithm choice (sha256) for this app.
 */

const crypto = require("crypto");

/**
 * Generates a 6-digit numeric OTP as a string.
 * Using crypto.randomInt provides better randomness than Math.random.
 */
const generateOtp = () => {
  return String(crypto.randomInt(100000, 1000000));
};

/**
 * One-way hashes an OTP so we never store the plain code in the database.
 * We compare by hashing the user's input and comparing hashes.
 */
const hashOtp = (otp) => {
  return crypto.createHash("sha256").update(otp).digest("hex");
};

module.exports = { generateOtp, hashOtp };
