  const express = require('express');
  const bcrypt = require('bcryptjs');
  const User = require('../models/User');
  const router = express.Router();
const { auth } = require('../middleware/auth');

  // Create new user (admin only)

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
  router.post('/users', auth(['admin']), async (req, res) => {
    try {
      const { username, password, email, fullName, role } = req.body;

      // Check if user exists
      const existingUser = await User.findOne({ 
        $or: [{ username }, { email }] 
      });
      
      if (existingUser) {
        return res.status(400).json({ 
          error: 'Username or email already exists' 
        });
      }

      // Create user
      const user = new User({
        username,
        password,
        email,
        fullName,
        role,
        createdBy: req.user.userId
      });

      await user.save();
      
      // Return user without password
      const userObj = user.toObject();
      delete userObj.password;

      res.status(201).json(userObj);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get all users (admin only)
  router.get('/users', auth(['admin']), async (req, res) => {
    try {
      const users = await User.find()
        .select('-password')
        .populate('createdBy', 'username');

      res.json(users);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update user (admin only)
  router.put('/users/:id', auth(['admin']), async (req, res) => {
    try {
      const { fullName, email, role, isActive } = req.body;
      
      const updates = {};
      if (fullName) updates.fullName = fullName;
      if (email) updates.email = email;
      if (role) updates.role = role;
      if (typeof isActive === 'boolean') updates.isActive = isActive;

      const user = await User.findByIdAndUpdate(
        req.params.id,
        updates,
        { new: true }
      ).select('-password');

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json(user);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

// In your chat routes file (routes/chat.js)
  router.put('/batch-assign', verifyTokenAndRole(['admin']), async (req, res) => {
    try {
      const { chatIds, managerId } = req.body;
      
      // Validate inputs
      if (!Array.isArray(chatIds)) {
        return res.status(400).json({ error: 'chatIds must be an array' });
      }
      if (!managerId) {
        return res.status(400).json({ error: 'managerId is required' });
      }

      // Verify manager exists and is active
      const manager = await User.findOne({ 
        _id: managerId,
        role: 'manager',
        isActive: true 
      });
      
      if (!manager) {
        return res.status(400).json({ error: 'Invalid manager specified or manager not active' });
      }

      // Update all chats in a single operation
      const result = await Chat.updateMany(
        { _id: { $in: chatIds } },
        { assignedTo: managerId }
      );

      if (result.nModified === 0) {
        return res.status(404).json({ error: 'No chats were updated' });
      }

      // Fetch updated chats to return
      const updatedChats = await Chat.find({ _id: { $in: chatIds } })
        .populate('assignedTo', 'username fullName');

      res.json({
        message: `Successfully assigned ${result.nModified} chats`,
        chats: updatedChats
      });
    } catch (err) {
      console.error('Batch assignment error:', err);
      res.status(500).json({ 
        error: 'Failed to assign chats',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  });



router.get('/users/:id/history', auth(['admin', 'manager']), async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.userId !== req.params.id) {
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    const user = await User.findById(req.params.id)
      .select('loginHistory fullName username');

    if (!user) return res.status(404).json({ error: 'User not found' });

    // Group login records by date
    const grouped = {};
    user.loginHistory.forEach(entry => {
      const date = new Date(entry.loginAt).toISOString().split('T')[0];
      if (!grouped[date]) {
        grouped[date] = {
          entries: [],
          totalMinutes: 0
        };
      }
      const minutes = entry.durationMinutes || 0;
      grouped[date].entries.push({
        loginAt: entry.loginAt,
        logoutAt: entry.logoutAt,
        durationMinutes: minutes
      });
      grouped[date].totalMinutes += minutes;
    });

    res.json({
      user: {
        id: user._id,
        username: user.username,
        fullName: user.fullName
      },
      dailyLoginSummary: grouped
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


  module.exports = router;