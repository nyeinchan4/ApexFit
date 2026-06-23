'use strict';
const express = require('express');
const pool = require('../config/db');
const userClient       = require('../services/userService.client');
const membershipClient = require('../services/membershipService.client');

const router = express.Router();

router.get('/', async (req, res) => {
  let dbStatus = 'ok';
  try { await pool.query('SELECT 1'); } catch { dbStatus = 'error'; }

  const [userSvc, membershipSvc] = await Promise.all([
    userClient.healthCheck(),
    membershipClient.healthCheck(),
  ]);

  const allOk = dbStatus === 'ok' && userSvc.db !== 'error' && membershipSvc.db !== 'error';

  return res.status(allOk ? 200 : 503).json({
    success: allOk,
    service: process.env.SERVICE_NAME || 'admin-service',
    version: '1.0.0',
    uptime: process.uptime(),
    db: dbStatus,
    downstream: {
      user_service: userSvc.db || 'unknown',
      membership_service: membershipSvc.db || 'unknown',
    },
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
