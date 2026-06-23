'use strict';
const logger = require('../config/logger');

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  logger.error(`[Error] ${req.method} ${req.originalUrl} — ${err.message}`, { stack: err.stack });

  // Downstream service errors (axios)
  if (err.response) {
    const { status, data } = err.response;
    return res.status(status).json({ success: false, error: data?.error || 'Upstream service error.', upstream: data });
  }
  if (err.request) {
    return res.status(503).json({ success: false, error: 'Downstream service unreachable.' });
  }

  if (err.code === '23505') return res.status(409).json({ success: false, error: 'Duplicate entry.' });
  if (err.code === '22P02') return res.status(400).json({ success: false, error: 'Invalid UUID format.' });

  const status = err.statusCode || err.status || 500;
  return res.status(status).json({
    success: false,
    error: process.env.NODE_ENV === 'production' && status === 500 ? 'Unexpected error.' : err.message,
  });
};

module.exports = { errorHandler };
