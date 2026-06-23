'use strict';
const { validationResult } = require('express-validator');
const PlanModel = require('../models/plan.model');

const PlanController = {
  /** GET /api/v1/plans */
  async list(req, res, next) {
    try {
      const includeInactive = req.user?.role === 'admin' || req.user?.role === 'staff';
      const plans = await PlanModel.findAll(includeInactive);
      return res.json({ success: true, data: { plans } });
    } catch (err) { next(err); }
  },

  /** GET /api/v1/plans/:id */
  async getOne(req, res, next) {
    try {
      const plan = await PlanModel.findById(req.params.id);
      if (!plan) return res.status(404).json({ success: false, error: 'Plan not found.' });
      return res.json({ success: true, data: { plan } });
    } catch (err) { next(err); }
  },

  /** POST /api/v1/plans  [admin] */
  async create(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(422).json({ success: false, error: 'Validation failed', details: errors.array() });

      const plan = await PlanModel.create(req.body);
      return res.status(201).json({ success: true, message: 'Plan created.', data: { plan } });
    } catch (err) { next(err); }
  },

  /** PATCH /api/v1/plans/:id  [admin] */
  async update(req, res, next) {
    try {
      const plan = await PlanModel.update(req.params.id, req.body);
      if (!plan) return res.status(404).json({ success: false, error: 'Plan not found.' });
      return res.json({ success: true, message: 'Plan updated.', data: { plan } });
    } catch (err) { next(err); }
  },

  /** DELETE /api/v1/plans/:id  [admin] */
  async remove(req, res, next) {
    try {
      const deleted = await PlanModel.delete(req.params.id);
      if (!deleted) return res.status(404).json({ success: false, error: 'Plan not found.' });
      return res.json({ success: true, message: 'Plan deleted.' });
    } catch (err) { next(err); }
  },
};

module.exports = PlanController;
