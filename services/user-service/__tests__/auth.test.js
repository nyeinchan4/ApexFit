'use strict';
const request = require('supertest');
const app = require('../../src/app');

// Mock DB and token service so tests run without a real DB
jest.mock('../../src/config/db', () => ({
  query: jest.fn(),
  connect: jest.fn().mockResolvedValue({ release: jest.fn(), query: jest.fn() }),
  on: jest.fn(),
}));

jest.mock('../../src/models/user.model');
const UserModel = require('../../src/models/user.model');

const mockUser = {
  id: 'uuid-1234',
  email: 'alex@apexfit.com',
  first_name: 'Alex',
  last_name: 'Johnson',
  role: 'member',
  is_active: true,
  password_hash: '$2a$12$hashed',
};

describe('POST /api/v1/auth/register', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 201 with accessToken on valid registration', async () => {
    UserModel.findByEmail.mockResolvedValue(null);
    UserModel.create.mockResolvedValue(mockUser);
    UserModel.saveRefreshToken.mockResolvedValue();

    const res = await request(app).post('/api/v1/auth/register').send({
      email: 'alex@apexfit.com',
      password: 'SecurePass123',
      first_name: 'Alex',
      last_name: 'Johnson',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('accessToken');
  });

  it('returns 409 when email already exists', async () => {
    UserModel.findByEmail.mockResolvedValue(mockUser);

    const res = await request(app).post('/api/v1/auth/register').send({
      email: 'alex@apexfit.com',
      password: 'SecurePass123',
      first_name: 'Alex',
      last_name: 'Johnson',
    });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('returns 422 on missing required fields', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      email: 'bad-email',
    });
    expect(res.status).toBe(422);
  });
});

describe('POST /api/v1/auth/login', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 for unknown email', async () => {
    UserModel.findByEmail.mockResolvedValue(null);

    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'ghost@apexfit.com',
      password: 'anything',
    });
    expect(res.status).toBe(401);
  });

  it('returns 403 for deactivated account', async () => {
    UserModel.findByEmail.mockResolvedValue({ ...mockUser, is_active: false });

    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'alex@apexfit.com',
      password: 'SecurePass123',
    });
    expect(res.status).toBe(403);
  });
});

describe('GET /health', () => {
  it('returns 200 with service info', async () => {
    const pool = require('../../src/config/db');
    pool.query.mockResolvedValue({ rows: [{ '?column?': 1 }] });

    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('service');
    expect(res.body).toHaveProperty('uptime');
  });
});
