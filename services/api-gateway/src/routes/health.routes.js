'use strict';
const express = require('express');
const axios   = require('axios');

const router = express.Router();

const ping = async (url, name) => {
  try {
    const { data } = await axios.get(`${url}/health`, { timeout: 3000 });
    return { name, status: data.db === 'ok' ? 'ok' : 'degraded', uptime: data.uptime };
  } catch {
    return { name, status: 'unreachable' };
  }
};

/**
 * GET /health
 * Shallow self-check — always returns 200 as long as the gateway process is alive.
 * Used for Kubernetes liveness and readiness probes.
 * Downstream service failures should NOT kill the gateway pod.
 */
router.get('/', async (req, res) => {
  return res.status(200).json({
    success:   true,
    gateway:   'api-gateway',
    version:   '1.0.0',
    uptime:    process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /health/deep
 * Aggregates health from all three downstream services.
 * Use for monitoring dashboards / manual diagnosis only — NOT used by kube probes.
 */
router.get('/deep', async (req, res) => {
  const [userSvc, membershipSvc, adminSvc] = await Promise.all([
    ping(process.env.USER_SERVICE_URL       || 'http://localhost:3001', 'user-service'),
    ping(process.env.MEMBERSHIP_SERVICE_URL || 'http://localhost:3002', 'membership-service'),
    ping(process.env.ADMIN_SERVICE_URL      || 'http://localhost:3003', 'admin-service'),
  ]);

  const services   = [userSvc, membershipSvc, adminSvc];
  const allHealthy = services.every(s => s.status === 'ok');

  return res.status(allHealthy ? 200 : 503).json({
    success:  allHealthy,
    gateway:  'api-gateway',
    version:  '1.0.0',
    uptime:   process.uptime(),
    services: { userSvc, membershipSvc, adminSvc },
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
