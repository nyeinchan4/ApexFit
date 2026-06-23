'use strict';
const express = require('express');
const { body } = require('express-validator');
const ProfileController = require('../controllers/profile.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

// All profile routes require authentication
router.use(authenticate);

const updateRules = [
  body('username').optional().trim().isLength({ min: 3, max: 50 }).withMessage('Username must be 3-50 characters.').matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores.'),
  body('phone').optional().isMobilePhone().withMessage('Invalid phone number.'),
];

router.get('/me',         ProfileController.getMe);
router.patch('/me', updateRules, ProfileController.updateMe);

module.exports = router;
