const express = require('express');
const router = express.Router();

const analysisRoutes = require('./analysis.routes');
const historyRoutes = require('./history.routes');

// All customer routes require authentication
const { auth } = require('../../../middleware/auth');

router.use('/analysis', auth, analysisRoutes);
router.use('/history', auth, historyRoutes);

module.exports = router;