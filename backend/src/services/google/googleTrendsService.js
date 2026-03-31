/**
 * Google Trends Service
 *
 * Uses the free `google-trends-api` npm package (no API key required).
 * Fetches relative search interest (0-100) over the past 12 months.
 *
 * Rate limiting: Google Trends has an unofficial soft limit of ~10-20 req/min.
 * This service queues requests with a configurable delay.
 */
const googleTrends = require('google-trends-api');
const log = require('../../utils/logger')('GoogleTrends');

const DELAY_MS = 4000; // 4 seconds between requests to avoid 429s
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Fetch interest-over-time data for a keyword.
 * Appends " etsy" to make it Etsy-specific.
 *
 * @param {string} keyword
 * @param {Object} [options]
 * @param {boolean} [options.etsySuffix=true] - append " etsy" to query
 * @param {string}  [options.geo=''] - country code (e.g. 'US')
 * @returns {{ success, interest, avg, trend, peak, trough, seasonality, raw, error }}
 */
const getInterestOverTime = async (keyword, options = {}) => {
  const { etsySuffix = true, geo = '' } = options;
  const query = etsySuffix ? `${keyword} etsy` : keyword;

  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 1);

    const raw = await googleTrends.interestOverTime({
      keyword: query,
      startTime: startDate,
      endTime: endDate,
      geo: geo || undefined,
    });

    const parsed = JSON.parse(raw);
    const timeline = parsed?.default?.timelineData || [];

    if (!timeline.length) {
      return {
        success: true,
        interest: 0,
        avg: 0,
        trend: 'insufficient',
        peak: null,
        trough: null,
        seasonality: 'unknown',
        weekly: [],
        error: null,
      };
    }

    // Extract weekly interest values
    const weekly = timeline.map((point) => ({
      date: point.formattedTime,
      time: parseInt(point.time, 10) * 1000,
      value: point.value?.[0] ?? 0,
    }));

    const values = weekly.map((w) => w.value);
    const avg = Math.round(values.reduce((s, v) => s + v, 0) / values.length);
    const peak = Math.max(...values);
    const trough = Math.min(...values);

    // Trend: compare last 4 weeks average vs first 4 weeks average
    const recentAvg = values.slice(-4).reduce((s, v) => s + v, 0) / 4;
    const earlyAvg = values.slice(0, 4).reduce((s, v) => s + v, 0) / 4;
    let trend = 'stable';
    if (earlyAvg > 0) {
      const changePct = ((recentAvg - earlyAvg) / earlyAvg) * 100;
      if (changePct > 20) trend = 'rising';
      else if (changePct < -20) trend = 'declining';
    } else if (recentAvg > 5) {
      trend = 'rising';
    }

    // Seasonality detection: check if peak-to-trough ratio > 3x
    const seasonality = peak > 0 && trough >= 0 && (peak / Math.max(trough, 1)) > 3
      ? 'seasonal'
      : 'year-round';

    return {
      success: true,
      interest: values[values.length - 1] || 0, // most recent week
      avg,
      trend,
      peak,
      trough,
      seasonality,
      weekly,
      error: null,
    };
  } catch (err) {
    log.error(`Failed to fetch trends for "${query}":`, err.message);
    return {
      success: false,
      interest: 0,
      avg: 0,
      trend: 'unknown',
      peak: null,
      trough: null,
      seasonality: 'unknown',
      weekly: [],
      error: err.message,
    };
  }
};

/**
 * Batch-fetch trends for multiple keywords with delays.
 *
 * @param {string[]} keywords
 * @param {Object} [options] - same as getInterestOverTime options
 * @returns {Map<string, Object>} keyword → trends result
 */
const batchGetTrends = async (keywords, options = {}) => {
  const results = new Map();
  for (const kw of keywords) {
    const data = await getInterestOverTime(kw, options);
    results.set(kw, data);
    if (keywords.indexOf(kw) < keywords.length - 1) {
      await sleep(DELAY_MS);
    }
  }
  return results;
};

module.exports = { getInterestOverTime, batchGetTrends, DELAY_MS };
