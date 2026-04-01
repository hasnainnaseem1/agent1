/**
 * Rank Checker Controller
 * 
 * POST /api/v1/customer/rank-checker         → Check ranking for keywords
 * GET  /api/v1/customer/rank-checker/history  → Get rank check history
 * 
 * Feature key: bulk_rank_check
 * 
 * Two modes:
 * 1. With etsyListingId — scan Etsy search results to find where the listing ranks
 * 2. Without etsyListingId — auto-detect from user's connected shop listings
 */

const { RankCheck } = require('../../models/customer');
const { SerpCostLog } = require('../../models/customer');
const { EtsyListing } = require('../../models/integrations');
const etsyApi = require('../../services/etsy/etsyApiService');
const redis = require('../../services/cache/redisService');
const { CODE_TO_LOCATION } = require('../../utils/constants/etsyCountries');
const { isPlanAllowed } = require('../../utils/constants/countryTiers');
const crypto = require('crypto');
const log = require('../../utils/logger')('RankChecker');

const SERP_COST_PER_REQ = 0.0025;
const PAGES_TO_SCAN = 3; // 3 pages × 48 results = 144 positions

/**
 * POST /api/v1/customer/rank-checker
 * Check keyword rankings. If etsyListingId is provided, finds exact rank.
 * Otherwise, searches user's connected shop for all listings and checks them.
 */
const checkRankings = async (req, res) => {
  try {
    let { etsyListingId, keywords, listingTitle, country } = req.body;
    country = (country || 'US').toUpperCase().trim();

    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one keyword is required',
      });
    }

    // Plan-tier country gating
    const planName = req.user?.planSnapshot?.planName || 'free';
    if (!isPlanAllowed(planName, country)) {
      return res.status(403).json({
        success: false,
        errorCode: 'UPGRADE_REQUIRED',
        message: `Your current plan does not include access to the ${country} market. Please upgrade.`,
      });
    }

    const keywordList = keywords
      .map(k => (typeof k === 'string' ? k.trim() : ''))
      .filter(k => k.length > 0)
      .slice(0, 50);

    // Build search params with country support
    const baseSearchParams = { limit: 48, sort_on: 'score' };
    if (country && country !== 'GLOBAL') {
      const loc = CODE_TO_LOCATION[country] || country;
      baseSearchParams.shop_location = loc;
    }

    // If no specific listing, get all user's listings for matching
    let shopListingIds = [];
    if (!etsyListingId && req.etsyShop) {
      const userListings = await EtsyListing.find(
        { shopId: req.etsyShop.shopId },
        { etsyListingId: 1 }
      ).limit(200).lean();
      shopListingIds = userListings.map(l => String(l.etsyListingId));
    }

    const targetListingId = etsyListingId ? String(etsyListingId) : null;
    const results = [];
    let totalSerpCalls = 0;

    // Check for previous rank data (for change calculation)
    const previousCheck = await RankCheck.findOne({ userId: req.userId })
      .sort({ checkedAt: -1 })
      .select('results')
      .lean();
    const previousRanks = new Map();
    if (previousCheck) {
      for (const r of (previousCheck.results || [])) {
        if (r.keyword && r.rank != null) {
          previousRanks.set(r.keyword.toLowerCase(), r.rank);
        }
      }
    }

    for (const keyword of keywordList) {
      const cacheKey = `rank:${targetListingId || 'shop'}:${country}:${hashKey(keyword)}`;
      let rankData = await redis.get(cacheKey);

      if (rankData) {
        // Add change/trend from previous
        const prevRank = previousRanks.get(keyword.toLowerCase());
        rankData.change = prevRank != null && rankData.rank != null ? prevRank - rankData.rank : 0;
        rankData.trend = rankData.change > 0 ? 'up' : rankData.change < 0 ? 'down' : 'stable';
        results.push(rankData);
        continue;
      }

      // Scan search results
      let found = false;
      let rank = null;
      let page = null;
      let totalResults = 0;

      for (let p = 0; p < PAGES_TO_SCAN && !found; p++) {
        const searchResult = await etsyApi.publicRequest(
          'GET',
          '/v3/application/listings/active',
          { params: { ...baseSearchParams, keywords: keyword, offset: p * 48 } }
        );
        totalSerpCalls++;

        if (!searchResult.success) break;

        if (p === 0) {
          totalResults = searchResult.data.count || 0;
        }

        const listings = searchResult.data.results || [];

        // Try to find a specific listing or any of user's listings
        for (let idx = 0; idx < listings.length; idx++) {
          const lid = String(listings[idx].listing_id);
          if (targetListingId ? lid === targetListingId : shopListingIds.includes(lid)) {
            rank = (p * 48) + idx + 1;
            page = p + 1;
            found = true;
            break;
          }
        }

        if ((p + 1) * 48 >= totalResults) break;
      }

      const prevRank = previousRanks.get(keyword.toLowerCase());
      const change = prevRank != null && rank != null ? prevRank - rank : 0;

      rankData = {
        keyword,
        rank: found ? rank : null,
        page: found ? page : Math.ceil(((rank || totalResults) + 1) / 48),
        volume: totalResults,
        found,
        change,
        trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
      };

      await redis.set(cacheKey, rankData, 21600);
      results.push(rankData);
    }

    // Save to DB
    const rankCheck = await RankCheck.create({
      userId: req.userId,
      etsyListingId: targetListingId || 'shop',
      listingTitle: listingTitle || '',
      country,
      results,
      keywordCount: keywordList.length,
      serpCallCount: totalSerpCalls,
    });

    if (totalSerpCalls > 0) {
      await SerpCostLog.create({
        userId: req.userId,
        featureKey: 'bulk_rank_check',
        action: `rank_check:${targetListingId || 'shop'}`,
        requestCount: totalSerpCalls,
        costUsd: totalSerpCalls * SERP_COST_PER_REQ,
        cacheHit: false,
      });
    }

    return res.json({
      success: true,
      data: {
        checkId: rankCheck._id,
        results,
        totalSerpCalls,
      },
    });
  } catch (error) {
    log.error('Rank check error:', error.message, error.stack);
    return res.status(500).json({
      success: false,
      message: 'Failed to check rankings',
    });
  }
};

