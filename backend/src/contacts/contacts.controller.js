const prisma = require("../prisma");

// ADD CONTACT
exports.addContact = async (req, res) => {
  try {
    const { name, phone, relationship } = req.body;
    const userId = req.userId; // Securely get from token

    const contact = await prisma.emergencyContact.create({
      data: {
        userId,
        contactName: name, // Mapping frontend 'name' to DB 'contactName'
        contactPhone: phone, // Mapping frontend 'phone' to DB 'contactPhone'
        relationship: relationship || "Friend",
      },
    });

    res.json({
      message: "Contact added successfully ✅",
      contact,
    });

  } catch (error) {
    res.status(500).json({
      message: "Error adding contact",
      error: error.message,
    });
  }
};

// GET ALL CONTACTS
exports.getContacts = async (req, res) => {
  try {
    const userId = req.userId; // Securely filter by current user

    const contacts = await prisma.emergencyContact.findMany({
      where: { userId },
    });

    res.json(contacts);

  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};

// DELETE CONTACT
exports.deleteContact = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.emergencyContact.delete({
      where: { id },
    });

    res.json({
      message: "Contact deleted successfully",
    });

  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};
