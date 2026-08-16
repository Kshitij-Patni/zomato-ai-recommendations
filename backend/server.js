/**
 * server.js — Express app setup and entry point
 *
 * Loads the Zomato dataset into memory on startup,
 * mounts API routes, and starts listening.
 */

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const { loadData } = require("./services/dataLoader");

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ──────────────────────────────────────────────────────────

// CORS — allow frontend origin (same-origin in prod, any in dev)
app.use(cors({
  origin: process.env.FRONTEND_URL || "*",
  methods: ["GET", "POST"],
}));

// JSON body parsing with size limit (edge case A-4)
app.use(express.json({ limit: "10kb" }));

// Handle JSON parse errors gracefully (edge case I-7)
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({
      success: false,
      error: "Request body must be valid JSON",
    });
  }
  next(err);
});



// ── Routes ─────────────────────────────────────────────────────────────

// Health check (edge case: verify server is running)
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

// Available cities for dropdown
const { getLocations, getCuisines, getStore } = require("./services/dataLoader");
app.get("/api/cities", (req, res) => {
  const store = getStore();
  const cities = [...new Set(store.allRecords.map((r) => r.listed_in_city).filter(Boolean))].sort();
  res.json({
    success: true,
    count: cities.length,
    cities,
  });
});

// Available locations for dropdown (optionally filtered by city)
app.get("/api/locations", (req, res) => {
  const store = getStore();
  const city = req.query.city ? String(req.query.city).toLowerCase().trim() : null;

  let records = store.allRecords;
  if (city) {
    records = records.filter((r) => r.listed_in_city === city);
  }

  const locations = [...new Set(records.map((r) => r.location))].sort();
  res.json({
    success: true,
    count: locations.length,
    locations,
  });
});

// Available cuisines for dropdown
app.get("/api/cuisines", (req, res) => {
  const cuisines = getCuisines();
  res.json({
    success: true,
    count: cuisines.length,
    cuisines: cuisines.sort(),
  });
});

// Recommendation endpoint
const recommendRouter = require("./routes/recommend");
app.use("/api/recommend", recommendRouter);

// 404 handler for unknown API routes (edge case A-2)
app.use("/api/{*path}", (req, res) => {
  res.status(404).json({
    success: false,
    error: "Endpoint not found",
  });
});



// ── Global error handler ───────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.message);
  res.status(500).json({
    success: false,
    error: "Internal server error",
  });
});

// ── Startup ────────────────────────────────────────────────────────────
async function startServer() {
  try {
    console.log("🚀 Starting Zomato Recommendation Server...\n");

    // Load dataset into memory
    const store = await loadData();
    console.log(`📊 Dataset ready: ${store.totalRecords} restaurants across ${store.locations.length} locations\n`);

    // Start listening
    app.listen(PORT, () => {
      console.log("═".repeat(50));
      console.log(`  🍽️  Server running at http://localhost:${PORT}`);
      console.log(`  📡 API endpoint: POST http://localhost:${PORT}/api/recommend`);
      console.log(`  ❤️  Health check: GET  http://localhost:${PORT}/api/health`);
      console.log("═".repeat(50));
      console.log();
    });
  } catch (err) {
    console.error("\n❌ Failed to start server:", err.message);
    process.exit(1);
  }
}

// Graceful shutdown handlers (edge case E-6)
process.on("uncaughtException", (err) => {
  console.error("💥 Uncaught exception:", err.message);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error("💥 Unhandled rejection:", reason);
  process.exit(1);
});

startServer();
