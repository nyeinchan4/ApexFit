'use strict';
const pool = require('../config/db');

const UserModel = {
  /**
   * Find a user by email
   */
  async findByEmail(email) {
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE email = $1 LIMIT 1',
      [email.toLowerCase()]
    );
    return rows[0] || null;
  },

  /**
   * Find a user by username
   */
  async findByUsername(username) {
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE username = $1 LIMIT 1',
      [username]
    );
    return rows[0] || null;
  },

  /**
   * Find a user by ID (safe — no password returned)
   */
  async findById(id) {
    const { rows } = await pool.query(
      `SELECT id, email, username, phone, role, is_active, created_at, updated_at
       FROM users WHERE id = $1 LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  },

  /**
   * Create a new user
   */
  async create({ email, username, password_hash, phone, role = 'member' }) {
    const { rows } = await pool.query(
      `INSERT INTO users (email, username, password_hash, phone, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, username, phone, role, is_active, created_at`,
      [email.toLowerCase(), username, password_hash, phone || null, role]
    );
    return rows[0];
  },

  /**
   * Update profile fields
   */
  async updateProfile(id, { username, phone }) {
    const { rows } = await pool.query(
      `UPDATE users
       SET username   = COALESCE($1, username),
           phone      = COALESCE($2, phone),
           updated_at = NOW()
       WHERE id = $3
       RETURNING id, email, username, phone, role, updated_at`,
      [username, phone, id]
    );
    return rows[0] || null;
  },

  /**
   * Update password
   */
  async updatePassword(id, password_hash) {
    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [password_hash, id]
    );
  },

  /**
   * Save a refresh token
   */
  async saveRefreshToken(user_id, token, expires_at) {
    await pool.query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id) DO UPDATE SET token = $2, expires_at = $3, created_at = NOW()`,
      [user_id, token, expires_at]
    );
  },

  /**
   * Find a refresh token
   */
  async findRefreshToken(token) {
    const { rows } = await pool.query(
      `SELECT rt.*, u.id as user_id, u.role, u.is_active
       FROM refresh_tokens rt
       JOIN users u ON u.id = rt.user_id
       WHERE rt.token = $1 AND rt.expires_at > NOW()
       LIMIT 1`,
      [token]
    );
    return rows[0] || null;
  },

  /**
   * Delete a refresh token (logout)
   */
  async deleteRefreshToken(user_id) {
    await pool.query('DELETE FROM refresh_tokens WHERE user_id = $1', [user_id]);
  },
  /**
   * List all users (admin only) with pagination
   */
  async listAll({ page = 1, limit = 20, role } = {}) {
    const offset = (page - 1) * limit;
    const conditions = [];
    const values = [];
    if (role) {
      conditions.push(`role = $${values.length + 1}`);
      values.push(role);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const countQ = await pool.query(`SELECT COUNT(*) FROM users ${where}`, values);
    const total  = parseInt(countQ.rows[0].count, 10);
    values.push(limit, offset);
    const { rows } = await pool.query(
      `SELECT id, email, username, phone, role, is_active, created_at
       FROM users ${where}
       ORDER BY created_at DESC
       LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values
    );
    return {
      members: rows,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  },
};

module.exports = UserModel;
