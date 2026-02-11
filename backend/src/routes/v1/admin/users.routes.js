const express = require('express');
const router = express.Router();
const { User, CustomRole } = require('../../../models/user');
const { ActivityLog } = require('../../../models/admin');
const { Notification } = require('../../../models/notification');
const { adminAuth } = require('../../../middleware/auth');
const { checkPermission, superAdminOnly } = require('../../../middleware/security');


// @route   GET /api/admin/users
// @desc    Get all users (customers + admins) with pagination and filters
// @access  Private (Admin with users.view permission)
router.get('/', adminAuth, checkPermission('users.view'), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      accountType, // 'customer' or 'admin'
      role,
      status,
      plan,
      search,
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query;

    // Build filter query
    const filter = {};
    
    if (accountType) filter.accountType = accountType;
    if (role) filter.role = role;
    if (status) filter.status = status;
    if (plan) filter.plan = plan;
    
    // Search by name or email
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Execute query
    const users = await User.find(filter)
      .select('-password -emailVerificationToken -resetPasswordToken')
      .populate('customRole', 'name permissions')
      .populate('assignedBy', 'name email')
      .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await User.countDocuments(filter);

    // Get statistics
    const stats = {
      totalUsers: await User.countDocuments(),
      totalSellers: await User.countDocuments({ accountType: 'customer' }),
      totalAdmins: await User.countDocuments({ accountType: 'admin' }),
      activeUsers: await User.countDocuments({ status: 'active' }),
      suspendedUsers: await User.countDocuments({ status: 'suspended' }),
      pendingVerification: await User.countDocuments({ status: 'pending_verification' })
    };

    res.json({
      success: true,
      users: users.map(user => ({
        id: user._id,
        name: user.name,
        email: user.email,
        accountType: user.accountType,
        role: user.role,
        customRole: user.customRole,
        status: user.status,
        plan: user.plan,
        analysisCount: user.analysisCount,
        analysisLimit: user.analysisLimit,
        subscriptionStatus: user.subscriptionStatus,
        isEmailVerified: user.isEmailVerified,
        lastLogin: user.lastLogin,
        lastLoginIP: user.lastLoginIP,
        department: user.department,
        assignedBy: user.assignedBy,
        createdAt: user.createdAt
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
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users'
    });
  }
});

// @route   GET /api/admin/users/:id
// @desc    Get single user by ID
// @access  Private (Admin with users.view permission)
router.get('/:id', adminAuth, checkPermission('users.view'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('customRole', 'name permissions description')
      .populate('assignedBy', 'name email')
      .populate('createdBy', 'name email');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user's permissions
    const permissions = await user.getPermissions();

    // Get user's activity logs (last 10)
    const recentActivity = await ActivityLog.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('action description ipAddress createdAt status');

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        accountType: user.accountType,
        role: user.role,
        customRole: user.customRole,
        permissions: permissions,
        status: user.status,
        plan: user.plan,
        analysisCount: user.analysisCount,
        analysisLimit: user.analysisLimit,
        monthlyResetDate: user.monthlyResetDate,
        stripeCustomerId: user.stripeCustomerId,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionId: user.subscriptionId,
        subscriptionStartDate: user.subscriptionStartDate,
        subscriptionEndDate: user.subscriptionEndDate,
        department: user.department,
        isEmailVerified: user.isEmailVerified,
        lastLogin: user.lastLogin,
        lastLoginIP: user.lastLoginIP,
        loginAttempts: user.loginAttempts,
        lockUntil: user.lockUntil,
        assignedBy: user.assignedBy,
        createdBy: user.createdBy,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      recentActivity
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user'
    });
  }
});

// @route   POST /api/admin/users
// @desc    Create new admin user
// @access  Private (Super Admin or Admin with users.create permission)
router.post('/', adminAuth, checkPermission('users.create'), async (req, res) => {
  try {
    const { name, email, password, role, customRoleId, department } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters'
      });
    }

    // Only super admin can create super admin
    if (role === 'super_admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Only super admin can create another super admin'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Validate custom role if provided
    let customRole = null;
    if (role === 'custom' && customRoleId) {
      customRole = await CustomRole.findById(customRoleId);
      if (!customRole) {
        return res.status(400).json({
          success: false,
          message: 'Custom role not found'
        });
      }
    }

    // Create new admin user
    const user = new User({
      name,
      email,
      password,
      accountType: 'admin',
      role: role || 'viewer',
      customRole: customRoleId || null,
      department,
      status: 'active',
      isEmailVerified: true, // Admins don't need email verification
      assignedBy: req.userId,
      createdBy: req.userId
    });

    await user.save();

    // Log activity
    await ActivityLog.logActivity({
      userId: req.userId,
      userName: req.user.name,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'user_created',
      actionType: 'create',
      targetModel: 'User',
      targetId: user._id,
      targetName: user.name,
      description: `Created new admin user: ${user.email}`,
      metadata: { userRole: user.role, department: user.department },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success'
    });

    // Create notification for new admin
    await Notification.createNotification({
      recipientId: user._id,
      recipientType: 'admin',
      type: 'welcome',
      title: 'Welcome to Admin Panel',
      message: `Your admin account has been created by ${req.user.name}. Your role is: ${user.role}`,
      priority: 'high'
    });

    res.status(201).json({
      success: true,
      message: 'Admin user created successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        status: user.status
      }
    });

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating user'
    });
  }
});

