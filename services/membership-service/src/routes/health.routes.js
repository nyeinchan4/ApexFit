'use strict';
const express = require('express');
const pool = require('../config/db');

const router = express.Router();

router.get('/', async (req, res) => {
  let dbStatus = 'ok';
  try { await pool.query('SELECT 1'); } catch { dbStatus = 'error'; }

  return res.status(dbStatus === 'ok' ? 200 : 503).json({
    success: dbStatus === 'ok',
    service: process.env.SERVICE_NAME || 'membership-service',
    version: '1.0.0',
    uptime: process.uptime(),
    db: dbStatus,
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
