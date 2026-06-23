'use strict';
const pool = require('../config/db');

const SubscriptionModel = {
  async findByUserId(user_id) {
    const { rows } = await pool.query(
      `SELECT s.*, p.name AS plan_name, p.price_mmk, p.features
       FROM subscriptions s
       JOIN plans p ON p.id = s.plan_id
       WHERE s.user_id = $1
       ORDER BY s.created_at DESC`,
      [user_id]
    );
    return rows;
  },

  async findActiveByUserId(user_id) {
    const { rows } = await pool.query(
      `SELECT s.*, p.name AS plan_name, p.price_mmk, p.duration_days, p.features
       FROM subscriptions s
       JOIN plans p ON p.id = s.plan_id
       WHERE s.user_id = $1 AND s.status = 'active' AND s.expires_at > NOW()
       ORDER BY s.expires_at DESC LIMIT 1`,
      [user_id]
    );
    return rows[0] || null;
  },

  async findById(id) {
    const { rows } = await pool.query(
      `SELECT s.*, p.name AS plan_name, p.price_mmk, p.features
       FROM subscriptions s JOIN plans p ON p.id = s.plan_id
       WHERE s.id = $1`,
      [id]
    );
    return rows[0] || null;
  },

  async create({ user_id, plan_id, status = 'pending' }) {
    const { rows } = await pool.query(
      `INSERT INTO subscriptions (user_id, plan_id, status)
       VALUES ($1, $2, $3) RETURNING *`,
      [user_id, plan_id, status]
    );
    return rows[0];
  },

  /**
   * Activate subscription — sets starts_at and expires_at based on plan duration
   */
  async activate(id, duration_days) {
    const now = new Date();
    const expires = new Date(now.getTime() + duration_days * 24 * 60 * 60 * 1000);
    const { rows } = await pool.query(
      `UPDATE subscriptions
       SET status = 'active', starts_at = $1, expires_at = $2, updated_at = NOW()
       WHERE id = $3 RETURNING *`,
      [now, expires, id]
    );
    return rows[0] || null;
  },

  async updateStatus(id, status) {
    const { rows } = await pool.query(
      `UPDATE subscriptions SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [status, id]
    );
    return rows[0] || null;
  },

  /**
   * Called by the cron job — bulk-expire overdue subscriptions
   */
  async expireOverdue() {
    const { rowCount } = await pool.query(
      `UPDATE subscriptions
       SET status = 'expired', updated_at = NOW()
       WHERE status = 'active' AND expires_at <= NOW()`
    );
    return rowCount;
  },

  /**
   * Days remaining for a subscription (used by mobile dashboard gauge)
   */
  async getDaysRemaining(user_id) {
    const { rows } = await pool.query(
      `SELECT s.id,
              s.user_id,
              s.plan_id,
              s.status,
              s.starts_at,
              s.expires_at,
              GREATEST(0, EXTRACT(DAY FROM (s.expires_at - NOW()))::int) AS days_remaining,
              p.name AS plan_name,
              p.duration_days,
              p.price_mmk
       FROM subscriptions s
       JOIN plans p ON p.id = s.plan_id
       WHERE s.user_id = $1 AND s.status = 'active'
       ORDER BY s.expires_at DESC LIMIT 1`,
      [user_id]
    );
    return rows[0] || null;
  },

  async manualExtend(id, extra_days) {
    const { rows } = await pool.query(
      `UPDATE subscriptions
       SET expires_at = expires_at + ($1 || ' days')::interval, updated_at = NOW()
       WHERE id = $2 RETURNING *`,
      [extra_days, id]
    );
    return rows[0] || null;
  },
};

module.exports = SubscriptionModel;
