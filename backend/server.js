/**
 * Backend entrypoint.
 *
 * Same in most projects (boilerplate): Express app bootstrap (dotenv, cors/json middleware, route mounting, error middleware, start server after DB connect).
 * Project-specific: the particular route modules mounted here and env vars like FRONTEND_URL used by this app.
 *
 * Responsibilities:
 * - Load environment variables (backend/.env)
 * - Create and configure the Express app (CORS, JSON body parsing, logging)
 * - Mount API routes
 * - Register a single error-handling middleware (must be last)
 * - Connect to MongoDB and start the HTTP server
 */

const path = require("path");

// Load environment variables for this service.
// Using an explicit path avoids surprises when the process is started from a different cwd.
require("dotenv").config({ path: path.resolve(__dirname, ".env") });
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const { logger } = require("./middlewares/loggerMiddleware");
const { errorHandler } = require("./middlewares/errorMiddleware");

const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const userRoutes = require("./routes/userRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

const app = express();

// Middleware (runs in the order it is registered)
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    exposedHeaders: ["Content-Disposition"],
  }),
);

// Parse JSON bodies. The higher limit supports base64 images and other larger payloads.
app.use(express.json({ limit: "20mb" }));

// Request logger for basic observability in dev.
app.use(logger);

// Routes (all API endpoints live under /api/*)
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/users", userRoutes);
app.use("/api/payment", paymentRoutes);

// Error handler (must be last): centralizes error formatting and status codes.
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Start only after the database is connected.
// This prevents the API from accepting requests when it cannot talk to MongoDB.
connectDB().then(() => {
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
});
