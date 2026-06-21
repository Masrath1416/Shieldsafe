// const express = require("express");
// const router = express.Router();
// const sosController = require("./sos.controller");
// const { protect } = require("../middleware/auth");
// const { body } = require("express-validator");

// // All SOS routes are protected
// // Protect GET routes only; POST /trigger is public for emergency
// router.get('/', protect, sosController.getSOSAlerts);

// router.post("/trigger", [
//   body("latitude").isNumeric().withMessage("Valid latitude is required"),
//   body("longitude").isNumeric().withMessage("Valid longitude is required")
// ], sosController.triggerSOS);

// router.get("/", sosController.getSOSAlerts);

// module.exports = router;


const express = require("express");
const router = express.Router();

const { triggerSOS } = require("./sos.controller");

// ✅ SOS trigger route
router.post("/trigger", triggerSOS);

// (optional test route)
router.get("/", (req, res) => {
  res.send("SOS route working");
});

module.exports = router;