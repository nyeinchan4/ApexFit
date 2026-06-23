'use strict';
const request = require('supertest');
const app = require('../../src/app');

jest.mock('../../src/config/db', () => ({
  query: jest.fn(),
  connect: jest.fn().mockResolvedValue({ release: jest.fn(), query: jest.fn() }),
  on: jest.fn(),
}));

jest.mock('../../src/models/plan.model');
jest.mock('../../src/models/subscription.model');
jest.mock('../../src/models/payment.model');

const PlanModel = require('../../src/models/plan.model');

const mockPlan = {
  id: 'plan-uuid-1',
  name: 'Basic',
  description: 'Essential',
  price_mmk: 45000,
  duration_days: 30,
  features: ['Access to gym equipment'],
  is_active: true,
};

describe('GET /api/v1/plans', () => {
  it('returns 200 with a list of plans', async () => {
    PlanModel.findAll.mockResolvedValue([mockPlan]);
    const res = await request(app).get('/api/v1/plans');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.plans).toHaveLength(1);
    expect(res.body.data.plans[0].name).toBe('Basic');
  });
});

describe('GET /api/v1/plans/:id', () => {
  it('returns 404 for unknown plan', async () => {
    PlanModel.findById.mockResolvedValue(null);
    const res = await request(app).get('/api/v1/plans/nonexistent-id');
    expect(res.status).toBe(404);
  });

  it('returns 200 with plan data', async () => {
    PlanModel.findById.mockResolvedValue(mockPlan);
    const res = await request(app).get(`/api/v1/plans/${mockPlan.id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.plan.price_mmk).toBe(45000);
  });
});

describe('GET /health', () => {
  it('returns 200 with service metadata', async () => {
    const pool = require('../../src/config/db');
    pool.query.mockResolvedValue({});
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('uptime');
  });
});
