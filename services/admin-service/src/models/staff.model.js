'use strict';
const pool = require('../config/db');

const StaffModel = {
  async findAll() {
    const { rows } = await pool.query(`SELECT id, user_id, email, full_name, role, is_active, created_at FROM staff ORDER BY created_at DESC`);
    return rows;
  },

  async findByUserId(user_id) {
    const { rows } = await pool.query('SELECT * FROM staff WHERE user_id = $1 LIMIT 1', [user_id]);
    return rows[0] || null;
  },

  async findById(id) {
    const { rows } = await pool.query('SELECT * FROM staff WHERE id = $1 LIMIT 1', [id]);
    return rows[0] || null;
  },

  async create({ user_id, email, full_name, role = 'staff' }) {
    const { rows } = await pool.query(
      `INSERT INTO staff (user_id, email, full_name, role) VALUES ($1,$2,$3,$4)
       RETURNING id, user_id, email, full_name, role, is_active, created_at`,
      [user_id, email, full_name, role]
    );
    return rows[0];
  },

  async update(id, { full_name, role, is_active }) {
    const { rows } = await pool.query(
      `UPDATE staff SET
        full_name = COALESCE($1, full_name),
        role      = COALESCE($2, role),
        is_active = COALESCE($3, is_active),
        updated_at = NOW()
       WHERE id = $4 RETURNING *`,
      [full_name, role, is_active, id]
    );
    return rows[0] || null;
  },
};

module.exports = StaffModel;
