const express = require('express');
const router = express.Router();
const { adminAuth } = require('../../../middleware/auth');
const adminAuthController = require('../../../controllers/auth/adminAuthController');

// @route   POST /api/admin/auth/login
router.post('/login', adminAuthController.login);

// @route   GET /api/admin/auth/me
router.get('/me', adminAuth, adminAuthController.getMe);

// @route   POST /api/admin/auth/logout
router.post('/logout', adminAuth, adminAuthController.logout);

// @route   POST /api/admin/auth/change-password
router.post('/change-password', adminAuth, adminAuthController.changePassword);

// @route   PUT /api/admin/auth/profile
router.put('/profile', adminAuth, adminAuthController.updateProfile);

// @route   POST /api/admin/auth/forgot-password
router.post('/forgot-password', adminAuthController.forgotPassword);

// @route   POST /api/admin/auth/reset-password
router.post('/reset-password', adminAuthController.resetPassword);

// @route   POST /api/admin/auth/reset-password-for-user
router.post('/reset-password-for-user', adminAuth, adminAuthController.resetPasswordForUser);

// @route   POST /api/admin/auth/request-password-reset
router.post('/request-password-reset', adminAuth, adminAuthController.requestPasswordReset);

module.exports = router;
