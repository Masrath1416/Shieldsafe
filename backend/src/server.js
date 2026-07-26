// GLOBAL CRASH PROTECTION
process.on('uncaughtException', (err) => {
  console.error("🔥 FATAL: Uncaught Exception:", err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error("🔥 FATAL: Unhandled Rejection at:", promise, "reason:", reason);
});

// IMPORTS
const express = require("express");
const cors = require("cors");
require("dotenv").config({ override: false });

// STARTUP LOGS
console.log("[ENV] NODE_ENV:", process.env.NODE_ENV || "(not set)");
console.log("[ENV] PORT:", process.env.PORT || "(not set)");
console.log("[ENV] TWILIO_ACCOUNT_SID:", process.env.TWILIO_ACCOUNT_SID ? "✅ present" : "❌ MISSING");

// CREATE APP
const app = express();

// ✅ IMPORTANT: FIX CORS HERE
app.use(cors({
  origin: "*",   // allow frontend (Netlify) to access backend
}));

app.use(express.json());

// ROUTES
const authRoutes = require("./auth/auth.routes");
const sosRoutes = require("./sos/sos.routes");
const contactRoutes = require("./contacts/contacts.routes");
const locationRoutes = require("./location/location.routes");
const journeyRoutes = require("./journey/journey.routes");
const timerRoutes = require("./timer/timer.routes");

// USE ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/sos", sosRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/location", locationRoutes);
app.use("/api/journey", journeyRoutes);
app.use("/api/timer", timerRoutes);

// TEST ROUTES
app.get("/", (req, res) => {
  res.send("Women Safety Backend is Running 🚀");
});

app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

// ERROR HANDLER
app.use((err, req, res, next) => {
  console.error("GLOBAL SERVER ERROR:", err.stack);
  res.status(500).json({
    message: "Something went wrong on the server!",
    error: err.message
  });
});

// START SERVER
const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
});