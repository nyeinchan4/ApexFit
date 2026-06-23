'use strict';
const express = require('express');
const { body } = require('express-validator');
const SubscriptionController = require('../controllers/subscription.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// Member — view own subscription (mobile dashboard gauge)
router.get('/me', authenticate, SubscriptionController.getMySubscription);

// Staff / Admin — get specific user's subscription
router.get('/user/:userId', authenticate, authorize('staff', 'admin'), SubscriptionController.getUserSubscription);

// Member — subscribe to a plan
router.post('/', authenticate, [
  body('plan_id').isUUID().withMessage('Valid plan_id UUID is required.'),
], SubscriptionController.subscribe);

// Staff / Admin — list all subscriptions
router.get('/', authenticate, authorize('staff', 'admin'), SubscriptionController.listAll);

// Staff / Admin — manually extend a subscription
router.patch('/:id/extend', authenticate, authorize('staff', 'admin'), SubscriptionController.extendSubscription);

module.exports = router;
