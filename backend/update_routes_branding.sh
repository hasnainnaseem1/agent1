#!/bin/bash

echo "🎨 Updating routes to use dynamic branding..."
echo ""

# ==========================================
# UPDATE CUSTOMER AUTH ROUTES
# ==========================================
echo "📝 Updating customer.routes.js..."

cat > src/routes/v1/auth/customer.routes.js << 'CUSTOMERROUTES'
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User } = require('../../../models/user');
const { ActivityLog } = require('../../../models/admin');
const { Notification } = require('../../../models/notification');
const { auth } = require('../../../middleware/auth');
const { validateEmail } = require('../../../middleware/validation');
const { getWelcomeNotification, getEmailVerificationMessage } = require('../../../utils/helpers');

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
        message: 'Please provide all required fields'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters'
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

    // Create welcome notification - DYNAMIC from .env
    const welcomeNotification = getWelcomeNotification();
    await Notification.createNotification({
      recipientId: user._id,
      ...welcomeNotification
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully. Please check your email to verify your account.',
      verificationRequired: true,
      verificationLink: process.env.NODE_ENV === 'development' ? verificationLink : undefined
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating account'
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
        message: 'Invalid or expired verification token'
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
      message: 'Email verified successfully! You can now log in.'
    });

  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying email'
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
        message: 'Email is required'
      });
    }

    const user = await User.findOne({ email, accountType: 'customer' });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email already verified'
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
      message: 'Error sending verification email'
    });
  }
});

// @route   POST /api/v1/auth/customer/login
// @desc    Login customer
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    const user = await User.findOne({ email, accountType: 'customer' });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    if (user.isLocked()) {
      return res.status(423).json({
        success: false,
        message: 'Account is temporarily locked due to too many failed login attempts. Please try again later.'
      });
    }

    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      await user.incLoginAttempts();
      
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
        message: 'Invalid email or password'
      });
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email before logging in',
        emailVerificationRequired: true
      });
    }

    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Your account is not active. Please contact support.',
        accountStatus: user.status
      });
    }

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
      message: 'Error logging in'
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
CUSTOMERROUTES

echo "  ✅ Updated customer.routes.js with dynamic branding"

# ==========================================
# UPDATE APP.JS
# ==========================================
echo ""
echo "📝 Updating app.js..."

cat > src/app.js << 'APPJS'
const express = require('express');
const cors = require('cors');
const { getAppInfo } = require('./utils/helpers');
require('dotenv').config();

const app = express();

// ==========================================
// MIDDLEWARE
// ==========================================

// CORS
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true
}));

// Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request Logging (Development only)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// ==========================================
// ROUTES
// ==========================================

// Import main routes
const routes = require('./routes');

// Mount API routes
app.use('/api', routes);

// Root endpoint - Dynamic branding
app.get('/', (req, res) => {
  const appInfo = getAppInfo();
  
  res.json({
    success: true,
    ...appInfo,
    endpoints: {
      health: '/api/health',
      docs: '/api/docs',
      customer: {
        auth: '/api/v1/auth/customer',
        analysis: '/api/v1/customer/analysis',
        history: '/api/v1/customer/history'
      },
      admin: {
        auth: '/api/v1/auth/admin',
        users: '/api/v1/admin/users',
        customers: '/api/v1/admin/customers',
        analytics: '/api/v1/admin/analytics',
        roles: '/api/v1/admin/roles',
        logs: '/api/v1/admin/logs',
        settings: '/api/v1/admin/settings'
      }
    }
  });
});

// ==========================================
// ERROR HANDLING
// ==========================================

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  const errorMessage = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message;
  
  res.status(err.status || 500).json({
    success: false,
    message: errorMessage,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

module.exports = app;
APPJS

echo "  ✅ Updated app.js with dynamic branding"

echo ""
echo "✅ All routes updated to use dynamic branding!"

