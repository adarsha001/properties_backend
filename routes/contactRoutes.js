const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');

const jwt = require("jsonwebtoken");
// const bcrypt = require("bcryptjs");
;
  // Keep secret in .env

require("dotenv").config();
const JWT_SECRET = process.env.JWT_SECRET
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(403).json({ error: "Token missing" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== "admin") throw new Error("Not authorized");
    next();
  } catch (err) {
    res.status(401).json({ error: "Unauthorized" });
  }
};
router.post('/', async (req, res) => {
  const { name, email, phone, message } = req.body;

  try {
    const newContact = new Contact({ name, email, phone, message });
    await newContact.save();
    res.status(201).json({ success: true, message: 'Message sent successfully!' });
  } catch (error) {
    console.error('Error saving contact form:', error);
    res.status(500).json({ success: false, message: 'Server error. Please try again later.' });
  }
});

router.get("/", async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.json(contacts);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch contacts" });
  }
});
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const deleted = await Contact.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Lead not found" });
    res.json({ success: true, message: "Lead deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete lead" });
  }
});
module.exports = router;
