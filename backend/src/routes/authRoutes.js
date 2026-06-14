const express = require('express');
const { registerUser, loginUser } = require('../controllers/authController');

const router = express.Router();

// @route POST /api/auth/signup
router.post('/signup', registerUser);

// @route POST /api/auth/login
router.post('/login', loginUser);

module.exports = router;
