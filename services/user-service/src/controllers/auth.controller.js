'use strict';
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const UserModel = require('../models/user.model');
const TokenService = require('../services/token.service');
const logger = require('../config/logger');

const AuthController = {
  /**
   * POST /api/v1/auth/register
   */
  async register(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).json({ success: false, error: 'Validation failed', details: errors.array() });
      }

      const { email, username, password, phone } = req.body;

      const existing = await UserModel.findByEmail(email);
      if (existing) {
        return res.status(409).json({ success: false, error: 'Email already registered.' });
      }

      const existingUsername = await UserModel.findByUsername(username);
      if (existingUsername) {
        return res.status(409).json({ success: false, error: 'Username already taken.' });
      }

      const password_hash = await bcrypt.hash(password, 12);
      const user = await UserModel.create({ email, username, password_hash, phone });

      const payload = { sub: user.id, role: user.role };
      const accessToken = TokenService.generateAccessToken(payload);
      const refreshToken = TokenService.generateRefreshToken(payload);

      await UserModel.saveRefreshToken(user.id, refreshToken, TokenService.getRefreshTokenExpiry());
      TokenService.setRefreshCookie(res, refreshToken);

      logger.info(`[Auth] New registration: ${user.email} (${user.id})`);

      return res.status(201).json({
        success: true,
        message: 'Registration successful.',
        data: {
          user: { id: user.id, email: user.email, username: user.username, role: user.role },
          accessToken,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/v1/auth/login
   */
  async login(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).json({ success: false, error: 'Validation failed', details: errors.array() });
      }

      const { email, password } = req.body;

      const user = await UserModel.findByEmail(email);
      if (!user) {
        return res.status(401).json({ success: false, error: 'Invalid email or password.' });
      }

      if (!user.is_active) {
        return res.status(403).json({ success: false, error: 'Account is deactivated. Contact support.' });
      }

      const passwordMatch = await bcrypt.compare(password, user.password_hash);
      if (!passwordMatch) {
        return res.status(401).json({ success: false, error: 'Invalid email or password.' });
      }

      const payload = { sub: user.id, role: user.role };
      const accessToken = TokenService.generateAccessToken(payload);
      const refreshToken = TokenService.generateRefreshToken(payload);

      await UserModel.saveRefreshToken(user.id, refreshToken, TokenService.getRefreshTokenExpiry());
      TokenService.setRefreshCookie(res, refreshToken);

      logger.info(`[Auth] Login: ${user.email} (${user.id})`);

      return res.status(200).json({
        success: true,
        message: 'Login successful.',
        data: {
          user: { id: user.id, email: user.email, first_name: user.first_name, last_name: user.last_name, role: user.role },
          accessToken,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/v1/auth/refresh
   */
  async refresh(req, res, next) {
    try {
      const token = req.cookies?.refreshToken;
      if (!token) {
        return res.status(401).json({ success: false, error: 'No refresh token provided.' });
      }

      // Verify JWT signature first
      let decoded;
      try {
        decoded = TokenService.verifyRefreshToken(token);
      } catch {
        return res.status(401).json({ success: false, error: 'Invalid or expired refresh token.' });
      }

      // Validate token exists in DB (rotation check)
      const stored = await UserModel.findRefreshToken(token);
      if (!stored || !stored.is_active) {
        TokenService.clearRefreshCookie(res);
        return res.status(401).json({ success: false, error: 'Refresh token revoked.' });
      }

      const payload = { sub: stored.user_id, role: stored.role };
      const newAccessToken = TokenService.generateAccessToken(payload);
      const newRefreshToken = TokenService.generateRefreshToken(payload);

      // Rotate refresh token
      await UserModel.saveRefreshToken(stored.user_id, newRefreshToken, TokenService.getRefreshTokenExpiry());
      TokenService.setRefreshCookie(res, newRefreshToken);

      return res.status(200).json({
        success: true,
        data: { accessToken: newAccessToken },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/v1/auth/logout
   */
  async logout(req, res, next) {
    try {
      const userId = req.user?.sub;
      if (userId) {
        await UserModel.deleteRefreshToken(userId);
      }
      TokenService.clearRefreshCookie(res);
      logger.info(`[Auth] Logout: user ${userId}`);
      return res.status(200).json({ success: true, message: 'Logged out successfully.' });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/v1/auth/change-password
   */
  async changePassword(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).json({ success: false, error: 'Validation failed', details: errors.array() });
      }

      const { current_password, new_password } = req.body;
      const userId = req.user.sub;

      const userWithHash = await UserModel.findByEmail((await UserModel.findById(userId)).email);
      const match = await bcrypt.compare(current_password, userWithHash.password_hash);
      if (!match) {
        return res.status(401).json({ success: false, error: 'Current password is incorrect.' });
      }

      const newHash = await bcrypt.hash(new_password, 12);
      await UserModel.updatePassword(userId, newHash);
      // Invalidate all sessions
      await UserModel.deleteRefreshToken(userId);
      TokenService.clearRefreshCookie(res);

      return res.status(200).json({ success: true, message: 'Password changed. Please log in again.' });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = AuthController;
