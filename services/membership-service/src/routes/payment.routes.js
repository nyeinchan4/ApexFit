'use strict';
const express = require('express');
const { body } = require('express-validator');
const PaymentController = require('../controllers/payment.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

const submitRules = [
  body('plan_id').isUUID().withMessage('Valid plan_id UUID is required.'),
  body('amount_mmk').isFloat({ min: 1 }).withMessage('amount_mmk must be positive.'),
  body('method').optional().isIn(['cash', 'bank_transfer', 'mobile_payment']).withMessage('Invalid payment method.'),
  body('reference_id').optional().trim(),
  body('notes').optional().trim(),
];

// Member — view own payment history
router.get('/me', authenticate, PaymentController.getMyPayments);

// Member — submit a payment
router.post('/', authenticate, submitRules, PaymentController.submit);

// Staff / Admin — list all payments (with KPI totals for cash verification screen)
router.get('/', authenticate, authorize('staff', 'admin'), PaymentController.list);

// Staff / Admin — verify or reject a specific payment
router.post('/:id/verify', authenticate, authorize('staff', 'admin'), PaymentController.verify);
router.post('/:id/reject', authenticate, authorize('staff', 'admin'), PaymentController.reject);

module.exports = router;
