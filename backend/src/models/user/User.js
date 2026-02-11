const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Basic Info
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters']
  },
  
  // Account Type & Role
  accountType: {
    type: String,
    enum: ['customer', 'admin'],
    default: 'customer',
    required: true
  },
  role: {
    type: String,
    enum: ['customer', 'super_admin', 'admin', 'moderator', 'viewer', 'custom'],
    default: 'customer',
    required: true
  },
  
  // Custom Role (if role is 'custom')
  customRole: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CustomRole',
    default: null
  },
  
  // Account Status
  status: {
    type: String,
    enum: ['pending_verification', 'active', 'suspended', 'banned', 'inactive'],
    default: 'pending_verification'
  },
  
  // Email Verification
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  
  // Customer-Specific Fields
  plan: {
    type: String,
    enum: ['free', 'starter', 'pro', 'unlimited'],
    default: 'free'
  },
  analysisCount: {
    type: Number,
    default: 0
  },
  analysisLimit: {
    type: Number,
    default: 1
  },
  monthlyResetDate: {
    type: Date,
    default: () => {
      const now = new Date();
      return new Date(now.getFullYear(), now.getMonth() + 1, 1);
    }
  },
  subscriptionStatus: {
    type: String,
    enum: ['none', 'active', 'expired', 'cancelled'],
    default: 'none'
  },
  subscriptionId: String,
  stripeCustomerId: String,
  
  // Admin-Specific Fields
  department: String,
  permissions: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: new Map()
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Security
  lastLogin: Date,
  lastLoginIP: String,
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date,
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Update timestamp
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Update analysis limit based on plan
userSchema.methods.updateAnalysisLimit = function() {
  const limits = {
    free: 1,
    starter: 50,
    pro: 250,
    unlimited: 999999
  };
  this.analysisLimit = limits[this.plan] || 1;
};

// Check if user can perform analysis
userSchema.methods.canAnalyze = function() {
  return this.analysisCount < this.analysisLimit;
};

// Reset monthly analysis count
userSchema.methods.resetMonthlyCount = function() {
  const now = new Date();
  const resetDate = new Date(this.monthlyResetDate);
  
  if (now >= resetDate) {
    this.analysisCount = 0;
    this.monthlyResetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return true;
  }
  return false;
};

// Check if account is locked
userSchema.methods.isLocked = function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

// Increment login attempts
userSchema.methods.incLoginAttempts = async function() {
  // Reset attempts if lock has expired
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  }
  
  // Otherwise increment
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 attempts
  const maxAttempts = 5;
  const lockTime = 2 * 60 * 60 * 1000; // 2 hours
  
  if (this.loginAttempts + 1 >= maxAttempts && !this.isLocked()) {
    updates.$set = { lockUntil: Date.now() + lockTime };
  }
  
  return this.updateOne(updates);
};

// Reset login attempts
userSchema.methods.resetLoginAttempts = async function() {
  return this.updateOne({
    $set: { loginAttempts: 0 },
    $unset: { lockUntil: 1 }
  });
};

// Get user permissions
userSchema.methods.getPermissions = function() {
  if (this.role === 'super_admin') {
    return ['*']; // All permissions
  }
  
  if (this.role === 'custom' && this.customRole) {
    return this.customRole.permissions || [];
  }
  
  // Built-in role permissions
  const builtInPermissions = {
    admin: [
      'users.view', 'users.create', 'users.edit', 'users.delete',
      'customers.view', 'customers.edit', 'customers.plans',
      'analytics.view', 'logs.view', 'settings.edit'
    ],
    moderator: [
      'users.view', 'customers.view', 'customers.edit',
      'analytics.view', 'logs.view'
    ],
    viewer: [
      'users.view', 'customers.view', 'analytics.view', 'logs.view'
    ]
  };
  
  return builtInPermissions[this.role] || [];
};

// Check if user has permission
userSchema.methods.hasPermission = function(permission) {
  const permissions = this.getPermissions();
  
  // Super admin has all permissions
  if (permissions.includes('*')) return true;
  
  // Check exact permission
  if (permissions.includes(permission)) return true;
  
  // Check wildcard permissions (e.g., users.*)
  const [resource, action] = permission.split('.');
  if (permissions.includes(`${resource}.*`)) return true;
  
  return false;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
