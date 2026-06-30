'use strict';
const express = require('express');
const pool = require('../config/db');
const userClient       = require('../services/userService.client');
const membershipClient = require('../services/membershipService.client');

const router = express.Router();

/**
 * GET /health
 * Shallow check — only verifies this service's own DB.
 * Used by Kubernetes liveness & readiness probes.
 * Downstream dependencies are intentionally excluded so that
 * a transient fault in user-service or membership-service does
 * NOT cause this pod to be killed and restarted.
 */
router.get('/', async (req, res) => {
  let dbStatus = 'ok';
  try { await pool.query('SELECT 1'); } catch { dbStatus = 'error'; }

  const ok = dbStatus === 'ok';
  return res.status(ok ? 200 : 503).json({
    success: ok,
    service: process.env.SERVICE_NAME || 'admin-service',
    version: '1.0.0',
    uptime:  process.uptime(),
    db:      dbStatus,
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /health/deep
 * Deep check — includes downstream service connectivity.
 * Use this for monitoring dashboards / manual diagnosis only.
 * NOT used by kube probes.
 */
router.get('/deep', async (req, res) => {
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
    uptime:  process.uptime(),
    db:      dbStatus,
    downstream: {
      user_service:       userSvc.db       || 'unknown',
      membership_service: membershipSvc.db || 'unknown',
    },
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
