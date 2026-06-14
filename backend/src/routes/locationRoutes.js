const express = require('express');
const { saveLocation, getLatestLocation } = require('../controllers/locationController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// @route POST /api/location
router.post('/', protect, saveLocation);

// @route GET /api/location/latest
router.get('/latest', protect, getLatestLocation);

module.exports = router;
