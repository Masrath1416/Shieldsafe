const express = require("express");
const cors = require("cors");
require("dotenv").config();

// DATABASE
const prisma = require("./prisma");
const app = express();

// ROUTES IMPORTS
const authRoutes = require("./auth/auth.routes");
const sosRoutes = require("./sos/sos.routes");
const contactRoutes = require("./contacts/contacts.routes");
const locationRoutes = require("./location/location.routes");
const journeyRoutes = require("./journey/journey.routes");
const timerRoutes = require("./timer/timer.routes");

// MIDDLEWARES
app.use(cors());
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

// TEST DB
app.get("/test-db", async (req, res) => {
  try {
    console.log("Testing Database Connection...");
    const userCount = await prisma.user.count();
    
    res.json({
      status: "Success \u2705",
      message: "Database is connected and tables exist.",
      userCount
    });
  } catch (error) {
    console.error("DB TEST ERROR:", error);
    res.status(500).json({
      status: "Error \u274C",
      message: error.message,
      code: error.code,
      meta: error.meta
    });
  }
});

// START SERVER
const PORT = process.env.PORT || 5000;

// Global Error Handler (Captures silent crashes)
app.use((err, req, res, next) => {
  console.error("GLOBAL SERVER ERROR:", err.stack);
  res.status(500).json({
    message: "Something went wrong on the server!",
    error: err.message
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});