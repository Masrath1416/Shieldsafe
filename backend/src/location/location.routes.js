const express = require("express");
const router = express.Router();
const locationController = require("./location.controller");
const { protect } = require("../middleware/auth");

// All location routes are protected
router.use(protect);

router.post("/", locationController.saveLocation);
router.get("/", locationController.getLocations);

module.exports = router;