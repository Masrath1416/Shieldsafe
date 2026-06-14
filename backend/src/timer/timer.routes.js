const express = require("express");
const router = express.Router();

const timerController = require("./timer.controller");

// routes
router.post("/start", timerController.startTimer);
router.post("/checkin", timerController.checkIn);
router.get("/:userId", timerController.getTimers);

module.exports = router;