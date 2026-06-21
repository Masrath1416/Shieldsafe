// GLOBAL CRASH PROTECTION
process.on('uncaughtException', (err) => {
  console.error("🔥 FATAL: Uncaught Exception:", err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error("🔥 FATAL: Unhandled Rejection at:", promise, "reason:", reason);
});

const express = require("express");
const cors = require("cors");

// ✅ ENV: Load .env for local dev only.
// override:false means Railway/Cloud injected vars always take priority.
require("dotenv").config({ override: false });

// ✅ Startup diagnostics — visible in Railway logs
console.log("[ENV] NODE_ENV:", process.env.NODE_ENV || "(not set)");
console.log("[ENV] PORT:", process.env.PORT || "(not set — will use 5000)");
console.log("[ENV] TWILIO_ACCOUNT_SID:", process.env.TWILIO_ACCOUNT_SID ? `${process.env.TWILIO_ACCOUNT_SID.slice(0,4)}...` : "❌ MISSING");
console.log("[ENV] TWILIO_AUTH_TOKEN:", process.env.TWILIO_AUTH_TOKEN ? "✅ present" : "❌ MISSING");
console.log("[ENV] TWILIO_PHONE_NUMBER:", process.env.TWILIO_PHONE_NUMBER || "❌ MISSING");

// ❌ TEMPORARILY DISABLE DATABASE
// const prisma = require("./prisma");

const app = express();

// ROUTES IMPORTS
const authRoutes = require("./auth/auth.routes");
const sosRoutes = require("./sos/sos.routes");
const contactRoutes = require("./contacts/contacts.routes");
const locationRoutes = require("./location/location.routes");
const journeyRoutes = require("./journey/journey.routes");
const timerRoutes = require("./timer/timer.routes");

// MIDDLEWARES
app.use(cors({ origin: "*" }));
app.use(express.json());

// API ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/sos", sosRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/location", locationRoutes);
app.use("/api/journey", journeyRoutes);
app.use("/api/timer", timerRoutes);

// HOME ROUTE
app.get("/", (req, res) => {
  res.send("Women Safety Backend is Running 🚀");
});

// SIMPLE TEST ROUTE
app.get("/test", (req, res) => {
  res.json({
    status: "success",
    message: "Backend is running properly"
  });
});

// ❌ DISABLE DB TEST ROUTE (IMPORTANT)
app.get("/test-db", async (req, res) => {
  res.json({
    status: "disabled",
    message: "Database temporarily disabled"
  });
});

// HEALTHCHECK ROUTE (Prevents Railway container stopping)
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

// START SERVER
const PORT = process.env.PORT || 5000;

// GLOBAL ERROR HANDLER
app.use((err, req, res, next) => {
  console.error("GLOBAL SERVER ERROR:", err.stack);
  res.status(500).json({
    message: "Something went wrong on the server!",
    error: err.message
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
});