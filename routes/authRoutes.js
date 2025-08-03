const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();
require('dotenv').config();
const { auth } = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET;

// Login route
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'User is deactivated' });
    }

    // Token generation
    const token = user.generateAuthToken(); // Make sure this method exists
    res.json({
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


router.post('/logout', auth(), async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const lastLogin = user.loginHistory[user.loginHistory.length - 1];
    if (lastLogin && !lastLogin.logoutAt) {
      lastLogin.logoutAt = new Date();
      lastLogin.durationMinutes = Math.round(
        (new Date() - new Date(lastLogin.loginAt)) / 60000
      );
      await user.save();
    }

    res.json({ message: 'Logout recorded' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;