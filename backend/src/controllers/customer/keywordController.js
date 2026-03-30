/**
 * Keyword Controller
 * 
 * POST /api/v1/customer/keywords/search        → Basic keyword search
 * POST /api/v1/customer/keywords/deep-analysis  → Deep keyword analysis (20 sub-queries per seed)
 * GET  /api/v1/customer/keywords/history        → Keyword search history
 * 
 * Feature keys: keyword_search, keyword_deep_analysis
 */

const { KeywordSearch } = require('../../models/customer');
const { SerpCostLog } = require('../../models/customer');
const keywordService = require('../../services/etsy/etsyKeywordService');
const redis = require('../../services/cache/redisService');
const crypto = require('crypto');
const log = require('../../utils/logger')('KeywordCtrl');

const SERP_COST_PER_REQ = 0.0025;

// Plan-based result limits for keyword search
// Keys are lowercase for case-insensitive matching.
// Covers both Phase 1 names (Starter, Elite) and Phase 2 names (Basic, Pro Plus).
const PLAN_RESULT_LIMITS = {
  'free':      5,
  'basic':     25,
  'starter':   25,
  'pro':       75,
  'pro plus':  Infinity,
  'pro_plus':  Infinity,
  'elite':     Infinity,
  'unlimited': Infinity,
};

/**
 * Resolve how many keyword results the user's plan allows.
 * Uses planSnapshot.planName with case-insensitive matching.
 * Falls back to the feature-level limit from checkFeatureAccess if plan name is missing.
 */
function getResultLimit(req) {
  const planName = req.user?.planSnapshot?.planName;
  const key = (planName || '').toLowerCase().trim();

  log.info(`getResultLimit: planSnapshot.planName="${planName}" key="${key}" featureAccess.limit=${req.featureAccess?.limit}`);

  if (key && PLAN_RESULT_LIMITS[key] !== undefined) {
    return { limit: PLAN_RESULT_LIMITS[key], plan: planName };
  }

  // Fallback: if planName is unknown, use featureAccess.limit (set by checkFeatureAccess middleware)
  // High feature limits (500+) indicate a premium plan → don't slice at all
  const featureLimit = req.featureAccess?.limit;
  if (featureLimit && featureLimit >= 500) {
    return { limit: Infinity, plan: planName || 'unknown (feature-limit-based)' };
  }

  // Last resort: default to Free
  log.warn(`getResultLimit: could not resolve plan for user ${req.userId}, defaulting to Free (5)`);
  return { limit: 5, plan: planName || 'Free' };
}

/**
 * POST /api/v1/customer/keywords/search
 * Basic keyword search — returns related keywords with volume estimates.
 */
const searchKeywords = async (req, res) => {
  try {
    const { keyword, country } = req.body;
    log.info(`searchKeywords: userId=${req.userId} keyword="${keyword}" country=${country || 'ALL'}`);

    if (!keyword || typeof keyword !== 'string' || keyword.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Keyword is required',
      });
    }

    const seedKeyword = keyword.trim().substring(0, 100);
    const countryCode = (country && typeof country === 'string') ? country.trim().toUpperCase() : null;
    const cacheKey = `kw:${hashKey(seedKeyword + (countryCode || ''))}`;

    // Check cache
    const cached = await redis.get(cacheKey);
    if (cached) {
      await KeywordSearch.create({
        userId: req.userId,
        seedKeyword,
        searchType: 'basic',
        results: cached,
        resultCount: cached.length,
        serpCallCount: 0,
      });

      // Plan-based slicing on cached results too
      const { limit: maxCached, plan: cachedPlan } = getResultLimit(req);
      const slicedCached = Number.isFinite(maxCached) ? cached.slice(0, maxCached) : cached;
      log.info(`searchKeywords(cached): plan="${cachedPlan}" limit=${maxCached} total=${cached.length} returned=${slicedCached.length}`);

      return res.json({
        success: true,
        data: {
          keyword: seedKeyword,
          results: slicedCached,
          cached: true,
          totalKeywords: cached.length,
          returnedKeywords: slicedCached.length,
          plan: cachedPlan,
        },
      });
    }

    // Use the keyword service for the actual estimation
    const searchData = await keywordService.getRelatedKeywords(seedKeyword, { country: countryCode });

    // Distinguish API error from genuine 0 results
    if (!searchData.success) {
      log.error(`searchKeywords: API FAILED for "${seedKeyword}" - errorCode=${searchData.errorCode} detail=${searchData.error}`);
      return res.status(502).json({
        success: false,
        message: 'Unable to fetch keyword data from Etsy',
        errorCode: searchData.errorCode,
        detail: searchData.error,
      });
    }

    const results = searchData.results;

    log.info(`searchKeywords: SUCCESS for "${seedKeyword}" - ${results.length} results, ${searchData.serpCalls} SERP calls`);

    // Cache full results (even if empty — means the keyword genuinely has no data)
    await redis.set(cacheKey, results, 21600);

    // Save full results to DB
    await KeywordSearch.create({
      userId: req.userId,
      seedKeyword,
      searchType: 'basic',
      results,
      resultCount: results.length,
      serpCallCount: searchData.serpCalls,
    });

    // Log SERP cost
    if (searchData.serpCalls > 0) {
      await SerpCostLog.create({
        userId: req.userId,
        featureKey: 'keyword_search',
        action: `keyword_search:${seedKeyword}`,
        requestCount: searchData.serpCalls,
        costUsd: searchData.serpCalls * SERP_COST_PER_REQ,
        cacheHit: false,
      });
    }

    // Plan-based result slicing — return only what the plan allows
    const { limit: maxResults, plan: resolvedPlan } = getResultLimit(req);
    const slicedResults = Number.isFinite(maxResults) ? results.slice(0, maxResults) : results;
    log.info(`searchKeywords: plan="${resolvedPlan}" limit=${maxResults} total=${results.length} returned=${slicedResults.length}`);

    return res.json({
      success: true,
      data: {
        keyword: seedKeyword,
        results: slicedResults,
        cached: false,
        totalResults: searchData.totalResults,
        totalKeywords: results.length,
        returnedKeywords: slicedResults.length,
        plan: resolvedPlan,
      },
    });
  } catch (error) {
    log.error(`searchKeywords: EXCEPTION - ${error.message}`, error.stack);
    return res.status(500).json({
      success: false,
      message: 'Failed to search keywords',
    });
  }
};

