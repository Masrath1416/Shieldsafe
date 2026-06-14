const express = require('express');
const { startJourney, completeJourney } = require('../controllers/journeyController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// @route POST /api/journey/start
router.post('/start', protect, startJourney);

// @route POST /api/journey/complete
router.post('/complete', protect, completeJourney);

module.exports = router;
