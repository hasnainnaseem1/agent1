const express = require('express');
const router = express.Router();
const { User } = require('../../../models/user');
const { ActivityLog } = require('../../../models/admin');
const { Analysis } = require('../../../models/customer');
const { Notification } = require('../../../models/notification');
const { adminAuth } = require('../../../middleware/auth');
const { checkPermission } = require('../../../middleware/security');

// @route   GET /api/admin/customers
// @desc    Get all customers with detailed info
// @access  Private (Admin with customers.view permission)
router.get('/', adminAuth, checkPermission('customers.view'), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      plan,
      subscriptionStatus,
      search,
      sortBy = 'createdAt',
      order = 'desc',
      isEmailVerified
    } = req.query;

    // Build filter for customers only
    const filter = { accountType: 'customer' };
    
    if (status) filter.status = status;
    if (plan) filter.plan = plan;
    if (subscriptionStatus) filter.subscriptionStatus = subscriptionStatus;
    if (isEmailVerified !== undefined) filter.isEmailVerified = isEmailVerified === 'true';
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const customers = await User.find(filter)
      .select('-password -emailVerificationToken -resetPasswordToken')
      .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await User.countDocuments(filter);

    // Get customer statistics
    const stats = {
      totalSellers: await User.countDocuments({ accountType: 'customer' }),
      activeSellers: await User.countDocuments({ accountType: 'customer', status: 'active' }),
      pendingVerification: await User.countDocuments({ accountType: 'customer', status: 'pending_verification' }),
      suspendedSellers: await User.countDocuments({ accountType: 'customer', status: 'suspended' }),
      freePlan: await User.countDocuments({ accountType: 'customer', plan: 'free' }),
      starterPlan: await User.countDocuments({ accountType: 'customer', plan: 'starter' }),
      proPlan: await User.countDocuments({ accountType: 'customer', plan: 'pro' }),
      unlimitedPlan: await User.countDocuments({ accountType: 'customer', plan: 'unlimited' }),
      activeSubscriptions: await User.countDocuments({ 
        accountType: 'customer', 
        subscriptionStatus: 'active' 
      })
    };

    res.json({
      success: true,
      customers: customers.map(customer => ({
        id: customer._id,
        name: customer.name,
        email: customer.email,
        status: customer.status,
        plan: customer.plan,
        analysisCount: customer.analysisCount,
        analysisLimit: customer.analysisLimit,
        subscriptionStatus: customer.subscriptionStatus,
        subscriptionStartDate: customer.subscriptionStartDate,
        subscriptionEndDate: customer.subscriptionEndDate,
        isEmailVerified: customer.isEmailVerified,
        lastLogin: customer.lastLogin,
        createdAt: customer.createdAt
      })),
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      },
      stats
    });

  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching customers'
    });
  }
});

