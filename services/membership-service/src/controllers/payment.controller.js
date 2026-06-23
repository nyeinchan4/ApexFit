'use strict';
const { validationResult } = require('express-validator');
const PaymentModel      = require('../models/payment.model');
const SubscriptionModel = require('../models/subscription.model');
const PlanModel         = require('../models/plan.model');
const logger            = require('../config/logger');

const PaymentController = {
  /**
   * GET /api/v1/payments  [staff/admin]
   * Returns pending queue + KPI totals — powers admin-portal-cash-verification.html
   */
  async list(req, res, next) {
    try {
      const { status, page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;

      const [payments, total, kpi] = await Promise.all([
        PaymentModel.findAll({ status, limit: Number(limit), offset: Number(offset) }),
        PaymentModel.countAll({ status }),
        PaymentModel.pendingTotal(),
      ]);

      return res.json({
        success: true,
        data: {
          payments,
          pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) },
          kpi: { pending_count: kpi.count, pending_total_mmk: kpi.total_mmk },
        },
      });
    } catch (err) { next(err); }
  },

  /**
   * GET /api/v1/payments/me  [member]
   */
  async getMyPayments(req, res, next) {
    try {
      const payments = await PaymentModel.findByUserId(req.user.sub);
      return res.json({ success: true, data: { payments } });
    } catch (err) { next(err); }
  },

  /**
   * POST /api/v1/payments  [member]
   * Member submits a cash payment record
   */
  async submit(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(422).json({ success: false, error: 'Validation failed', details: errors.array() });

      const { plan_id, amount_mmk, method, reference_id, notes } = req.body;
      const user_id = req.user.sub;

      const plan = await PlanModel.findById(plan_id);
      if (!plan || !plan.is_active) return res.status(404).json({ success: false, error: 'Plan not found.' });

      const payment = await PaymentModel.create({ user_id, plan_id, amount_mmk, method, reference_id, notes });
      logger.info(`[Payment] Submitted by ${user_id}: ${amount_mmk} MMK for ${plan.name} (ref: ${reference_id})`);

      return res.status(201).json({ success: true, message: 'Payment submitted. Awaiting verification.', data: { payment } });
    } catch (err) { next(err); }
  },

  /**
   * POST /api/v1/payments/:id/verify  [staff/admin]
   * Verifies payment → activates subscription automatically
   */
  async verify(req, res, next) {
    try {
      const paymentId = req.params.id;
      const verifiedBy = req.user.sub;

      const payment = await PaymentModel.findById(paymentId);
      if (!payment) return res.status(404).json({ success: false, error: 'Payment not found.' });
      if (payment.status !== 'pending') return res.status(409).json({ success: false, error: `Payment already ${payment.status}.` });

      const plan = await PlanModel.findById(payment.plan_id);

      // 1. Create or find pending subscription for this user+plan
      let sub = await SubscriptionModel.findByUserId(payment.user_id);
      let pendingSub = sub.find(s => s.plan_id === payment.plan_id && s.status === 'pending');

      if (!pendingSub) {
        pendingSub = await SubscriptionModel.create({ user_id: payment.user_id, plan_id: payment.plan_id });
      }

      // 2. Activate the subscription
      const activatedSub = await SubscriptionModel.activate(pendingSub.id, plan.duration_days);

      // 3. Mark payment as verified and link subscription
      const verifiedPayment = await PaymentModel.verify(paymentId, { verified_by: verifiedBy, subscription_id: activatedSub.id });

      logger.info(`[Payment] Verified by ${verifiedBy}: payment ${paymentId} → subscription ${activatedSub.id} activated`);

      return res.json({
        success: true,
        message: 'Payment verified. Subscription activated.',
        data: { payment: verifiedPayment, subscription: activatedSub },
      });
    } catch (err) { next(err); }
  },

  /**
   * POST /api/v1/payments/:id/reject  [staff/admin]
   */
  async reject(req, res, next) {
    try {
      const payment = await PaymentModel.reject(req.params.id, req.user.sub);
      if (!payment) return res.status(404).json({ success: false, error: 'Payment not found or already processed.' });
      logger.info(`[Payment] Rejected by ${req.user.sub}: payment ${req.params.id}`);
      return res.json({ success: true, message: 'Payment rejected.', data: { payment } });
    } catch (err) { next(err); }
  },
};

module.exports = PaymentController;
