const mongoose = require('mongoose');

const adminSettingsSchema = new mongoose.Schema({
  // ==========================================
  // THEME & BRANDING SETTINGS
  // ==========================================
  themeSettings: {
    // Application Branding
    appName: {
      type: String,
      default: 'My Platform'
    },
    appTagline: {
      type: String,
      default: 'Your Business Optimization Platform'
    },
    appDescription: {
      type: String,
      default: 'AI-powered business optimization platform'
    },
    
    // Logo URLs
    logoUrl: {
      type: String,
      default: ''
    },
    logoSmallUrl: {
      type: String,
      default: ''
    },
    faviconUrl: {
      type: String,
      default: ''
    },
    
    // Service/Product Keywords
    primaryService: {
      type: String,
      default: 'SEO'
    },
    secondaryService: {
      type: String,
      default: 'Optimization'
    },
    targetPlatform: {
      type: String,
      default: 'Etsy'
    },
    toolType: {
      type: String,
      default: 'AI Agent'
    },
    
    // Welcome Messages
    welcomeTitle: {
      type: String,
      default: 'Welcome to {APP_NAME}!'
    },
    welcomeMessage: {
      type: String,
      default: 'Thank you for joining {APP_NAME}. Please verify your email to get started.'
    },
    emailVerificationMessage: {
      type: String,
      default: 'Please verify your email to start using our platform.'
    },
    
    // Colors (for frontend theme)
    primaryColor: {
      type: String,
      default: '#7C3AED'
    },
    secondaryColor: {
      type: String,
      default: '#3B82F6'
    },
    accentColor: {
      type: String,
      default: '#10B981'
    }
  },

  // ==========================================
  // GENERAL SETTINGS
  // ==========================================
  siteName: {
    type: String,
    default: 'My Platform'
  },
  siteDescription: {
    type: String,
    default: 'AI-powered platform'
  },
  supportEmail: {
    type: String,
    default: 'support@example.com'
  },
  contactEmail: {
    type: String,
    default: 'contact@example.com'
  },

  // ==========================================
  // EMAIL SETTINGS
  // ==========================================
  emailSettings: {
    smtpHost: String,
    smtpPort: Number,
    smtpUser: String,
    smtpPassword: String,
    fromEmail: String,
    fromName: {
      type: String,
      default: 'Platform Team'
    },
    subjectPrefix: {
      type: String,
      default: '[Platform]'
    }
  },

  // ==========================================
  // CUSTOMER SETTINGS
  // ==========================================
  customerSettings: {
    requireEmailVerification: {
      type: Boolean,
      default: true
    },
    allowTemporaryEmails: {
      type: Boolean,
      default: false
    },
    autoApproveNewcustomers: {
      type: Boolean,
      default: true
    },
    defaultPlan: {
      type: String,
      enum: ['free', 'starter', 'pro', 'unlimited'],
      default: 'free'
    },
    freeTrialDays: {
      type: Number,
      default: 0
    }
  },

  // ==========================================
  // SECURITY SETTINGS
  // ==========================================
  securitySettings: {
    maxLoginAttempts: {
      type: Number,
      default: 5
    },
    lockoutDuration: {
      type: Number,
      default: 2 * 60 * 60 * 1000
    },
    passwordMinLength: {
      type: Number,
      default: 8
    },
    requireStrongPassword: {
      type: Boolean,
      default: true
    },
    sessionTimeout: {
      type: Number,
      default: 7 * 24 * 60 * 60 * 1000
    },
    twoFactorEnabled: {
      type: Boolean,
      default: false
    }
  },

  // ==========================================
  // ANALYTICS SETTINGS
  // ==========================================
  analyticsSettings: {
    enableTracking: {
      type: Boolean,
      default: true
    },
    dataRetentionDays: {
      type: Number,
      default: 90
    }
  },

  // ==========================================
  // NOTIFICATION SETTINGS
  // ==========================================
  notificationSettings: {
    enableEmailNotifications: {
      type: Boolean,
      default: true
    },
    enablePushNotifications: {
      type: Boolean,
      default: false
    },
    notifyAdminOnNewcustomer: {
      type: Boolean,
      default: true
    },
    notifyAdminOnSubscription: {
      type: Boolean,
      default: true
    }
  },

  // ==========================================
  // STRIPE SETTINGS
  // ==========================================
  stripeSettings: {
    publicKey: String,
    secretKey: String,
    webhookSecret: String
  },

  // ==========================================
  // MAINTENANCE MODE
  // ==========================================
  maintenanceMode: {
    enabled: {
      type: Boolean,
      default: false
    },
    message: {
      type: String,
      default: 'We are currently performing maintenance. Please check back soon.'
    },
    allowAdminAccess: {
      type: Boolean,
      default: true
    }
  },

  // ==========================================
  // FEATURE FLAGS
  // ==========================================
  features: {
    enableAnalysis: {
      type: Boolean,
      default: true
    },
    enableSubscriptions: {
      type: Boolean,
      default: true
    },
    enableCustomRoles: {
      type: Boolean,
      default: true
    },
    enableActivityLogs: {
      type: Boolean,
      default: true
    }
  },

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

// Update timestamp
adminSettingsSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Static method to get settings
adminSettingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  
  if (!settings) {
    settings = await this.create({});
  }
  
  return settings;
};

const AdminSettings = mongoose.model('AdminSettings', adminSettingsSchema);

module.exports = AdminSettings;
