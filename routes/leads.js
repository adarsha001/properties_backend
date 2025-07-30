const express = require('express');
const router = express.Router();



const jwt = require("jsonwebtoken");
// const bcrypt = require("bcryptjs");
const Lead = require('../models/Lead');
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

module.exports = router;
