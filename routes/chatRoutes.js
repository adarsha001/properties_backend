const express = require("express");
const jwt = require("jsonwebtoken");
const Chat = require("../models/Chat");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET ;

// Middleware
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
router.post("/", async (req, res) => {
  try {
    const chat = await Chat.create(req.body);
    res.status(201).json(chat);
  } catch (err) {
    res.status(400).json({ error: "Error saving chat data" });
  }
});
// Admin protected route to fetch all chat submissions
router.get("/", verifyToken, async (req, res) => {
  try {
    const chats = await Chat.find().sort({ createdAt: -1 });
    res.json(chats);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch chats" });
  }
});
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
