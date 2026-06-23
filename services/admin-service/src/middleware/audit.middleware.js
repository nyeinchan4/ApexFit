'use strict';
const AuditModel = require('../models/auditlog.model');
const logger = require('../config/logger');

const MUTATING = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

/**
 * Middleware: automatically logs every mutating request made by a staff/admin user.
 * Runs after auth so req.user is populated.
 */
const auditLogger = (req, res, next) => {
  if (!MUTATING.has(req.method) || !req.user) return next();

  // Capture original json() to intercept status
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    // Only audit successful mutations
    if (res.statusCode < 400 && req.user) {
      const [, , , entity_type, entity_id] = req.path.split('/');
      AuditModel.log({
        actor_id:    req.user.sub,
        actor_email: req.user.email,
        action:      `${req.method}:${req.path}`,
        entity_type: entity_type || null,
        entity_id:   entity_id   || null,
        metadata:    { body: req.body, status: res.statusCode },
        ip_address:  req.ip,
      }).catch(err => logger.error('[Audit] Failed to write log:', err.message));
    }
    return originalJson(body);
  };

  next();
};

module.exports = { auditLogger };
