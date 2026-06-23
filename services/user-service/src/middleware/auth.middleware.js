'use strict';
const TokenService = require('../services/token.service');
const logger = require('../config/logger');

/**
 * Middleware: validate the Bearer access token in the Authorization header
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Authorization header missing or malformed.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = TokenService.verifyAccessToken(token);
    req.user = decoded; // { sub, role, iat, exp, iss }
    next();
  } catch (err) {
    logger.warn(`[Auth] Token verification failed: ${err.message}`);
    return res.status(401).json({ success: false, error: 'Access token invalid or expired.' });
  }
};

/**
 * Middleware: restrict access to specific roles
 */
const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, error: 'Forbidden: insufficient permissions.' });
  }
  next();
};

module.exports = { authenticate, authorize };
