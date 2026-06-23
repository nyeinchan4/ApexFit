'use strict';
const pool = require('../config/db');

const PaymentModel = {
  async findAll({ status, limit = 50, offset = 0 } = {}) {
    const conditions = status ? `WHERE p.status = '${status}'` : '';
    const { rows } = await pool.query(
      `SELECT p.*, pl.name AS plan_name
       FROM payments p JOIN plans pl ON pl.id = p.plan_id
       ${conditions}
       ORDER BY p.submitted_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return rows;
  },

  async countAll({ status } = {}) {
    const conditions = status ? `WHERE status = $1` : '';
    const params = status ? [status] : [];
    const { rows } = await pool.query(
      `SELECT COUNT(*)::int AS total FROM payments ${conditions}`, params
    );
    return rows[0].total;
  },

  async findById(id) {
    const { rows } = await pool.query(
      `SELECT p.*, pl.name AS plan_name
       FROM payments p JOIN plans pl ON pl.id = p.plan_id
       WHERE p.id = $1`,
      [id]
    );
    return rows[0] || null;
  },

  async findByUserId(user_id) {
    const { rows } = await pool.query(
      `SELECT p.*, pl.name AS plan_name
       FROM payments p JOIN plans pl ON pl.id = p.plan_id
       WHERE p.user_id = $1
       ORDER BY p.submitted_at DESC`,
      [user_id]
    );
    return rows;
  },

  async create({ user_id, plan_id, amount_mmk, method = 'cash', reference_id, notes }) {
    const { rows } = await pool.query(
      `INSERT INTO payments (user_id, plan_id, amount_mmk, method, reference_id, notes)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [user_id, plan_id, amount_mmk, method, reference_id || null, notes || null]
    );
    return rows[0];
  },

  async verify(id, { verified_by, subscription_id }) {
    const { rows } = await pool.query(
      `UPDATE payments
       SET status = 'verified', verified_by = $1, verified_at = NOW(),
           subscription_id = $2, updated_at = NOW()
       WHERE id = $3 AND status = 'pending'
       RETURNING *`,
      [verified_by, subscription_id, id]
    );
    return rows[0] || null;
  },

  async reject(id, verified_by) {
    const { rows } = await pool.query(
      `UPDATE payments
       SET status = 'rejected', verified_by = $1, verified_at = NOW(), updated_at = NOW()
       WHERE id = $2 AND status = 'pending'
       RETURNING *`,
      [verified_by, id]
    );
    return rows[0] || null;
  },

  async pendingTotal() {
    const { rows } = await pool.query(
      `SELECT COUNT(*)::int AS count, COALESCE(SUM(amount_mmk),0) AS total_mmk
       FROM payments WHERE status = 'pending'`
    );
    return rows[0];
  },
};

module.exports = PaymentModel;