// @route   PUT /api/admin/users/:id
// @desc    Update user
// @access  Private (Admin with users.edit permission)
router.put('/:id', adminAuth, checkPermission('users.edit'), async (req, res) => {
  try {
    const { name, role, customRoleId, department, status, plan } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent editing super admin by non-super admin
    if (user.role === 'super_admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Only super admin can edit another super admin'
      });
    }

    // Only super admin can assign super admin role
    if (role === 'super_admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Only super admin can assign super admin role'
      });
    }

    // Validate custom role if provided
    if (role === 'custom' && customRoleId) {
      const customRole = await CustomRole.findById(customRoleId);
      if (!customRole) {
        return res.status(400).json({
          success: false,
          message: 'Custom role not found'
        });
      }
      user.customRole = customRoleId;
    }

    // Update fields
    if (name) user.name = name;
    if (role) user.role = role;
    if (department !== undefined) user.department = department;
    if (status) user.status = status;
    if (plan && user.accountType === 'customer') {
      user.plan = plan;
      user.updateAnalysisLimit();
    }

    await user.save();

    // Log activity
    await ActivityLog.logActivity({
      userId: req.userId,
      userName: req.user.name,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'user_updated',
      actionType: 'update',
      targetModel: 'User',
      targetId: user._id,
      targetName: user.name,
      description: `Updated user: ${user.email}`,
      metadata: req.body,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success'
    });

    // Notify user of changes
    await Notification.createNotification({
      recipientId: user._id,
      type: 'admin_message',
      title: 'Account Updated',
      message: `Your account has been updated by ${req.user.name}`,
      priority: 'medium'
    });

    res.json({
      success: true,
      message: 'User updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        plan: user.plan
      }
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user'
    });
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete user
// @access  Private (Super Admin or Admin with users.delete permission)
router.delete('/:id', adminAuth, checkPermission('users.delete'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent deleting super admin by non-super admin
    if (user.role === 'super_admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Only super admin can delete another super admin'
      });
    }

    // Prevent self-deletion
    if (user._id.toString() === req.userId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }

    const userName = user.name;
    const userEmail = user.email;

    await user.deleteOne();

    // Log activity
    await ActivityLog.logActivity({
      userId: req.userId,
      userName: req.user.name,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'user_deleted',
      actionType: 'delete',
      targetModel: 'User',
      targetId: req.params.id,
      targetName: userName,
      description: `Deleted user: ${userEmail}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success'
    });

    res.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user'
    });
  }
});

// @route   POST /api/admin/users/:id/suspend
// @desc    Suspend user
// @access  Private (Admin with users.suspend permission)
router.post('/:id/suspend', adminAuth, checkPermission('users.suspend'), async (req, res) => {
  try {
    const { reason } = req.body;
    
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent suspending super admin
    if (user.role === 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot suspend super admin'
      });
    }

    user.status = 'suspended';
    await user.save();

    // Log activity
    await ActivityLog.logActivity({
      userId: req.userId,
      userName: req.user.name,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'user_suspended',
      actionType: 'update',
      targetModel: 'User',
      targetId: user._id,
      targetName: user.name,
      description: `Suspended user: ${user.email}${reason ? ` - Reason: ${reason}` : ''}`,
      metadata: { reason },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success'
    });

    // Notify user
    await Notification.createNotification({
      recipientId: user._id,
      type: 'account_suspended',
      title: 'Account Suspended',
      message: reason || 'Your account has been suspended. Please contact support for more information.',
      priority: 'urgent'
    });

    res.json({
      success: true,
      message: 'User suspended successfully'
    });

  } catch (error) {
    console.error('Suspend user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error suspending user'
    });
  }
});

// @route   POST /api/admin/users/:id/activate
// @desc    Activate user
// @access  Private (Admin with users.activate permission)
router.post('/:id/activate', adminAuth, checkPermission('users.activate'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.status = 'active';
    await user.save();

    // Log activity
    await ActivityLog.logActivity({
      userId: req.userId,
      userName: req.user.name,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'user_activated',
      actionType: 'update',
      targetModel: 'User',
      targetId: user._id,
      targetName: user.name,
      description: `Activated user: ${user.email}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success'
    });

    // Notify user
    await Notification.createNotification({
      recipientId: user._id,
      type: 'account_activated',
      title: 'Account Activated',
      message: 'Your account has been activated. You can now access all features.',
      priority: 'high'
    });

    res.json({
      success: true,
      message: 'User activated successfully'
    });

  } catch (error) {
    console.error('Activate user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error activating user'
    });
  }
});

module.exports = router;
