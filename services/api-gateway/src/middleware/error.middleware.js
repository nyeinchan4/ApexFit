'use strict';
const logger = require('../config/logger');

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  logger.error(`[${req.correlationId}] Gateway Error: ${err.message}`, { stack: err.stack });

  if (err.response) {
    return res.status(err.response.status).json({
      success: false,
      error: err.response.data?.error || 'Upstream service error.',
    });
  }
  if (err.request) {
    return res.status(503).json({ success: false, error: 'Downstream service is unreachable.' });
  }

  return res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'An unexpected gateway error occurred.' : err.message,
  });
};

module.exports = { errorHandler };
