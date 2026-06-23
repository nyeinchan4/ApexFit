'use strict';
const AuditModel = require('../models/auditlog.model');

const AuditController = {
  /** GET /api/v1/audit — paginated audit log for admin review */
  async list(req, res, next) {
    try {
      const { actor_id, action, page = 1, limit = 50 } = req.query;
      const offset = (page - 1) * limit;
      const [logs, total] = await Promise.all([
        AuditModel.findAll({ actor_id, action, limit: Number(limit), offset: Number(offset) }),
        AuditModel.count({ actor_id, action }),
      ]);
      return res.json({
        success: true,
        data: { logs, pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) } },
      });
    } catch (err) { next(err); }
  },
};

module.exports = AuditController;
