'use strict';
const express = require('express');
const AuditController = require('../controllers/audit.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// Both staff and admin can browse audit logs
router.get('/', authenticate, authorize('staff', 'admin'), AuditController.list);

module.exports = router;
