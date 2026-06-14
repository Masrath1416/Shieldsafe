const express = require('express');
const { startTimer, checkIn } = require('../controllers/timerController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// @route POST /api/timer/start
router.post('/start', protect, startTimer);

// @route POST /api/timer/checkin
router.post('/checkin', protect, checkIn);

module.exports = router;
