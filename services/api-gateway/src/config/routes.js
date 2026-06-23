'use strict';

/**
 * Centralised routing table.
 * Maps URL path prefixes to their target microservice.
 *
 * The gateway strips the matched prefix and forwards the rest.
 * Example:
 *   Incoming:  POST /api/v1/auth/login
 *   Forwarded: POST http://user-service:3001/api/v1/auth/login
 */
const routes = [
  // ── User Service  (port 3001) ────────────────────────────────────────────
  {
    prefix: '/api/v1/auth',
    target: process.env.USER_SERVICE_URL || 'http://localhost:3001',
    rateLimit: { windowMs: 15 * 60 * 1000, max: 30 },   // strict — auth routes
    public: true,   // no JWT pre-check needed
  },
  {
    prefix: '/api/v1/profile',
    target: process.env.USER_SERVICE_URL || 'http://localhost:3001',
    rateLimit: { windowMs: 15 * 60 * 1000, max: 100 },
    public: false,
  },

  // ── Membership Service  (port 3002) ──────────────────────────────────────
  {
    prefix: '/api/v1/plans',
    target: process.env.MEMBERSHIP_SERVICE_URL || 'http://localhost:3002',
    rateLimit: { windowMs: 15 * 60 * 1000, max: 200 },
    public: true,   // plan listing is public
  },
  {
    prefix: '/api/v1/subscriptions',
    target: process.env.MEMBERSHIP_SERVICE_URL || 'http://localhost:3002',
    rateLimit: { windowMs: 15 * 60 * 1000, max: 100 },
    public: false,
  },
  {
    prefix: '/api/v1/payments',
    target: process.env.MEMBERSHIP_SERVICE_URL || 'http://localhost:3002',
    rateLimit: { windowMs: 15 * 60 * 1000, max: 100 },
    public: false,
  },

  // ── Admin Service  (port 3003) ───────────────────────────────────────────
  {
    prefix: '/api/v1/dashboard',
    target: process.env.ADMIN_SERVICE_URL || 'http://localhost:3003',
    rateLimit: { windowMs: 15 * 60 * 1000, max: 200 },
    public: false,
    roles: ['staff', 'admin'],
  },
  {
    prefix: '/api/v1/members',
    target: process.env.ADMIN_SERVICE_URL || 'http://localhost:3003',
    rateLimit: { windowMs: 15 * 60 * 1000, max: 100 },
    public: false,
    roles: ['staff', 'admin'],
  },
  {
    prefix: '/api/v1/staff',
    target: process.env.ADMIN_SERVICE_URL || 'http://localhost:3003',
    rateLimit: { windowMs: 15 * 60 * 1000, max: 60 },
    public: false,
    roles: ['admin'],
  },
  {
    prefix: '/api/v1/audit',
    target: process.env.ADMIN_SERVICE_URL || 'http://localhost:3003',
    rateLimit: { windowMs: 15 * 60 * 1000, max: 60 },
    public: false,
    roles: ['staff', 'admin'],
  },
];

module.exports = routes;
