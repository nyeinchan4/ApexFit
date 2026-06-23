'use strict';
const logger = require('../config/logger');

/**
 * Global error handler — must be the LAST middleware registered in app.js
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  logger.error(`[Error] ${req.method} ${req.originalUrl} — ${err.message}`, { stack: err.stack });

  // PostgreSQL unique violation
  if (err.code === '23505') {
    return res.status(409).json({ success: false, error: 'A record with that value already exists.' });
  }

  // PostgreSQL foreign key violation
  if (err.code === '23503') {
    return res.status(400).json({ success: false, error: 'Referenced resource does not exist.' });
  }

  const status = err.statusCode || err.status || 500;
  const message = process.env.NODE_ENV === 'production' && status === 500
    ? 'An unexpected error occurred.'
    : err.message;

  return res.status(status).json({ success: false, error: message });
};

module.exports = { errorHandler };
