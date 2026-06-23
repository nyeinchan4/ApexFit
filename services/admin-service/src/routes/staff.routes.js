'use strict';
const express = require('express');
const { body } = require('express-validator');
const StaffController = require('../controllers/staff.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

const createRules = [
  body('user_id').isUUID().withMessage('user_id must be a valid UUID.'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required.'),
  body('full_name').trim().notEmpty().withMessage('full_name is required.'),
  body('role').optional().isIn(['staff', 'admin']).withMessage('role must be staff or admin.'),
];

// Admin-only: manage staff accounts
router.get('/',     authenticate, authorize('admin'), StaffController.list);
router.post('/',    authenticate, authorize('admin'), createRules, StaffController.create);
router.patch('/:id',authenticate, authorize('admin'), StaffController.update);

module.exports = router;
