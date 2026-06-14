const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

// MIDDLEWARES
app.use(cors());
app.use(express.json());

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

// START SERVER
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});