const express = require('express');
const router = express.Router();

const sellerAuthRoutes = require('./customer.routes');
const adminAuthRoutes = require('./admin.routes');

router.use('/customer', sellerAuthRoutes);
router.use('/admin', adminAuthRoutes);

module.exports = router;