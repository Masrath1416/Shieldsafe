const express = require("express");
const router = express.Router();
const sosController = require("./sos.controller");
const { protect } = require("../middleware/auth");
const { body } = require("express-validator");

// All SOS routes are protected
router.use(protect);

router.post("/trigger", [
  body("latitude").isNumeric().withMessage("Valid latitude is required"),
  body("longitude").isNumeric().withMessage("Valid longitude is required")
], sosController.triggerSOS);

router.get("/", sosController.getSOSAlerts);

module.exports = router;