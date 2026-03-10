const express = require('express');
const router = express.Router();
const { auth } = require('../../../middleware/auth');
const { validateEmail } = require('../../../middleware/validation');
const customerAuthController = require('../../../controllers/auth/customerAuthController');

// @route   POST /api/v1/auth/customer/google
router.post('/google', customerAuthController.googleSSO);

// @route   POST /api/v1/auth/customer/signup
router.post('/signup', validateEmail, customerAuthController.signup);

// @route   POST /api/v1/auth/customer/login
router.post('/login', customerAuthController.login);

// @route   GET /api/v1/auth/customer/verify-email/:token
router.get('/verify-email/:token', customerAuthController.verifyEmail);

// @route   POST /api/v1/auth/customer/resend-verification
router.post('/resend-verification', customerAuthController.resendVerification);

// @route   GET /api/v1/auth/customer/me
router.get('/me', auth, customerAuthController.getMe);

// @route   PUT /api/v1/auth/customer/me
router.put('/me', auth, customerAuthController.updateProfile);

// @route   PUT /api/v1/auth/customer/me/password
router.put('/me/password', auth, customerAuthController.changePassword);

// @route   POST /api/v1/auth/customer/logout
router.post('/logout', auth, customerAuthController.logout);

// @route   POST /api/v1/auth/customer/forgot-password
router.post('/forgot-password', customerAuthController.forgotPassword);

// @route   POST /api/v1/auth/customer/reset-password/:token
router.post('/reset-password/:token', customerAuthController.resetPassword);

module.exports = router;
