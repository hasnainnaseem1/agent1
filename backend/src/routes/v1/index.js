const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const sellerRoutes = require('./customer');
const adminRoutes = require('./admin');
const notificationRoutes = require('./notification');

router.use('/auth', authRoutes);
router.use('/customer', sellerRoutes);
router.use('/admin', adminRoutes);
router.use('/notifications', notificationRoutes);

module.exports = router;