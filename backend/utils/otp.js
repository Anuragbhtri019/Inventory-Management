const crypto = require("crypto");
const generateOtp = () => {
  return String(crypto.randomInt(100000, 1000000));
};
const hashOtp = (otp) => {
  return crypto.createHash("sha256").update(otp).digest("hex");
};

module.exports = { generateOtp, hashOtp };
