/**
 * Keyword Snapshot Controller (Admin)
 *
 * Provides APIs for the admin dashboard to view daily keyword data dumps,
 * snapshot statistics, and trend history.
 */
const KeywordSnapshot = require('../../models/customer/KeywordSnapshot');
const log = require('../../utils/logger')('AdminSnapshotCtrl');

/**
 * GET /api/v1/admin/keyword-snapshots/summary
 * Returns summary stats: total snapshots, unique keywords, date range, daily counts.
 */
const getSummary = async (req, res) => {
  try {
    const [totalDocs, uniqueKeywords, dateRange, dailyCounts] = await Promise.all([
      KeywordSnapshot.countDocuments(),
      KeywordSnapshot.distinct('keyword').then((arr) => arr.length),
      KeywordSnapshot.aggregate([
        {
          $group: {
            _id: null,
            firstDate: { $min: '$snapshotDate' },
            lastDate: { $max: '$snapshotDate' },
          },
        },
      ]),
      KeywordSnapshot.aggregate([
        {
          $group: {
            _id: '$snapshotDate',
            count: { $sum: 1 },
            avgFusion: { $avg: '$fusionScore' },
            trendsCollected: {
              $sum: { $cond: [{ $ne: ['$googleTrends.interest', null] }, 1, 0] },
            },
          },
        },
        { $sort: { _id: -1 } },
        { $limit: 30 },
      ]),
    ]);

    res.json({
      success: true,
      summary: {
        totalSnapshots: totalDocs,
        uniqueKeywords,
        firstDate: dateRange[0]?.firstDate || null,
        lastDate: dateRange[0]?.lastDate || null,
        dailyCounts: dailyCounts.map((d) => ({
          date: d._id,
          count: d.count,
          avgFusion: d.avgFusion ? Math.round(d.avgFusion) : null,
          trendsCollected: d.trendsCollected,
        })),
      },
    });
  } catch (err) {
    log.error('getSummary error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to load summary' });
  }
};

/**
 * GET /api/v1/admin/keyword-snapshots
 * List snapshots with pagination and optional filters.
 * Query: ?page=1&limit=50&date=2026-03-31&keyword=necklace&sort=fusionScore
 */
const listSnapshots = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.date) {
      const d = new Date(req.query.date);
      d.setUTCHours(0, 0, 0, 0);
      filter.snapshotDate = d;
    }
    if (req.query.keyword) {
      filter.keyword = { $regex: req.query.keyword, $options: 'i' };
    }

    const sortField = req.query.sort || 'fusionScore';
    const sortDir = req.query.order === 'asc' ? 1 : -1;
    const sortObj = { [sortField]: sortDir };

    const [snapshots, total] = await Promise.all([
      KeywordSnapshot.find(filter)
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean(),
      KeywordSnapshot.countDocuments(filter),
    ]);

    res.json({
      success: true,
      snapshots,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    log.error('listSnapshots error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to list snapshots' });
  }
};

/**
 * GET /api/v1/admin/keyword-snapshots/trend/:keyword
 * Returns daily snapshot history for a specific keyword.
 * Query: ?days=30
 */
const getKeywordTrend = async (req, res) => {
  try {
    const { keyword } = req.params;
    const days = Math.min(365, Math.max(7, parseInt(req.query.days, 10) || 30));

    const trend = await KeywordSnapshot.getTrend(keyword, days);
    const wow = await KeywordSnapshot.getWeekOverWeekChange(keyword);

    res.json({ success: true, keyword, days, trend, weekOverWeek: wow });
  } catch (err) {
    log.error('getKeywordTrend error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to load trend' });
  }
};

module.exports = { getSummary, listSnapshots, getKeywordTrend };
