const express = require('express');
const router = express.Router();
const { User, CustomRole } = require('../../../models/user');
const { ActivityLog, AdminSettings } = require('../../../models/admin');
const { Analysis } = require('../../../models/customer');
const { adminAuth } = require('../../../middleware/auth');
const { checkPermission } = require('../../../middleware/security');

// @route   GET /api/admin/analytics/overview
// @desc    Get overview dashboard statistics
// @access  Private (Admin with analytics.view permission)
router.get('/overview', adminAuth, checkPermission('analytics.view'), async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;
    
    // Calculate date range
    const now = new Date();
    let startDate;
    
    switch(timeframe) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // User statistics
    const totalUsers = await User.countDocuments();
    const totalSellers = await User.countDocuments({ accountType: 'customer' });
    const totalAdmins = await User.countDocuments({ accountType: 'admin' });
    const activeUsers = await User.countDocuments({ status: 'active' });
    const newUsersInPeriod = await User.countDocuments({ 
      createdAt: { $gte: startDate } 
    });

    // Customer statistics
    const activeSellers = await User.countDocuments({ 
      accountType: 'customer', 
      status: 'active' 
    });
    const pendingVerification = await User.countDocuments({ 
      accountType: 'customer', 
      status: 'pending_verification' 
    });
    const suspendedSellers = await User.countDocuments({ 
      accountType: 'customer', 
      status: 'suspended' 
    });

    // Subscription statistics
    const subscriptionStats = {
      free: await User.countDocuments({ accountType: 'customer', plan: 'free' }),
      starter: await User.countDocuments({ accountType: 'customer', plan: 'starter' }),
      pro: await User.countDocuments({ accountType: 'customer', plan: 'pro' }),
      unlimited: await User.countDocuments({ accountType: 'customer', plan: 'unlimited' })
    };

    const activeSubscriptions = await User.countDocuments({ 
      accountType: 'customer', 
      subscriptionStatus: 'active',
      plan: { $ne: 'free' }
    });

    // Analysis statistics
    const totalAnalyses = await Analysis.countDocuments();
    const analysesInPeriod = await Analysis.countDocuments({ 
      createdAt: { $gte: startDate } 
    });
    const completedAnalyses = await Analysis.countDocuments({ status: 'completed' });
    const failedAnalyses = await Analysis.countDocuments({ status: 'failed' });

    // Calculate average score
    const scoreAggregation = await Analysis.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, avgScore: { $avg: '$score' } } }
    ]);
    const averageScore = scoreAggregation.length > 0 ? scoreAggregation[0].avgScore : 0;

    // Activity statistics
    const totalLogins = await ActivityLog.countDocuments({ 
      action: 'login',
      createdAt: { $gte: startDate }
    });
    const failedLogins = await ActivityLog.countDocuments({ 
      action: 'login',
      status: 'failed',
      createdAt: { $gte: startDate }
    });

    // Revenue estimation (based on subscription plans)
    const revenueEstimate = {
      monthly: (
        subscriptionStats.starter * 19 +
        subscriptionStats.pro * 49 +
        subscriptionStats.unlimited * 79
      ),
      annual: (
        subscriptionStats.starter * 19 * 12 +
        subscriptionStats.pro * 49 * 12 +
        subscriptionStats.unlimited * 79 * 12
      )
    };

    // Growth metrics
    const previousPeriodStart = new Date(startDate.getTime() - (now.getTime() - startDate.getTime()));
    const previousPeriodUsers = await User.countDocuments({ 
      createdAt: { $gte: previousPeriodStart, $lt: startDate } 
    });
    
    const userGrowth = previousPeriodUsers > 0 
      ? ((newUsersInPeriod - previousPeriodUsers) / previousPeriodUsers * 100).toFixed(2)
      : 0;

    res.json({
      success: true,
      timeframe,
      overview: {
        users: {
          total: totalUsers,
          customers: totalSellers,
          admins: totalAdmins,
          active: activeUsers,
          newInPeriod: newUsersInPeriod,
          growth: `${userGrowth}%`
        },
        customers: {
          active: activeSellers,
          pendingVerification,
          suspended: suspendedSellers
        },
        subscriptions: {
          ...subscriptionStats,
          active: activeSubscriptions,
          conversionRate: totalSellers > 0 
            ? ((activeSubscriptions / totalSellers) * 100).toFixed(2) + '%'
            : '0%'
        },
        analyses: {
          total: totalAnalyses,
          inPeriod: analysesInPeriod,
          completed: completedAnalyses,
          failed: failedAnalyses,
          averageScore: averageScore.toFixed(2)
        },
        activity: {
          totalLogins,
          failedLogins,
          failureRate: totalLogins > 0 
            ? ((failedLogins / totalLogins) * 100).toFixed(2) + '%'
            : '0%'
        },
        revenue: revenueEstimate
      }
    });

  } catch (error) {
    console.error('Get analytics overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching analytics'
    });
  }
});