/**
 * POST /api/v1/customer/keywords/deep-analysis
 * Deep keyword analysis — aggregate stats with related keywords & tag suggestions.
 */
const deepAnalysis = async (req, res) => {
  try {
    const { keyword, country } = req.body;

    if (!keyword || typeof keyword !== 'string' || keyword.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Keyword is required',
      });
    }

    const seedKeyword = keyword.trim().substring(0, 100);
    const countryCode = (country && typeof country === 'string') ? country.trim().toUpperCase() : null;
    const cacheKey = `kw:deep:${hashKey(seedKeyword + (countryCode || ''))}`;

    // Check cache
    const cached = await redis.get(cacheKey);
    if (cached) {
      await KeywordSearch.create({
        userId: req.userId,
        seedKeyword,
        searchType: 'deep',
        results: cached.relatedKeywords || [],
        resultCount: (cached.relatedKeywords || []).length,
        serpCallCount: 0,
      });

      return res.json({
        success: true,
        data: cached,
      });
    }

    // Use the keyword service for deep analysis
    const analysis = await keywordService.deepAnalyzeKeyword(seedKeyword, { country: countryCode });

    // Distinguish API error from genuine 0 results
    if (!analysis.success) {
      return res.status(502).json({
        success: false,
        message: 'Unable to fetch keyword data from Etsy',
        errorCode: analysis.errorCode,
        detail: analysis.error,
      });
    }

    const data = analysis.data;

    // Cache the full analysis
    await redis.set(cacheKey, data, 21600);

    // Save to DB
    await KeywordSearch.create({
      userId: req.userId,
      seedKeyword,
      searchType: 'deep',
      results: data.relatedKeywords || [],
      resultCount: (data.relatedKeywords || []).length,
      serpCallCount: analysis.serpCalls,
    });

    // Log SERP cost
    if (analysis.serpCalls > 0) {
      await SerpCostLog.create({
        userId: req.userId,
        featureKey: 'keyword_deep_analysis',
        action: `deep_analysis:${seedKeyword}`,
        requestCount: analysis.serpCalls,
        costUsd: analysis.serpCalls * SERP_COST_PER_REQ,
        cacheHit: false,
      });
    }

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    log.error(`deepAnalysis: EXCEPTION - ${error.message}`, error.stack);
    return res.status(500).json({
      success: false,
      message: 'Failed to perform deep analysis',
    });
  }
};

/**
 * GET /api/v1/customer/keywords/history
 */
const getKeywordHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const query = { userId: req.userId };
    if (type) query.searchType = type;

    const [searches, total] = await Promise.all([
      KeywordSearch.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select('seedKeyword searchType resultCount serpCallCount createdAt'),
      KeywordSearch.countDocuments(query),
    ]);

    return res.json({
      success: true,
      data: {
        searches,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    log.error('Keyword history error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve keyword history',
    });
  }
};

// --- Helpers ---

function hashKey(str) {
  return crypto.createHash('md5').update(str.toLowerCase()).digest('hex').substring(0, 12);
}

module.exports = { searchKeywords, deepAnalysis, getKeywordHistory };
