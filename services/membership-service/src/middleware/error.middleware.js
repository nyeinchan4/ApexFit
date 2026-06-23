'use strict';
const logger = require('../config/logger');

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  logger.error(`[Error] ${req.method} ${req.originalUrl} — ${err.message}`, { stack: err.stack });

  if (err.code === '23505') return res.status(409).json({ success: false, error: 'Duplicate entry — record already exists.' });
  if (err.code === '23503') return res.status(400).json({ success: false, error: 'Referenced resource does not exist.' });
  if (err.code === '22P02') return res.status(400).json({ success: false, error: 'Invalid UUID format.' });

  const status = err.statusCode || err.status || 500;
  const message = process.env.NODE_ENV === 'production' && status === 500
    ? 'An unexpected error occurred.' : err.message;

  return res.status(status).json({ success: false, error: message });
};

module.exports = { errorHandler };
