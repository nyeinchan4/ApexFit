'use strict';
const jwt = require('jsonwebtoken');

const TokenService = {
  /**
   * Generate an access token (short-lived)
   */
  generateAccessToken(payload) {
    return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
      issuer: 'apexfit-user-service',
    });
  },

  /**
   * Generate a refresh token (long-lived)
   */
  generateRefreshToken(payload) {
    return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
      issuer: 'apexfit-user-service',
    });
  },

  /**
   * Verify an access token
   */
  verifyAccessToken(token) {
    return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  },

  /**
   * Verify a refresh token
   */
  verifyRefreshToken(token) {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  },

  /**
   * Calculate refresh token expiry Date for DB storage
   */
  getRefreshTokenExpiry() {
    const days = parseInt(process.env.JWT_REFRESH_EXPIRES_IN) || 7;
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
  },

  /**
   * Set the refresh token as an HttpOnly cookie
   */
  setRefreshCookie(res, token) {
    res.cookie('refreshToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days in ms
    });
  },

  /**
   * Clear the refresh cookie
   */
  clearRefreshCookie(res) {
    res.clearCookie('refreshToken', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' });
  },
};

module.exports = TokenService;
