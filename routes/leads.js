const express = require('express');
const router = express.Router();



const jwt = require("jsonwebtoken");
// const bcrypt = require("bcryptjs");
const Lead = require('../models/Lead');
  // Keep secret in .env

require("dotenv").config();
const JWT_SECRET = process.env.JWT_SECRET
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(403).json({ error: "Token missing" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    next();
  } catch (err) {
    res.status(401).json({ error: "Unauthorized" });
  }
};
router.post('/', async (req, res) => {
  try {
    const { name, phone, propertyId } = req.body;
    const lead = new Lead({ name, phone, propertyId });
    await lead.save();
    res.status(201).json(lead);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save lead' });
  }
});
router.get("/", verifyToken, async (req, res) => {
  try {
    const chats = await Lead.find().sort({ createdAt: -1 });
    res.json(chats);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch chats" });
  }
});

router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const deleted = await Lead.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Lead not found" });
    res.json({ success: true, message: "Lead deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete lead" });
  }
});

module.exports = router;
