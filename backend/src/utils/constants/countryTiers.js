/**
 * Country/Region Tier Definitions
 *
 * Defines which countries are accessible at each subscription plan level.
 * Used by the /meta/countries endpoint and the keyword search controller
 * to enforce plan-based country gating.
 */

const FREE_REGIONS = ['US', 'Global'];

const BASIC_REGIONS = ['US', 'GB', 'CA', 'AU', 'Global'];

const PRO_REGIONS = [
  ...BASIC_REGIONS,
  'DE', 'FR', 'ES', 'IT', 'NZ', 'IE', 'NL', 'CH',
  'IN', 'PL',
];

// Pro Plus users get access to ALL countries (no restrictions)
const PRO_PLUS_REGIONS = 'ALL';

/**
 * Map plan names (lowercase) → allowed region set.
 * Covers both Phase 1 names (Starter, Elite) and Phase 2 names (Basic, Pro Plus).
 */
const PLAN_REGION_MAP = {
  'free':      FREE_REGIONS,
  'basic':     BASIC_REGIONS,
  'starter':   BASIC_REGIONS,
  'pro':       PRO_REGIONS,
  'pro plus':  PRO_PLUS_REGIONS,
  'pro_plus':  PRO_PLUS_REGIONS,
  'elite':     PRO_PLUS_REGIONS,
  'unlimited': PRO_PLUS_REGIONS,
};

/**
 * Get the minimum plan required to unlock a given country code.
 */
function getRequiredPlan(countryCode) {
  if (FREE_REGIONS.includes(countryCode)) return 'Free';
  if (BASIC_REGIONS.includes(countryCode)) return 'Basic';
  if (PRO_REGIONS.includes(countryCode)) return 'Pro';
  return 'Pro Plus';
}

/**
 * Check if a plan (by name) is allowed to access a given country code.
 * Returns true if allowed, false if locked.
 */
function isPlanAllowed(planName, countryCode) {
  const key = (planName || '').toLowerCase().trim();
  const allowed = PLAN_REGION_MAP[key] || FREE_REGIONS;
  if (allowed === 'ALL') return true;
  return allowed.includes(countryCode);
}

module.exports = {
  FREE_REGIONS,
  BASIC_REGIONS,
  PRO_REGIONS,
  PRO_PLUS_REGIONS,
  PLAN_REGION_MAP,
  getRequiredPlan,
  isPlanAllowed,
};
