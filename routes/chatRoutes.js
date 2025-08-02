const express = require("express");
const jwt = require("jsonwebtoken");
const Chat = require("../models/Chat");
const CallDetail = require('../models/CallDetail');
const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

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

// Get all chats with populated call details
router.get('/', verifyToken, async (req, res) => {
  try {
    const chats = await Chat.find()
      .populate('callDetails')
      .sort({ createdAt: -1 });
    res.json(chats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create new chat
router.post("/", verifyToken, async (req, res) => {
  try {
    const chat = await Chat.create(req.body);
    res.status(201).json(chat);
  } catch (err) {
    res.status(400).json({ error: "Error saving chat data" });
  }
});

// Update chat (mark as contacted)
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { contacted } = req.body;
    await Chat.findByIdAndUpdate(req.params.id, { contacted });
    res.json({ message: 'Status updated' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete a chat
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    // First delete all associated call details
    await CallDetail.deleteMany({ chat: req.params.id });
    // Then delete the chat
    await Chat.findByIdAndDelete(req.params.id);
    res.json({ message: 'Chat and associated call details deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add call detail to a chat
router.post('/:id/call-details', verifyToken, async (req, res) => {
  try {
    const { buyingStatus, description, followUpDate } = req.body;
    
    const callDetail = new CallDetail({
      chat: req.params.id,
      buyingStatus,
      description,
      followUpDate
    });
    
    const savedCallDetail = await callDetail.save();
    
    await Chat.findByIdAndUpdate(
      req.params.id,
      { $push: { callDetails: savedCallDetail._id } }
    );
    
    res.status(201).json(savedCallDetail);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a call detail
router.delete('/call-details/:id', verifyToken, async (req, res) => {
  try {
    // First remove reference from chat
    const callDetail = await CallDetail.findById(req.params.id);
    if (callDetail) {
      await Chat.findByIdAndUpdate(callDetail.chat, {
        $pull: { callDetails: req.params.id }
      });
      // Then delete the call detail
      await CallDetail.findByIdAndDelete(req.params.id);
    }
    res.json({ message: "Call detail deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;