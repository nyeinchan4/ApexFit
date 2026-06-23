'use strict';
const express = require('express');
const { body } = require('express-validator');
const PlanController = require('../controllers/plan.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

const planRules = [
  body('name').trim().notEmpty().withMessage('Name is required.'),
  body('price_mmk').isFloat({ min: 0 }).withMessage('price_mmk must be a positive number.'),
  body('duration_days').isInt({ min: 1 }).withMessage('duration_days must be >= 1.'),
  body('features').optional().isArray().withMessage('features must be an array.'),
];

// Public — anyone can browse plans
router.get('/',    PlanController.list);
router.get('/:id', PlanController.getOne);

// Admin only — manage plans
router.post('/',    authenticate, authorize('admin'), planRules, PlanController.create);
router.patch('/:id', authenticate, authorize('admin'),           PlanController.update);
router.delete('/:id',authenticate, authorize('admin'),           PlanController.remove);

module.exports = router;
