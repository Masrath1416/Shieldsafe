const express = require('express');
const { getContacts, addContact, deleteContact } = require('../controllers/contactController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Apply protection middleware to all contact routes
router.use(protect);

// @route GET /api/contacts
router.get('/', getContacts);

// @route POST /api/contacts
router.post('/', addContact);

// @route DELETE /api/contacts/:id
router.delete('/:id', deleteContact);

module.exports = router;
