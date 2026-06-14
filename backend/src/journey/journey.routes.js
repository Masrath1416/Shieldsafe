const express = require("express");
const router = express.Router();
const journeyController = require("./journey.controller");
const { protect } = require("../middleware/auth");

// All journey routes are protected
router.use(protect);

router.post("/start", journeyController.startJourney);
router.post("/complete", journeyController.completeJourney);
router.get("/", journeyController.getJourneys);

module.exports = router;