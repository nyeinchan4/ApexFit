'use strict';
const pool = require('../config/db');

const PlanModel = {
  async findAll(includeInactive = false) {
    const { rows } = await pool.query(
      `SELECT * FROM plans ${includeInactive ? '' : 'WHERE is_active = TRUE'} ORDER BY price_mmk ASC`
    );
    return rows;
  },

  async findById(id) {
    const { rows } = await pool.query('SELECT * FROM plans WHERE id = $1', [id]);
    return rows[0] || null;
  },

  async create({ name, description, price_mmk, duration_days, features }) {
    const { rows } = await pool.query(
      `INSERT INTO plans (name, description, price_mmk, duration_days, features)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, description, price_mmk, duration_days, JSON.stringify(features || [])]
    );
    return rows[0];
  },

  async update(id, { name, description, price_mmk, duration_days, features, is_active }) {
    const { rows } = await pool.query(
      `UPDATE plans SET
        name          = COALESCE($1, name),
        description   = COALESCE($2, description),
        price_mmk     = COALESCE($3, price_mmk),
        duration_days = COALESCE($4, duration_days),
        features      = COALESCE($5, features),
        is_active     = COALESCE($6, is_active),
        updated_at    = NOW()
       WHERE id = $7 RETURNING *`,
      [name, description, price_mmk, duration_days,
       features ? JSON.stringify(features) : null, is_active, id]
    );
    return rows[0] || null;
  },

  async delete(id) {
    const { rowCount } = await pool.query('DELETE FROM plans WHERE id = $1', [id]);
    return rowCount > 0;
  },
};

module.exports = PlanModel;
