'use strict';
const { validationResult } = require('express-validator');
const StaffModel  = require('../models/staff.model');
const AuditModel  = require('../models/auditlog.model');
const logger      = require('../config/logger');

const StaffController = {
  /** GET /api/v1/staff */
  async list(req, res, next) {
    try {
      const staff = await StaffModel.findAll();
      return res.json({ success: true, data: { staff } });
    } catch (err) { next(err); }
  },

  /** POST /api/v1/staff — register a new staff member */
  async create(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        return res.status(422).json({ success: false, error: 'Validation failed', details: errors.array() });

      const { user_id, email, full_name, role } = req.body;

      const existing = await StaffModel.findByUserId(user_id);
      if (existing) return res.status(409).json({ success: false, error: 'Staff record already exists for this user.' });

      const staff = await StaffModel.create({ user_id, email, full_name, role });

      await AuditModel.log({
        actor_id: req.user.sub,
        action: 'STAFF_CREATED',
        entity_type: 'staff',
        entity_id: staff.id,
        metadata: { email, role },
        ip_address: req.ip,
      });

      logger.info(`[Admin] Staff created: ${email} (${role}) by ${req.user.sub}`);
      return res.status(201).json({ success: true, message: 'Staff member created.', data: { staff } });
    } catch (err) { next(err); }
  },

  /** PATCH /api/v1/staff/:id */
  async update(req, res, next) {
    try {
      const staff = await StaffModel.update(req.params.id, req.body);
      if (!staff) return res.status(404).json({ success: false, error: 'Staff member not found.' });

      await AuditModel.log({
        actor_id: req.user.sub,
        action: 'STAFF_UPDATED',
        entity_type: 'staff',
        entity_id: req.params.id,
        metadata: req.body,
        ip_address: req.ip,
      });

      return res.json({ success: true, message: 'Staff updated.', data: { staff } });
    } catch (err) { next(err); }
  },
};

module.exports = StaffController;
