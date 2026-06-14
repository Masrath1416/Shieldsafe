const express = require('express');
const { triggerSOS, logFakeCall } = require('../controllers/sosController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// @route POST /api/sos
router.post('/', protect, triggerSOS);

// @route POST /api/sos/fake-call
router.post('/fake-call', protect, logFakeCall);

module.exports = router;
