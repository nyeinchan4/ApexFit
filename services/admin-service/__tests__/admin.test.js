'use strict';
const request = require('supertest');
const app = require('../../src/app');

jest.mock('../../src/config/db', () => ({
  query: jest.fn().mockResolvedValue({}),
  connect: jest.fn().mockResolvedValue({ release: jest.fn(), query: jest.fn() }),
  on: jest.fn(),
}));

jest.mock('../../src/services/userService.client', () => ({
  healthCheck: jest.fn().mockResolvedValue({ success: true, db: 'ok' }),
  listMembers: jest.fn().mockResolvedValue({ success: true, data: { members: [] } }),
}));

jest.mock('../../src/services/membershipService.client', () => ({
  healthCheck:       jest.fn().mockResolvedValue({ success: true, db: 'ok' }),
  getDashboardKpis:  jest.fn().mockResolvedValue({ pending_payments: 5, pending_total_mmk: 270000, total_payments: 80 }),
  getPendingPayments:jest.fn().mockResolvedValue({ data: { payments: [], pagination: { total: 5 } } }),
}));

jest.mock('../../src/models/auditlog.model');
jest.mock('../../src/models/staff.model');

describe('GET /health', () => {
  it('returns 200 with service and downstream status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('downstream');
    expect(res.body.downstream.user_service).toBe('ok');
  });
});

describe('GET /api/v1/dashboard (unauthenticated)', () => {
  it('returns 401 without a token', async () => {
    const res = await request(app).get('/api/v1/dashboard');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/v1/audit (unauthenticated)', () => {
  it('returns 401 without a token', async () => {
    const res = await request(app).get('/api/v1/audit');
    expect(res.status).toBe(401);
  });
});
