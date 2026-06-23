'use strict';
const express = require('express');
const DashboardController = require('../controllers/dashboard.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// Staff + Admin can view the dashboard
router.get('/', authenticate, authorize('staff', 'admin'), DashboardController.getSummary);

module.exports = router;
