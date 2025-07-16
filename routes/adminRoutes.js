const express = require("express");
require('dotenv').config();
const jwt = require("jsonwebtoken");
const router = express.Router();

const ADMIN_PASSWORD = process.env.PASSWORD;  // Keep secret in .env
const JWT_SECRET = process.env.JWT_SECRET  // Should be strong in production


// Login Route
router.post("/login", (req, res) => {
  const { password } = req.body;

  if (password === ADMIN_PASSWORD) {
    const token = jwt.sign({ role: "admin" }, JWT_SECRET, { expiresIn: "30d" });
    return res.json({ token });
  }

  return res.status(401).json({ error: "Invalid password" });
});

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

// Update 'contacted' status
router.put('/:id', verifyToken, async (req, res) => {
  const { contacted } = req.body;
  await Chat.findByIdAndUpdate(req.params.id, { contacted });
  res.json({ message: 'Status updated' });
});

// Delete a chat
router.delete('/:id', verifyToken, async (req, res) => {
  await Chat.findByIdAndDelete(req.params.id);
  res.json({ message: 'Chat deleted' });
});

module.exports = router;