// @route   GET /api/admin/customers/:id
// @desc    Get single customer with detailed analytics
// @access  Private (Admin with customers.view permission)
router.get('/:id', adminAuth, checkPermission('customers.view'), async (req, res) => {
  try {
    const customer = await User.findOne({
      _id: req.params.id,
      accountType: 'customer'
    }).select('-password');

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Get customer's analyses
    const analyses = await Analysis.find({ userId: customer._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('originalListing.title score status createdAt');

    const totalAnalyses = await Analysis.countDocuments({ userId: customer._id });

    // Get customer's activity logs
    const recentActivity = await ActivityLog.find({ userId: customer._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('action description ipAddress createdAt status');

    res.json({
      success: true,
      customer: {
        id: customer._id,
        name: customer.name,
        email: customer.email,
        status: customer.status,
        plan: customer.plan,
        analysisCount: customer.analysisCount,
        analysisLimit: customer.analysisLimit,
        monthlyResetDate: customer.monthlyResetDate,
        stripeCustomerId: customer.stripeCustomerId,
        subscriptionStatus: customer.subscriptionStatus,
        subscriptionId: customer.subscriptionId,
        subscriptionStartDate: customer.subscriptionStartDate,
        subscriptionEndDate: customer.subscriptionEndDate,
        isEmailVerified: customer.isEmailVerified,
        lastLogin: customer.lastLogin,
        lastLoginIP: customer.lastLoginIP,
        loginAttempts: customer.loginAttempts,
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt
      },
      analytics: {
        totalAnalyses,
        recentAnalyses: analyses
      },
      recentActivity
    });

  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching customer'
    });
  }
});

// @route   PUT /api/admin/customers/:id/plan
// @desc    Change customer's subscription plan
// @access  Private (Admin with customers.plans permission)
router.put('/:id/plan', adminAuth, checkPermission('customers.plans'), async (req, res) => {
  try {
    const { plan, reason } = req.body;

    if (!plan || !['free', 'starter', 'pro', 'unlimited'].includes(plan)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid plan'
      });
    }

    const customer = await User.findOne({
      _id: req.params.id,
      accountType: 'customer'
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    const oldPlan = customer.plan;
    customer.plan = plan;
    customer.updateAnalysisLimit();
    
    // If upgrading, set subscription as active
    if (plan !== 'free') {
      customer.subscriptionStatus = 'active';
      customer.subscriptionStartDate = new Date();
      customer.monthlyResetDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }

    await customer.save();

    // Log activity
    await ActivityLog.logActivity({
      userId: req.userId,
      userName: req.user.name,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'seller_plan_changed',
      actionType: 'update',
      targetModel: 'User',
      targetId: customer._id,
      targetName: customer.name,
      description: `Changed customer plan from ${oldPlan} to ${plan}${reason ? ` - Reason: ${reason}` : ''}`,
      metadata: { oldPlan, newPlan: plan, reason },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success'
    });

    // Notify customer
    const notificationType = plan === 'free' ? 'plan_downgraded' : 'plan_upgraded';
    await Notification.createNotification({
      recipientId: customer._id,
      type: notificationType,
      title: `Plan ${plan === 'free' ? 'Downgraded' : 'Upgraded'}`,
      message: `Your plan has been changed to ${plan.toUpperCase()} by admin. New analysis limit: ${customer.analysisLimit}`,
      action: {
        label: 'View Dashboard',
        url: '/dashboard'
      },
      priority: 'high'
    });

    res.json({
      success: true,
      message: 'Customer plan updated successfully',
      customer: {
        id: customer._id,
        plan: customer.plan,
        analysisLimit: customer.analysisLimit,
        subscriptionStatus: customer.subscriptionStatus
      }
    });

  } catch (error) {
    console.error('Update customer plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating customer plan'
    });
  }
});

// @route   POST /api/admin/customers/:id/reset-usage
// @desc    Reset customer's monthly analysis count
// @access  Private (Admin with customers.edit permission)
router.post('/:id/reset-usage', adminAuth, checkPermission('customers.edit'), async (req, res) => {
  try {
    const customer = await User.findOne({
      _id: req.params.id,
      accountType: 'customer'
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    await customer.resetMonthlyCount();

    // Log activity
    await ActivityLog.logActivity({
      userId: req.userId,
      userName: req.user.name,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'seller_updated',
      actionType: 'update',
      targetModel: 'User',
      targetId: customer._id,
      targetName: customer.name,
      description: `Reset analysis count for customer: ${customer.email}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success'
    });

    // Notify customer
    await Notification.createNotification({
      recipientId: customer._id,
      type: 'admin_message',
      title: 'Usage Reset',
      message: `Your analysis count has been reset by admin. You now have ${customer.analysisLimit} analyses available.`,
      priority: 'medium'
    });

    res.json({
      success: true,
      message: 'Customer usage reset successfully',
      customer: {
        id: customer._id,
        analysisCount: customer.analysisCount,
        analysisLimit: customer.analysisLimit,
        monthlyResetDate: customer.monthlyResetDate
      }
    });

  } catch (error) {
    console.error('Reset customer usage error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting customer usage'
    });
  }
});

// @route   POST /api/admin/customers/:id/verify-email
// @desc    Manually verify customer's email
// @access  Private (Admin with customers.verify permission)
router.post('/:id/verify-email', adminAuth, checkPermission('customers.verify'), async (req, res) => {
  try {
    const customer = await User.findOne({
      _id: req.params.id,
      accountType: 'customer'
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    if (customer.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
    }

    customer.isEmailVerified = true;
    customer.status = 'active';
    customer.emailVerificationToken = null;
    customer.emailVerificationExpires = null;
    await customer.save();

    // Log activity
    await ActivityLog.logActivity({
      userId: req.userId,
      userName: req.user.name,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'seller_verified',
      actionType: 'update',
      targetModel: 'User',
      targetId: customer._id,
      targetName: customer.name,
      description: `Manually verified email for customer: ${customer.email}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success'
    });

    // Notify customer
    await Notification.createNotification({
      recipientId: customer._id,
      type: 'email_verification',
      title: 'Email Verified',
      message: 'Your email has been verified by admin. You can now access all features.',
      priority: 'high'
    });

    res.json({
      success: true,
      message: 'Customer email verified successfully'
    });

  } catch (error) {
    console.error('Verify customer email error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying customer email'
    });
  }
});

// @route   GET /api/admin/customers/:id/analyses
// @desc    Get all analyses for a specific customer
// @access  Private (Admin with customers.view permission)
router.get('/:id/analyses', adminAuth, checkPermission('customers.view'), async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const customer = await User.findOne({
      _id: req.params.id,
      accountType: 'customer'
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    const analyses = await Analysis.find({ userId: customer._id })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Analysis.countDocuments({ userId: customer._id });

    res.json({
      success: true,
      analyses: analyses.map(analysis => ({
        id: analysis._id,
        title: analysis.originalListing.title,
        category: analysis.originalListing.category,
        score: analysis.score,
        status: analysis.status,
        createdAt: analysis.createdAt
      })),
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get customer analyses error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching customer analyses'
    });
  }
});

module.exports = router;
