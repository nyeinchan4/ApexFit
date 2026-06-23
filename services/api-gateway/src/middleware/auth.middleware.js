'use strict';
const jwt = require('jsonwebtoken');
const logger = require('../config/logger');

/**
 * Gateway-level JWT pre-validation.
 * Decodes the token and attaches req.user so downstream services
 * can trust the X-User-* headers we forward.
 *
 * Note: downstream services ALSO validate the token — defence in depth.
 */
const authenticate = (req, res, next) => {
  const header = req.headers['authorization'];
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Authorization header missing or malformed.' });
  }
  try {
    req.user = jwt.verify(header.split(' ')[1], process.env.JWT_ACCESS_SECRET);

    // Forward decoded identity to downstream for convenience
    req.headers['x-user-id']   = req.user.sub;
    req.headers['x-user-role'] = req.user.role;
    next();
  } catch (err) {
    logger.warn(`[Gateway] Auth failed: ${err.message}`);
    return res.status(401).json({ success: false, error: 'Invalid or expired access token.' });
  }
};

/**
 * Optional role check at the gateway before proxying.
 */
const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, error: 'Forbidden: insufficient permissions.' });
  }
  next();
};

module.exports = { authenticate, authorize };
