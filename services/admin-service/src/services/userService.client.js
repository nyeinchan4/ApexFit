'use strict';
const axios = require('axios');
const logger = require('../config/logger');

const BASE = process.env.USER_SERVICE_URL || 'http://localhost:3001';

/**
 * HTTP client for the User Service.
 * Forwards the admin's bearer token so user-service can validate identity.
 */
const userServiceClient = {
  _headers(token) {
    return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  },

  async getProfile(userId, token) {
    const { data } = await axios.get(`${BASE}/api/v1/profile/me`, {
      headers: this._headers(token),
      params: { id: userId },
    });
    return data;
  },

  /**
   * Admin-level: fetch full member list (proxied through user-service if it
   * exposes an admin endpoint, otherwise returns paginated from admin's DB view).
   * For now we return a structured call that can be extended.
   */
  async listMembers(token, { page = 1, limit = 20, status } = {}) {
    try {
      const { data } = await axios.get(`${BASE}/api/v1/admin/members`, {
        headers: this._headers(token),
        params: { page, limit, status },
      });
      return data;
    } catch (err) {
      logger.warn(`[UserClient] listMembers failed: ${err.message}`);
      return { success: false, data: { members: [], pagination: {} } };
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

module.exports = userServiceClient;
