'use strict';
const { validationResult } = require('express-validator');
const UserModel = require('../models/user.model');

const ProfileController = {
  /**
   * GET /api/v1/profile/me
   */
  async getMe(req, res, next) {
    try {
      const user = await UserModel.findById(req.user.sub);
      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found.' });
      }
      return res.status(200).json({ success: true, data: { user } });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PATCH /api/v1/profile/me
   */
  async updateMe(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).json({ success: false, error: 'Validation failed', details: errors.array() });
      }

      const { username, phone } = req.body;
      const updated = await UserModel.updateProfile(req.user.sub, { username, phone });

      if (!updated) {
        return res.status(404).json({ success: false, error: 'User not found.' });
      }

      return res.status(200).json({
        success: true,
        message: 'Profile updated.',
        data: { user: updated },
      });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = ProfileController;
