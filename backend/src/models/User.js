const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
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
    default: 1 // Free plan limit
  },
  stripeCustomerId: {
    type: String,
    default: null
  },
  subscriptionStatus: {
    type: String,
    enum: ['active', 'inactive', 'cancelled', 'past_due'],
    default: 'inactive'
  },
  subscriptionEndDate: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
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

// Check if user can analyze
userSchema.methods.canAnalyze = function() {
  return this.analysisCount < this.analysisLimit;
};

// Reset monthly count (for subscription users)
userSchema.methods.resetMonthlyCount = function() {
  this.analysisCount = 0;
  return this.save();
};

module.exports = mongoose.model('User', userSchema);