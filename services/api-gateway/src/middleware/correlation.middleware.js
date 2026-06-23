'use strict';
const { v4: uuidv4 } = require('uuid');
const logger = require('../config/logger');

/**
 * Attaches a unique X-Correlation-ID to every request and response.
 * Enables distributed tracing across all services.
 */
const correlationId = (req, res, next) => {
  const id = req.headers['x-correlation-id'] || uuidv4();
  req.correlationId = id;
  req.headers['x-correlation-id'] = id;   // forward to downstream
  res.setHeader('X-Correlation-ID', id);  // return in response
  next();
};

/**
 * Structured request logger using the correlation ID.
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    logger.info(
      `[${req.correlationId}] ${req.method} ${req.originalUrl} → ${res.statusCode} (${Date.now() - start}ms)`
    );
  });
  next();
};

module.exports = { correlationId, requestLogger };
