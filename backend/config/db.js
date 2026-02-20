/**
 * MongoDB connection helper.
 *
 * Same in most projects (boilerplate): a single `connectDB()` that connects Mongoose using an env var and exits on failure.
 * Project-specific: the exact env var name (MONGO_URI) and any logging format.
 *
 * Exports a single async function used by server.js to connect Mongoose.
 */

const mongoose = require("mongoose");

/**
 * Connects Mongoose using MONGO_URI.
 * On failure we exit the process, because the app cannot function without DB.
 */
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected Successfully");
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err.message);
    process.exit(1);
  }
};

module.exports = connectDB;