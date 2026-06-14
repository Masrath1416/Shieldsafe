const express = require("express");
const router = express.Router();
const authController = require("./auth.controller");
const { body } = require("express-validator");

// routes
router.post("/signup", [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters")
], authController.signup);

router.post("/login", [
  body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required")
], authController.login);

module.exports = router;