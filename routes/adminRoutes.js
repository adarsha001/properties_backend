  const express = require('express');
  const bcrypt = require('bcryptjs');
  const User = require('../models/User');
  const router = express.Router();
const { auth } = require('../middleware/auth');

  // Create new user (admin only)

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