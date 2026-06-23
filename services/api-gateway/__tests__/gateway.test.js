'use strict';
const request = require('supertest');

// Mock http-proxy-middleware before requiring app
jest.mock('http-proxy-middleware', () => ({
  createProxyMiddleware: () => (req, res, next) => next(),
}));

jest.mock('axios');
const axios = require('axios');

const app = require('../../src/app');

describe('GET /health', () => {
  it('returns 200 when all services are healthy', async () => {
    axios.get.mockResolvedValue({ data: { db: 'ok', uptime: 120 } });

    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty('services');
  });

  it('returns 503 when a service is unreachable', async () => {
    axios.get
      .mockRejectedValueOnce(new Error('ECONNREFUSED'))   // user-service down
      .mockResolvedValue({ data: { db: 'ok', uptime: 90 } });

    const res = await request(app).get('/health');
    expect(res.status).toBe(503);
    expect(res.body.success).toBe(false);
  });
});

describe('GET /api/v1/profile (protected route without token)', () => {
  it('returns 401 when no Authorization header is provided', async () => {
    const res = await request(app).get('/api/v1/profile/me');
    expect(res.status).toBe(401);
  });
});

describe('GET /unknown-route', () => {
  it('returns 404 for unregistered paths', async () => {
    const res = await request(app).get('/api/v1/unknown');
    expect(res.status).toBe(404);
  });
});
