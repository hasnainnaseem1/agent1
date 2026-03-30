const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { User } = require('../../../models/user');
const { ETSY_COUNTRIES } = require('../../../utils/constants/etsyCountries');
const { isPlanAllowed, getRequiredPlan } = require('../../../utils/constants/countryTiers');

/**
 * Optional auth — attaches req.user if a valid Bearer token is present.
 * Does NOT reject unauthenticated requests (meta routes stay public).
 */
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('planSnapshot plan').lean();
      if (user) req.user = user;
    }
  } catch {
    // Token invalid / expired — proceed as unauthenticated
  }
  next();
};

// @route   GET /api/v1/meta/countries
// @desc    List supported Etsy countries with plan-based lock metadata
// @access  Public (optional auth enriches with lock info)
router.get('/countries', optionalAuth, (req, res) => {
  const planName = req.user?.planSnapshot?.planName || req.user?.plan || '';

  // Always add the "Global" option first (all sellers, no country filter)
  const globalEntry = {
    value: 'Global',
    label: '🌍 Global (All Countries)',
    name: 'Global',
    isLocked: !isPlanAllowed(planName, 'Global'),
    requiredPlan: getRequiredPlan('Global'),
  };

  const countries = ETSY_COUNTRIES.map(c => ({
    value: c.code,
    label: `${c.flag} ${c.name}`,
    name: c.name,
    isLocked: !isPlanAllowed(planName, c.code),
    requiredPlan: getRequiredPlan(c.code),
  }));

  res.json({ success: true, data: [globalEntry, ...countries] });
});

module.exports = router;
