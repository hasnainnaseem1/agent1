const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  // Who performed the action
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  userName: {
    type: String,
    required: true
  },
  userEmail: {
    type: String,
    required: true
  },
  userRole: {
    type: String,
    required: true
  },
  
  // What action was performed
  action: {
    type: String,
    required: true,
    enum: [
      // Authentication
      'login', 'logout', 'signup', 'password_reset', 'email_verification',
      
      // User Management
      'user_created', 'user_updated', 'user_deleted', 'user_suspended', 'user_activated',
      
      // Customer Management
      'seller_created', 'seller_updated', 'seller_deleted', 'seller_suspended', 
      'seller_activated', 'seller_plan_changed', 'seller_verified',
      
      // Role Management
      'role_created', 'role_updated', 'role_deleted', 'role_assigned',
      
      // Settings
      'settings_updated', 'system_config_changed',
      
      // Analysis
      'analysis_performed', 'analysis_deleted',
      
      // Other
      'data_exported', 'backup_created', 'system_maintenance'
    ]
  },
  
  // Action details
  actionType: {
    type: String,
    enum: ['create', 'read', 'update', 'delete', 'auth', 'export', 'system'],
    required: true
  },
  
  // What entity was affected
  targetModel: {
    type: String,
    enum: ['User', 'CustomRole', 'Analysis', 'Settings', 'Notification', 'System'],
    default: null
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  targetName: {
    type: String,
    default: null
  },
  
  // Additional details
  description: {
    type: String,
    required: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Request info
  ipAddress: {
    type: String,
    default: null
  },
  userAgent: {
    type: String,
    default: null
  },
  
  // Status
  status: {
    type: String,
    enum: ['success', 'failed', 'warning'],
    default: 'success'
  },
  errorMessage: {
    type: String,
    default: null
  },
  
  // Timestamp
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: false // We only need createdAt
});

// Indexes for faster queries
activityLogSchema.index({ userId: 1, createdAt: -1 });
activityLogSchema.index({ action: 1, createdAt: -1 });
activityLogSchema.index({ actionType: 1, createdAt: -1 });
activityLogSchema.index({ status: 1, createdAt: -1 });
activityLogSchema.index({ targetModel: 1, targetId: 1 });

// Static method to log activity
activityLogSchema.statics.logActivity = async function({
  userId,
  userName,
  userEmail,
  userRole,
  action,
  actionType,
  targetModel = null,
  targetId = null,
  targetName = null,
  description,
  metadata = {},
  ipAddress = null,
  userAgent = null,
  status = 'success',
  errorMessage = null
}) {
  try {
    const log = new this({
      userId,
      userName,
      userEmail,
      userRole,
      action,
      actionType,
      targetModel,
      targetId,
      targetName,
      description,
      metadata,
      ipAddress,
      userAgent,
      status,
      errorMessage
    });
    
    await log.save();
    return log;
  } catch (error) {
    console.error('Error logging activity:', error);
    // Don't throw error - logging should never break the main flow
    return null;
  }
};

module.exports = mongoose.model('ActivityLog', activityLogSchema);
