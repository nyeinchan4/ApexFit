'use strict';
const express = require('express');
const { body } = require('express-validator');
const AuthController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

// Validators
const registerRules = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required.'),
  body('username').trim().isLength({ min: 3, max: 50 }).withMessage('Username must be 3-50 characters.').matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores.'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters.'),
  body('phone').optional().isMobilePhone().withMessage('Invalid phone number.'),
];

const loginRules = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required.'),
  body('password').notEmpty().withMessage('Password is required.'),
];

const changePasswordRules = [
  body('current_password').notEmpty().withMessage('Current password is required.'),
  body('new_password').isLength({ min: 8 }).withMessage('New password must be at least 8 characters.'),
];

// ── Routes ────────────────────────────────────────────────────────────────────
router.post('/register', registerRules, AuthController.register);
router.post('/login',    loginRules,    AuthController.login);
router.post('/refresh',                 AuthController.refresh);
router.post('/logout',   authenticate,  AuthController.logout);
router.post('/change-password', authenticate, changePasswordRules, AuthController.changePassword);

module.exports = router;
