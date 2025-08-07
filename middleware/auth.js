const jwt = require('jsonwebtoken');
const User = require('../models/User');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;
const SESSION_TIMEOUT_HOURS = 8;

// Role-based access control middleware
const auth = (roles = []) => {
  // Normalize roles to always be an array
  if (typeof roles === 'string') {
    roles = [roles];
  }

  return async (req, res, next) => {
    try {
      // Extract token from Authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
          error: 'Authentication required',
          details: 'Bearer token missing in Authorization header'
        });
      }

      const token = authHeader.split(' ')[1];
      
      // Verify JWT token
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Verify user exists and is active
      const user = await User.findOne({
        _id: decoded.userId,
        isActive: true
      }).select('+loginHistory');

      if (!user) {
        return res.status(401).json({ 
          error: 'Authentication failed',
          details: 'User not found or account inactive'
        });
      }

      // Check for inactive sessions and update if needed
      await checkInactiveSessions(user);

      // Check role permissions if required
      if (roles.length > 0 && !roles.includes(decoded.role)) {
        return res.status(403).json({ 
          error: 'Access denied',
          details: `Required role(s): ${roles.join(', ')}`
        });
      }
      
      // Attach user information to request
      req.user = {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        permissions: user.permissions // Add if your User model has permissions
      };

      // Log successful authentication
      console.log(`Authenticated user: ${user.username} (${user.role})`);

      next();
    } catch (err) {
      // Handle different error scenarios
      let status = 401;
      let error = 'Authentication failed';
      let details = err.message;

      if (err instanceof jwt.TokenExpiredError) {
        error = 'Token expired';
        details = 'Your session has expired. Please log in again.';
      } else if (err instanceof jwt.JsonWebTokenError) {
        error = 'Invalid token';
        details = 'Malformed or invalid authentication token';
      }

      console.error('Authentication error:', err.message);
      return res.status(status).json({ error, details });
    }
  };
};

/**
 * Checks for inactive sessions and updates them
 * @param {Object} user - Mongoose User document
 */
const checkInactiveSessions = async (user) => {
  try {
    const cutoff = new Date(Date.now() - SESSION_TIMEOUT_HOURS * 60 * 60 * 1000);
    let needsSave = false;
    
    user.loginHistory.forEach(session => {
      // Check for sessions without logout that are older than timeout
      if (!session.logoutTime && session.loginTime < cutoff) {
        const autoLogoutTime = new Date(session.loginTime.getTime() + SESSION_TIMEOUT_HOURS * 60 * 60 * 1000);
        
        session.logoutTime = autoLogoutTime;
        session.sessionDuration = SESSION_TIMEOUT_HOURS * 60; // in minutes
        session.autoLoggedOut = true;
        
        if (user.totalHoursWorked) {
          user.totalHoursWorked += SESSION_TIMEOUT_HOURS;
        } else {
          user.totalHoursWorked = SESSION_TIMEOUT_HOURS;
        }
        
        needsSave = true;
        
        console.log(`Auto-logged out session for user ${user.username} started at ${session.loginTime}`);
      }
    });

    if (needsSave) {
      await user.save();
    }
  } catch (err) {
    console.error('Error checking inactive sessions:', err);
    // Don't throw error as it shouldn't block authentication
  }
};
const authorize = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient privileges' });
    }
    next();
  };
};


module.exports = {
  auth,authorize,
  checkInactiveSessions
};