const prisma = require('../config/prismaClient');

/**
 * @desc    Get all emergency contacts for a user
 * @route   GET /api/contacts
 * @access  Private
 */
const getContacts = async (req, res) => {
  try {
    const contacts = await prisma.emergencyContact.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json(contacts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching contacts' });
  }
};

/**
 * @desc    Add a new emergency contact
 * @route   POST /api/contacts
 * @access  Private
 */
const addContact = async (req, res) => {
  const { contactName, contactPhone, relationship } = req.body;

  if (!contactName || !contactPhone || !relationship) {
    return res.status(400).json({ message: 'Please provide all contact details' });
  }

  try {
    const contact = await prisma.emergencyContact.create({
      data: {
        userId: req.user.id,
        contactName,
        contactPhone,
        relationship,
      },
    });
    res.status(201).json(contact);
  } catch (error) {
    res.status(500).json({ message: 'Error adding contact' });
  }
};

/**
 * @desc    Delete an emergency contact
 * @route   DELETE /api/contacts/:id
 * @access  Private
 */
const deleteContact = async (req, res) => {
  const { id } = req.params;

  try {
    // Check if contact belongs to user
    const contact = await prisma.emergencyContact.findFirst({
      where: { id, userId: req.user.id },
    });

    if (!contact) {
      return res.status(404).json({ message: 'Contact not found or unauthorized' });
    }

    await prisma.emergencyContact.delete({ where: { id } });
    res.json({ message: 'Contact removed' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting contact' });
  }
};

module.exports = { getContacts, addContact, deleteContact };
