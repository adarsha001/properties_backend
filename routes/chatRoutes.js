const express = require("express");
const jwt = require("jsonwebtoken");
const Chat = require("../models/Chat");
const CallDetail = require('../models/CallDetail');
const User = require("../models/User");
const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

// Middleware to verify token and role
const verifyTokenAndRole = (roles = []) => {
  return (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(403).json({ error: "Token missing" });

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;

      // Check if user has required role
      if (roles.length && !roles.includes(decoded.role)) {
        return res.status(403).json({ error: "Insufficient permissions" });
      }

      next();
    } catch (err) {
      res.status(401).json({ error: "Unauthorized" });
    }
  };
};

// Create new chat (public endpoint)
router.post("/bot", async (req, res) => {
  try {
    const chat = await Chat.create(req.body);
    res.status(201).json(chat);
  } catch (err) {
    res.status(400).json({ error: "Error saving chat data" });
  }
});


// Admin assigns chat to manager
router.put('/:id/assign', verifyTokenAndRole(['admin']), async (req, res) => {
  try {
    const { managerId } = req.body;
    
    // Verify manager exists and is actually a manager
    const manager = await User.findOne({ 
      _id: managerId,
      role: 'manager',
      isActive: true 
    });
    
    if (!manager) {
      return res.status(400).json({ 
        error: 'Invalid manager specified or manager not active' 
      });
    }

    const chat = await Chat.findByIdAndUpdate(
      req.params.id,
      { assignedTo: managerId },
      { new: true }
    ).populate('assignedTo', 'username fullName email');

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    res.json(chat);
  } catch (err) {
    console.error('Assignment error:', err); // Add logging
    res.status(500).json({ 
      error: 'Failed to assign chat',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});
// Get all chats (admin sees all, manager sees assigned)
router.get('/', verifyTokenAndRole(['admin', 'manager']), async (req, res) => {
  try {
    let query = {};
    
    // If manager, only show assigned chats
    if (req.user.role === 'manager') {
      query.assignedTo = req.user.userId;
    }

    const chats = await Chat.find(query)
      .populate('assignedTo', 'username fullName')
      .populate('callDetails')
      .sort({ createdAt: -1 });

    res.json(chats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get chat by ID (only admin or assigned manager can access)
router.get('/:id', verifyTokenAndRole(['admin', 'manager']), async (req, res) => {
  try {
    let query = { _id: req.params.id };
    
    if (req.user.role === 'manager') {
      query.assignedTo = req.user.userId;
    }

    const chat = await Chat.findOne(query)
      .populate('assignedTo', 'username fullName')
      .populate('callDetails');

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found or not assigned to you' });
    }

    res.json(chat);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update chat status (admin or assigned manager)
router.put('/:id', verifyTokenAndRole(['admin', 'manager']), async (req, res) => {
  try {
    let query = { _id: req.params.id };
    
    if (req.user.role === 'manager') {
      query.assignedTo = req.user.userId;
    }

    const chat = await Chat.findOneAndUpdate(
      query,
      req.body,
      { new: true }
    );

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found or not assigned to you' });
    }

    res.json(chat);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Add call details to chat (admin or assigned manager)
router.post('/:id/call-details', verifyTokenAndRole(['admin', 'manager']), async (req, res) => {
  try {
    let query = { _id: req.params.id };
    
    if (req.user.role === 'manager') {
      query.assignedTo = req.user.userId;
    }

    const chat = await Chat.findOne(query);
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found or not assigned to you' });
    }

    const callDetail = new CallDetail({
      ...req.body,
      chat: chat._id,
      createdBy: req.user.userId
    });
    
    const savedCallDetail = await callDetail.save();
    
    chat.callDetails.push(savedCallDetail._id);
    await chat.save();

    res.status(201).json(savedCallDetail);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;