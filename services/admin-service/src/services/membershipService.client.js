'use strict';
const axios = require('axios');
const logger = require('../config/logger');

const BASE = process.env.MEMBERSHIP_SERVICE_URL || 'http://localhost:3002';

const membershipServiceClient = {
  _headers(token) {
    return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  },

  async getPlans(token) {
    const { data } = await axios.get(`${BASE}/api/v1/plans`, { headers: this._headers(token) });
    return data;
  },

  /** Pending payments queue — powers the cash verification screen */
  async getPendingPayments(token, { page = 1, limit = 20 } = {}) {
    const { data } = await axios.get(`${BASE}/api/v1/payments`, {
      headers: this._headers(token),
      params: { status: 'pending', page, limit },
    });
    return data;
  },

  /** All payments (any status) with pagination */
  async getAllPayments(token, { status, page = 1, limit = 20 } = {}) {
    const { data } = await axios.get(`${BASE}/api/v1/payments`, {
      headers: this._headers(token),
      params: { status, page, limit },
    });
    return data;
  },

  /** Verify a cash payment → auto-activates subscription */
  async verifyPayment(paymentId, token) {
    const { data } = await axios.post(`${BASE}/api/v1/payments/${paymentId}/verify`, {}, {
      headers: this._headers(token),
    });
    return data;
  },

  /** Reject a cash payment */
  async rejectPayment(paymentId, token) {
    const { data } = await axios.post(`${BASE}/api/v1/payments/${paymentId}/reject`, {}, {
      headers: this._headers(token),
    });
    return data;
  },

  /** Extend a member's subscription */
  async extendSubscription(subscriptionId, extra_days, token) {
    const { data } = await axios.patch(
      `${BASE}/api/v1/subscriptions/${subscriptionId}/extend`,
      { extra_days },
      { headers: this._headers(token) }
    );
    return data;
  },

  /** Get a specific user's subscription (admin access) */
  async getUserSubscription(userId, token) {
    const { data } = await axios.get(`${BASE}/api/v1/subscriptions/user/${userId}`, {
      headers: this._headers(token),
    });
    return data.data; // Returns { active, history }
  },

  /** Total counts for KPI cards on dashboard */
  async getDashboardKpis(token) {
    try {
      const [pending, all] = await Promise.all([
        this.getPendingPayments(token, { limit: 1 }),
        this.getAllPayments(token, { limit: 1 }),
      ]);
      return {
        pending_payments:    pending.data?.pagination?.total || 0,
        pending_total_mmk:   pending.data?.kpi?.pending_total_mmk || 0,
        total_payments:      all.data?.pagination?.total || 0,
      };
    } catch (err) {
      logger.warn(`[MembershipClient] getDashboardKpis failed: ${err.message}`);
      return { pending_payments: 0, pending_total_mmk: 0, total_payments: 0 };
    }
  },

  async healthCheck() {
    try {
      const { data } = await axios.get(`${BASE}/health`, { timeout: 3000 });
      return data;
    } catch {
      return { success: false, db: 'error' };
    }
  },
};

module.exports = membershipServiceClient;