// @route   GET /api/admin/analytics/users-growth
// @desc    Get user growth chart data
// @access  Private (Admin with analytics.view permission)
router.get('/users-growth', adminAuth, checkPermission('analytics.view'), async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    let days;
    switch(period) {
      case '7d': days = 7; break;
      case '30d': days = 30; break;
      case '90d': days = 90; break;
      default: days = 30;
    }

    const growthData = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const newUsers = await User.countDocuments({
        createdAt: { $gte: date, $lt: nextDate }
      });
      
      const newSellers = await User.countDocuments({
        accountType: 'customer',
        createdAt: { $gte: date, $lt: nextDate }
      });
      
      growthData.push({
        date: date.toISOString().split('T')[0],
        newUsers,
        newSellers
      });
    }

    res.json({
      success: true,
      period,
      data: growthData
    });

  } catch (error) {
    console.error('Get user growth error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user growth data'
    });
  }
});

// @route   GET /api/admin/analytics/analyses-trend
// @desc    Get analyses trend data
// @access  Private (Admin with analytics.view permission)
router.get('/analyses-trend', adminAuth, checkPermission('analytics.view'), async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    let days;
    switch(period) {
      case '7d': days = 7; break;
      case '30d': days = 30; break;
      case '90d': days = 90; break;
      default: days = 30;
    }

    const trendData = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const analyses = await Analysis.countDocuments({
        createdAt: { $gte: date, $lt: nextDate }
      });
      
      const completed = await Analysis.countDocuments({
        status: 'completed',
        createdAt: { $gte: date, $lt: nextDate }
      });
      
      trendData.push({
        date: date.toISOString().split('T')[0],
        totalAnalyses: analyses,
        completed
      });
    }

    res.json({
      success: true,
      period,
      data: trendData
    });

  } catch (error) {
    console.error('Get analyses trend error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching analyses trend data'
    });
  }
});

// @route   GET /api/admin/analytics/subscription-distribution
// @desc    Get subscription plan distribution
// @access  Private (Admin with analytics.view permission)
router.get('/subscription-distribution', adminAuth, checkPermission('analytics.view'), async (req, res) => {
  try {
    const distribution = [
      {
        plan: 'Free',
        count: await User.countDocuments({ accountType: 'customer', plan: 'free' }),
        revenue: 0
      },
      {
        plan: 'Starter',
        count: await User.countDocuments({ accountType: 'customer', plan: 'starter' }),
        revenue: 19
      },
      {
        plan: 'Pro',
        count: await User.countDocuments({ accountType: 'customer', plan: 'pro' }),
        revenue: 49
      },
      {
        plan: 'Unlimited',
        count: await User.countDocuments({ accountType: 'customer', plan: 'unlimited' }),
        revenue: 79
      }
    ];

    const totalRevenue = distribution.reduce((sum, item) => sum + (item.count * item.revenue), 0);

    res.json({
      success: true,
      distribution,
      totalMonthlyRevenue: totalRevenue
    });

  } catch (error) {
    console.error('Get subscription distribution error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching subscription distribution'
    });
  }
});

// @route   GET /api/admin/analytics/top-customers
// @desc    Get top performing customers
// @access  Private (Admin with analytics.view permission)
router.get('/top-customers', adminAuth, checkPermission('analytics.view'), async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    // Get customers with most analyses
    const topSellers = await Analysis.aggregate([
      {
        $group: {
          _id: '$userId',
          totalAnalyses: { $sum: 1 },
          averageScore: { $avg: '$score' }
        }
      },
      { $sort: { totalAnalyses: -1 } },
      { $limit: parseInt(limit) }
    ]);

    // Populate customer details
    const sellersWithDetails = await Promise.all(
      topSellers.map(async (customer) => {
        const user = await User.findById(customer._id).select('name email plan');
        return {
          customer: user,
          totalAnalyses: customer.totalAnalyses,
          averageScore: customer.averageScore.toFixed(2)
        };
      })
    );

    res.json({
      success: true,
      topSellers: sellersWithDetails.filter(s => s.customer !== null)
    });

  } catch (error) {
    console.error('Get top customers error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching top customers'
    });
  }
});

// @route   GET /api/admin/analytics/recent-activities
// @desc    Get recent admin activities
// @access  Private (Admin with analytics.view permission)
router.get('/recent-activities', adminAuth, checkPermission('analytics.view'), async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const activities = await ActivityLog.find({ userRole: { $ne: 'customer' } })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .select('userName action description createdAt status');

    res.json({
      success: true,
      activities
    });

  } catch (error) {
    console.error('Get recent activities error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching recent activities'
    });
  }
});

module.exports = router;
