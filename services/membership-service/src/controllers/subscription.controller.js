'use strict';
const { validationResult } = require('express-validator');
const SubscriptionModel = require('../models/subscription.model');
const PlanModel         = require('../models/plan.model');
const logger            = require('../config/logger');

const SubscriptionController = {
  /** GET /api/v1/subscriptions/me  — mobile dashboard data including gauge */
  async getMySubscription(req, res, next) {
    try {
      const userId = req.user.sub;
      const [active, history] = await Promise.all([
        SubscriptionModel.getDaysRemaining(userId),
        SubscriptionModel.findByUserId(userId),
      ]);
      return res.json({
        success: true,
        data: {
          active,          // includes days_remaining for the gauge widget
          history,
        },
      });
    } catch (err) { next(err); }
  },

  /** GET /api/v1/subscriptions/user/:userId  [staff/admin] — get specific user's subscription */
  async getUserSubscription(req, res, next) {
    try {
      const userId = req.params.userId;
      const [active, history] = await Promise.all([
        SubscriptionModel.getDaysRemaining(userId),
        SubscriptionModel.findByUserId(userId),
      ]);
      return res.json({
        success: true,
        data: {
          active,
          history,
        },
      });
    } catch (err) { next(err); }
  },

  /** POST /api/v1/subscriptions  — member subscribes to a plan */
  async subscribe(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(422).json({ success: false, error: 'Validation failed', details: errors.array() });

      const { plan_id } = req.body;
      const userId = req.user.sub;

      const plan = await PlanModel.findById(plan_id);
      if (!plan || !plan.is_active) return res.status(404).json({ success: false, error: 'Plan not found or inactive.' });

      // Check for existing active subscription
      const existing = await SubscriptionModel.findActiveByUserId(userId);
      if (existing) return res.status(409).json({ success: false, error: 'You already have an active subscription.' });

      const subscription = await SubscriptionModel.create({ user_id: userId, plan_id: plan.id });
      logger.info(`[Subscription] User ${userId} subscribed to plan ${plan.name}`);

      return res.status(201).json({ success: true, message: 'Subscription created. Awaiting payment.', data: { subscription } });
    } catch (err) { next(err); }
  },

  /** GET /api/v1/subscriptions  [staff/admin] — list all */
  async listAll(req, res, next) {
    try {
      const { user_id } = req.query;
      const data = user_id
        ? await SubscriptionModel.findByUserId(user_id)
        : await SubscriptionModel.findByUserId('%');  // partial — extend as needed
      return res.json({ success: true, data: { subscriptions: data } });
    } catch (err) { next(err); }
  },

  /** PATCH /api/v1/subscriptions/:id/extend  [staff/admin] — manual extension */
  async extendSubscription(req, res, next) {
    try {
      const { extra_days } = req.body;
      if (!extra_days || extra_days < 1) return res.status(422).json({ success: false, error: 'extra_days must be >= 1.' });

      const sub = await SubscriptionModel.manualExtend(req.params.id, extra_days);
      if (!sub) return res.status(404).json({ success: false, error: 'Subscription not found.' });

      logger.info(`[Subscription] ${req.params.id} extended by ${extra_days} days by ${req.user.sub}`);
      return res.json({ success: true, message: `Extended by ${extra_days} day(s).`, data: { subscription: sub } });
    } catch (err) { next(err); }
  },
};

module.exports = SubscriptionController;
