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
router.post("/:id/call-details", async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id);
    if (!chat) return res.status(404).json({ message: "Chat not found" });

    const { buyingStatus, description, followUpDate } = req.body;
    
    chat.callDetails.push({
      buyingStatus,
      description,
      followUpDate: new Date(followUpDate)
    });

    const updatedChat = await chat.save();
    res.status(201).json(updatedChat);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get all chats with call details
router.get("/", async (req, res) => {
  try {
    const chats = await Chat.find().sort({ createdAt: -1 });
    res.json(chats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete a call detail
router.delete("/:chatId/call-details/:callId", async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId);
    if (!chat) return res.status(404).json({ message: "Chat not found" });

    chat.callDetails = chat.callDetails.filter(
      call => call._id.toString() !== req.params.callId
    );

    await chat.save();
    res.json({ message: "Call detail deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