/**
 * GET /api/v1/customer/rank-checker/history
 */
const getRankHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [checks, total] = await Promise.all([
      RankCheck.find({ userId: req.userId })
        .sort({ checkedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select('etsyListingId listingTitle keywordCount results checkedAt country'),
      RankCheck.countDocuments({ userId: req.userId }),
    ]);

    return res.json({
      success: true,
      data: {
        checks,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    log.error('Rank history error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve rank check history',
    });
  }
};

function hashKey(str) {
  return crypto.createHash('md5').update(str.toLowerCase()).digest('hex').substring(0, 12);
}

/**
 * GET /api/v1/customer/rank-checker/trend
 * Returns rank history for a specific keyword over time.
 * Query params: keyword (required), etsyListingId (optional)
 */
const getRankTrend = async (req, res) => {
  try {
    const { keyword, etsyListingId } = req.query;
    if (!keyword) {
      return res.status(400).json({ success: false, message: 'keyword query param is required' });
    }

    const query = { userId: req.userId, 'results.keyword': keyword.trim() };
    if (etsyListingId) query.etsyListingId = etsyListingId;

    const checks = await RankCheck.find(query)
      .sort({ checkedAt: -1 })
      .limit(30)
      .select('results checkedAt country')
      .lean();

    const trend = checks
      .map(c => {
        const match = c.results.find(r => r.keyword.toLowerCase() === keyword.trim().toLowerCase());
        if (!match) return null;
        return {
          date: c.checkedAt,
          rank: match.rank,
          page: match.page,
          found: match.found,
          change: match.change || 0,
          country: c.country || 'US',
        };
      })
      .filter(Boolean)
      .reverse(); // oldest first for charting

    return res.json({ success: true, data: { keyword: keyword.trim(), trend } });
  } catch (error) {
    log.error('Rank trend error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to retrieve rank trend' });
  }
};

module.exports = { checkRankings, getRankHistory, getRankTrend };
