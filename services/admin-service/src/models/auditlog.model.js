'use strict';
const pool = require('../config/db');

const AuditModel = {
  async log({ actor_id, actor_email, action, entity_type, entity_id, metadata, ip_address }) {
    await pool.query(
      `INSERT INTO audit_logs (actor_id, actor_email, action, entity_type, entity_id, metadata, ip_address)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [actor_id, actor_email || null, action, entity_type || null,
       entity_id || null, JSON.stringify(metadata || {}), ip_address || null]
    );
  },

  async findAll({ actor_id, action, limit = 50, offset = 0 } = {}) {
    const conditions = [];
    const params = [];
    if (actor_id) { params.push(actor_id); conditions.push(`actor_id = $${params.length}`); }
    if (action)   { params.push(action);   conditions.push(`action = $${params.length}`); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    params.push(limit, offset);

    const { rows } = await pool.query(
      `SELECT * FROM audit_logs ${where}
       ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    return rows;
  },

  async count({ actor_id, action } = {}) {
    const conditions = [];
    const params = [];
    if (actor_id) { params.push(actor_id); conditions.push(`actor_id = $${params.length}`); }
    if (action)   { params.push(action);   conditions.push(`action = $${params.length}`); }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await pool.query(`SELECT COUNT(*)::int AS total FROM audit_logs ${where}`, params);
    return rows[0].total;
  },
};

module.exports = AuditModel;
