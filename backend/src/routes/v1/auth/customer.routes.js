const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User } = require('../../../models/user');
const { ActivityLog } = require('../../../models/admin');
const { Notification } = require('../../../models/notification');
const { auth } = require('../../../middleware/auth');
const { validateEmail } = require('../../../middleware/validation');
const { getWelcomeNotification } = require('../../../utils/helpers');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId }, 
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Generate email verification token
const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// @route   POST /api/v1/auth/customer/signup
// @desc    Register new customer
// @access  Public
router.post('/signup', validateEmail, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
        action: 'retry'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters',
        action: 'retry'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered. Please login instead.',
        action: 'login',
        loginUrl: '/api/v1/auth/customer/login'
      });
    }

    // Generate email verification token
    const verificationToken = generateVerificationToken();
    const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Create new customer
    const user = new User({
      name,
      email,
      password,
      accountType: 'customer',
      role: 'customer',
      status: 'pending_verification',
      plan: 'free',
      analysisLimit: 1,
      analysisCount: 0,
      isEmailVerified: false,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpiry
    });

    await user.save();

    // TODO: Send verification email
    const verificationLink = `${process.env.CUSTOMER_FRONTEND_URL}/verify-email?token=${verificationToken}`;

    // Log activity
    await ActivityLog.logActivity({
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      userRole: user.role,
      action: 'signup',
      actionType: 'auth',
      description: `New customer registered: ${user.email}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success'
    });

    // Create welcome notification - DYNAMIC
    const welcomeNotification = getWelcomeNotification();
    await Notification.createNotification({
      recipientId: user._id,
      ...welcomeNotification
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      nextStep: 'Please check your email to verify your account.',
      verificationRequired: true,
      verificationLink: process.env.NODE_ENV === 'development' ? verificationLink : undefined
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating account. Please try again later.',
      action: 'retry'
    });
  }
});

// @route   POST /api/v1/auth/customer/login
// @desc    Login customer
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
        action: 'retry'
      });
    }

    // Find user
    const user = await User.findOne({ email, accountType: 'customer' });
    
    // User doesn't exist
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email. Please sign up first.',
        action: 'signup',
        signupUrl: '/api/v1/auth/customer/signup'
      });
    }

    // Account locked
    if (user.isLocked()) {
      const lockMinutes = Math.ceil((user.lockUntil - Date.now()) / (60 * 1000));
      return res.status(423).json({
        success: false,
        message: `Account temporarily locked. Please try again in ${lockMinutes} minutes.`,
        action: 'wait',
        lockedUntil: user.lockUntil,
        contactSupport: process.env.SUPPORT_EMAIL || 'support@example.com'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      await user.incLoginAttempts();
      const attemptsRemaining = Math.max(0, 5 - user.loginAttempts);
      
      await ActivityLog.logActivity({
        userId: user._id,
        userName: user.name,
        userEmail: user.email,
        userRole: user.role,
        action: 'login',
        actionType: 'auth',
        description: 'Failed login attempt - incorrect password',
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        status: 'failed',
        errorMessage: 'Incorrect password'
      });
      
      return res.status(401).json({
        success: false,
        message: attemptsRemaining > 0 
          ? `Incorrect password. ${attemptsRemaining} attempts remaining.`
          : 'Incorrect password. Account will be locked after next failed attempt.',
        action: 'retry',
        attemptsRemaining
      });
    }

    // Email not verified
    if (!user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email before logging in.',
        action: 'verify_email',
        emailVerificationRequired: true,
        resendUrl: '/api/v1/auth/customer/resend-verification',
        hint: 'Check your email inbox for verification link.'
      });
    }

    // Account not active
    if (user.status !== 'active') {
      const statusMessages = {
        pending_verification: 'Your account is pending verification.',
        suspended: 'Your account has been suspended. Please contact support.',
        banned: 'Your account has been banned. Please contact support.',
        inactive: 'Your account is inactive. Please contact support.'
      };
      
      return res.status(403).json({
        success: false,
        message: statusMessages[user.status] || 'Your account is not active.',
        action: 'contact_support',
        accountStatus: user.status,
        contactSupport: process.env.SUPPORT_EMAIL || 'support@example.com'
      });
    }

    // Success - reset attempts and login
    await user.resetLoginAttempts();
    user.lastLogin = new Date();
    user.lastLoginIP = req.ip;
    await user.save();

    await ActivityLog.logActivity({
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      userRole: user.role,
      action: 'login',
      actionType: 'auth',
      description: 'Successful login',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success'
    });

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        plan: user.plan,
        analysisCount: user.analysisCount,
        analysisLimit: user.analysisLimit,
        subscriptionStatus: user.subscriptionStatus
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in. Please try again later.',
      action: 'retry'
    });
  }
});

// @route   GET /api/v1/auth/customer/verify-email/:token
// @desc    Verify email address
// @access  Public
router.get('/verify-email/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token',
        action: 'resend',
        resendUrl: '/api/v1/auth/customer/resend-verification'
      });
    }

    user.isEmailVerified = true;
    user.status = 'active';
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    await ActivityLog.logActivity({
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      userRole: user.role,
      action: 'email_verification',
      actionType: 'auth',
      description: `Email verified for: ${user.email}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success'
    });

    res.json({
      success: true,
      message: 'Email verified successfully! You can now log in.',
      action: 'login',
      loginUrl: '/api/v1/auth/customer/login'
    });

  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying email',
      action: 'retry'
    });
  }
});

// @route   POST /api/v1/auth/customer/resend-verification
// @desc    Resend verification email
// @access  Public
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
        action: 'retry'
      });
    }

    const user = await User.findOne({ email, accountType: 'customer' });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email',
        action: 'signup',
        signupUrl: '/api/v1/auth/customer/signup'
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email already verified. You can login now.',
        action: 'login',
        loginUrl: '/api/v1/auth/customer/login'
      });
    }

    const verificationToken = generateVerificationToken();
    const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpires = verificationExpiry;
    await user.save();

    // TODO: Send verification email
    const verificationLink = `${process.env.CUSTOMER_FRONTEND_URL}/verify-email?token=${verificationToken}`;

    await ActivityLog.logActivity({
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      userRole: user.role,
      action: 'resend_verification',
      actionType: 'auth',
      description: `Verification email resent to: ${user.email}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success'
    });

    res.json({
      success: true,
      message: 'Verification email sent! Please check your inbox.',
      verificationLink: process.env.NODE_ENV === 'development' ? verificationLink : undefined
    });

  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending verification email',
      action: 'retry'
    });
  }
});

// @route   GET /api/v1/auth/customer/me
// @desc    Get current customer
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password -emailVerificationToken');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        accountType: user.accountType,
        role: user.role,
        plan: user.plan,
        analysisCount: user.analysisCount,
        analysisLimit: user.analysisLimit,
        monthlyResetDate: user.monthlyResetDate,
        subscriptionStatus: user.subscriptionStatus,
        isEmailVerified: user.isEmailVerified,
        status: user.status,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user data'
    });
  }
});

// @route   POST /api/v1/auth/customer/logout
// @desc    Logout customer
// @access  Private
router.post('/logout', auth, async (req, res) => {
  try {
    await ActivityLog.logActivity({
      userId: req.userId,
      action: 'logout',
      actionType: 'auth',
      description: 'User logged out',
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success'
    });

    res.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging out'
    });
  }
});

module.exports = router;
