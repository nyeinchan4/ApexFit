'use strict';
const jwt = require('jsonwebtoken');
const logger = require('../config/logger');

const authenticate = (req, res, next) => {
  const header = req.headers['authorization'];
  if (!header?.startsWith('Bearer '))
    return res.status(401).json({ success: false, error: 'Authorization header missing.' });
  try {
    req.user = jwt.verify(header.split(' ')[1], process.env.JWT_ACCESS_SECRET);
    next();
  } catch (err) {
    logger.warn(`[Auth] Token failed: ${err.message}`);
    return res.status(401).json({ success: false, error: 'Invalid or expired token.' });
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role))
    return res.status(403).json({ success: false, error: 'Forbidden: insufficient permissions.' });
  next();
};

module.exports = { authenticate, authorize };
