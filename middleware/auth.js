const jwt = require('jsonwebtoken');
const { errorResponse } = require('../utils/responseFormatter');
const User = require('../models/User');
const Voter = require('../models/Voter');
const logger = require('../utils/logger');

/**
 * Protect routes - Verify JWT token and set user on request
 */
const protect = async (req, res, next) => {
  try {
    let token;
    
    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    // Check if token exists
    if (!token) {
      return res.status(401).json(errorResponse('Not authorized, no token provided', 401));
    }
    
    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Check if user exists based on role
      if (decoded.role === 'organizer') {
        req.user = await User.findById(decoded.id).select('-password');
      } else if (decoded.role === 'voter') {
        req.user = await Voter.findById(decoded.id).select('-password');
      } else {
        return res.status(401).json(errorResponse('Invalid user role', 401));
      }
      
      if (!req.user) {
        return res.status(401).json(errorResponse('User not found', 401));
      }
      
      // Add role to req.user
      req.user.role = decoded.role;
      
      next();
    } catch (error) {
      logger.error(`JWT verification error: ${error.message}`);
      return res.status(401).json(errorResponse('Not authorized, token invalid', 401));
    }
  } catch (error) {
    logger.error(`Auth middleware error: ${error.message}`);
    return res.status(500).json(errorResponse('Server error in authentication', 500));
  }
};

/**
 * Check if user has required role
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json(errorResponse('User not authenticated properly', 401));
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json(
        errorResponse(`User role "${req.user.role}" is not authorized to access this resource`, 403)
      );
    }
    
    next();
  };
};

module.exports = {
  protect,
  authorize
};