const jwt = require('jsonwebtoken');
const User = require('../models/User');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;

// Role-based access control middleware
const auth = (roles = []) => {
  if (typeof roles === 'string') {
    roles = [roles];
  }

  return async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(403).json({ error: 'Token missing' });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Verify user exists and is active
      const user = await User.findOne({
        _id: decoded.userId,
        isActive: true
      });

      if (!user) {
        return res.status(401).json({ error: 'User not found or inactive' });
      }

      // Check for inactive sessions (moved this inside auth middleware)
      await checkInactiveSessions(user);

      // If roles are specified, check if user has required role
      if (roles.length && !roles.includes(decoded.role)) {
        return res.status(403).json({ error: 'Insufficient privileges' });
      }
      
      req.user = decoded;
      next();
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  };
};

// Session checking function (now standalone)
const checkInactiveSessions = async (user) => {
  // Check for sessions older than 8 hours without logout
  const cutoff = new Date(Date.now() - 8 * 60 * 60 * 1000);
  
  let needsSave = false;
  
  user.loginHistory.forEach(session => {
    if (!session.logoutTime && session.loginTime < cutoff) {
      const logoutTime = new Date(session.loginTime.getTime() + 8 * 60 * 60 * 1000);
      session.logoutTime = logoutTime;
      session.sessionDuration = 8 * 60; // 8 hours in minutes
      user.totalHoursWorked += 8;
      needsSave = true;
    }
  });

  if (needsSave) {
    await user.save();
  }
};

module.exports = {
  auth,
  checkInactiveSessions
};