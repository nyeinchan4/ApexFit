'use strict';
const express    = require('express');
const UserModel  = require('../models/user.model');
const { authenticate } = require('../middleware/auth.middleware');
const logger     = require('../config/logger');

const router = express.Router();

/**
 * GET /api/v1/admin/members
 * Returns paginated list of all users.
 * Requires a valid JWT (admin-service forwards its token).
 */
router.get('/members', authenticate, async (req, res, next) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page  || '1',  10));
    const limit = Math.min(100, parseInt(req.query.limit || '20', 10));
    const role  = req.query.role || undefined;

    const result = await UserModel.listAll({ page, limit, role });
    logger.info(`[Admin] listMembers page=${page} total=${result.pagination.total}`);
    return res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
