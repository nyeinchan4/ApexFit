'use strict';
const express = require('express');
const { body } = require('express-validator');
const MemberController = require('../controllers/member.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();
const guard = [authenticate, authorize('staff', 'admin')];

// User list — powers user management screen
router.get('/users',                           ...guard, MemberController.listUsers);

// Payment queue — powers cash verification screen
router.get('/payments',                        ...guard, MemberController.listPayments);
router.post('/payments/:id/verify',            ...guard, MemberController.verifyPayment);
router.post('/payments/:id/reject',            ...guard, MemberController.rejectPayment);

// Subscription management
router.patch('/subscriptions/:id/extend', ...guard,
  body('extra_days').isInt({ min: 1 }).withMessage('extra_days must be >= 1'),
  MemberController.extendSubscription
);

module.exports = router;
