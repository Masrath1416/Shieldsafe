const express = require("express");
const router = express.Router();
const contactsController = require("./contacts.controller");
const { protect } = require("../middleware/auth");

// All contacts routes are protected
router.use(protect);

router.post("/", contactsController.addContact);
router.get("/", contactsController.getContacts);
router.delete("/:id", contactsController.deleteContact);

module.exports = router;