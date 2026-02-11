const express = require('express');
const router = express.Router();

// Import admin routes
const usersRoutes = require('./users.routes');
const sellersRoutes = require('./customers.routes');
const rolesRoutes = require('./roles.routes');
const analyticsRoutes = require('./analytics.routes');
const logsRoutes = require('./logs.routes');
const settingsRoutes = require('./settings.routes');

// All admin routes require admin authentication
const { adminAuth } = require('../../../middleware/auth');

router.use('/users', adminAuth, usersRoutes);
router.use('/customers', adminAuth, sellersRoutes);
router.use('/roles', adminAuth, rolesRoutes);
router.use('/analytics', adminAuth, analyticsRoutes);
router.use('/logs', adminAuth, logsRoutes);
router.use('/settings', adminAuth, settingsRoutes);

module.exports = router;