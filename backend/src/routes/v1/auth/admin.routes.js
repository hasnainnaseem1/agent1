const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { User } = require('../../../models/user');
const { ActivityLog } = require('../../../models/admin');
const { adminAuth } = require('../../../middleware/auth');
// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId }, 
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// @route   POST /api/admin/auth/login
// @desc    Login admin
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find admin user
    const user = await User.findOne({ 
      email, 
      accountType: 'admin' 
    });
    
    if (!user) {
      // Log failed login attempt
      await ActivityLog.logActivity({
        userId: null,
        userName: 'Unknown',
        userEmail: email,
        userRole: 'unknown',
        action: 'login',
        actionType: 'auth',
        description: 'Failed admin login attempt - user not found',
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        status: 'failed',
        errorMessage: 'User not found or not an admin'
      });
      
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials or insufficient privileges'
      });
    }

    // Check if account is locked
    if (user.isLocked()) {
      return res.status(423).json({
        success: false,
        message: 'Account is temporarily locked due to too many failed login attempts. Please try again later.'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      // Increment login attempts
      await user.incLoginAttempts();
      
      // Log failed login
      await ActivityLog.logActivity({
        userId: user._id,
        userName: user.name,
        userEmail: user.email,
        userRole: user.role,
        action: 'login',
        actionType: 'auth',
        description: 'Failed admin login attempt - incorrect password',
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        status: 'failed',
        errorMessage: 'Incorrect password'
      });
      
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check account status
    if (user.status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended. Please contact the system administrator.'
      });
    }

    if (user.status === 'banned') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been banned.'
      });
    }

    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Your account is not active. Please contact the system administrator.'
      });
    }

    // Reset login attempts on successful login
    await user.resetLoginAttempts();

    // Update last login
    user.lastLogin = new Date();
    user.lastLoginIP = req.ip;
    await user.save();

    // Log successful login
    await ActivityLog.logActivity({
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      userRole: user.role,
      action: 'login',
      actionType: 'auth',
      description: 'Successful admin login',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success'
    });

    // Generate token
    const token = generateToken(user._id);

    // Get permissions
    const permissions = await user.getPermissions();

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        accountType: user.accountType,
        role: user.role,
        department: user.department,
        permissions: permissions,
        lastLogin: user.lastLogin
      }
    });

  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in'
    });
  }
});

// @route   GET /api/admin/auth/me
// @desc    Get current admin user
// @access  Private (Admin)
router.get('/me', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .select('-password')
      .populate('customRole', 'name permissions');
    
    const permissions = await user.getPermissions();

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        accountType: user.accountType,
        role: user.role,
        customRole: user.customRole,
        department: user.department,
        permissions: permissions,
        status: user.status,
        lastLogin: user.lastLogin,
        lastLoginIP: user.lastLoginIP,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('Get admin user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user data'
    });
  }
});

// @route   POST /api/admin/auth/logout
// @desc    Logout admin
// @access  Private (Admin)
router.post('/logout', adminAuth, async (req, res) => {
  try {
    // Log logout activity
    await ActivityLog.logActivity({
      userId: req.userId,
      userName: req.user.name,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'logout',
      actionType: 'auth',
      description: 'Admin logged out',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success'
    });

    res.json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Admin logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging out'
    });
  }
});

// @route   POST /api/admin/auth/change-password
// @desc    Change admin password
// @access  Private (Admin)
router.post('/change-password', adminAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new password'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters'
      });
    }

    const user = await User.findById(req.userId);

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Log password change
    await ActivityLog.logActivity({
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      userRole: user.role,
      action: 'password_reset',
      actionType: 'auth',
      description: 'Admin password changed successfully',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success'
    });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error changing password'
    });
  }
});

module.exports = router;
