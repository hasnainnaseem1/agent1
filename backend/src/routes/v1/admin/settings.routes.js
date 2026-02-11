const express = require('express');
const router = express.Router();
const { ActivityLog, AdminSettings } = require('../../../models/admin');
const { adminAuth } = require('../../../middleware/auth');
const { checkPermission, checkRole } = require('../../../middleware/security');

// @route   GET /api/admin/settings
// @desc    Get all admin settings
// @access  Private (Admin with settings.view permission)
router.get('/', adminAuth, checkPermission('settings.view'), async (req, res) => {
  try {
    const settings = await AdminSettings.getSettings();

    // Hide sensitive information for non-super admins
    const sanitizedSettings = { ...settings.toObject() };
    
    if (req.user.role !== 'super_admin') {
      delete sanitizedSettings.emailSettings.smtpPassword;
      delete sanitizedSettings.stripeSettings.secretKey;
      delete sanitizedSettings.stripeSettings.webhookSecret;
    }

    res.json({
      success: true,
      settings: sanitizedSettings
    });

  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching settings'
    });
  }
});

// @route   PUT /api/admin/settings/general
// @desc    Update general settings
// @access  Private (Admin with settings.edit permission)
router.put('/general', adminAuth, checkPermission('settings.edit'), async (req, res) => {
  try {
    const { siteName, siteDescription, supportEmail, contactEmail } = req.body;

    const settings = await AdminSettings.getSettings();

    if (siteName) settings.siteName = siteName;
    if (siteDescription) settings.siteDescription = siteDescription;
    if (supportEmail) settings.supportEmail = supportEmail;
    if (contactEmail) settings.contactEmail = contactEmail;

    settings.lastUpdatedBy = req.userId;
    await settings.save();

    // Log activity
    await ActivityLog.logActivity({
      userId: req.userId,
      userName: req.user.name,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'settings_updated',
      actionType: 'update',
      targetModel: 'Settings',
      description: 'Updated general settings',
      metadata: req.body,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success'
    });

    res.json({
      success: true,
      message: 'General settings updated successfully'
    });

  } catch (error) {
    console.error('Update general settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating settings'
    });
  }
});

// @route   PUT /api/admin/settings/email
// @desc    Update email settings
// @access  Private (Super Admin or Admin with settings.edit permission)
router.put('/email', adminAuth, checkPermission('settings.edit'), async (req, res) => {
  try {
    const { smtpHost, smtpPort, smtpUser, smtpPassword, fromEmail, fromName } = req.body;

    const settings = await AdminSettings.getSettings();

    if (smtpHost) settings.emailSettings.smtpHost = smtpHost;
    if (smtpPort) settings.emailSettings.smtpPort = smtpPort;
    if (smtpUser) settings.emailSettings.smtpUser = smtpUser;
    if (smtpPassword) settings.emailSettings.smtpPassword = smtpPassword;
    if (fromEmail) settings.emailSettings.fromEmail = fromEmail;
    if (fromName) settings.emailSettings.fromName = fromName;

    settings.lastUpdatedBy = req.userId;
    await settings.save();

    // Log activity (without password)
    await ActivityLog.logActivity({
      userId: req.userId,
      userName: req.user.name,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'settings_updated',
      actionType: 'update',
      targetModel: 'Settings',
      description: 'Updated email settings',
      metadata: { ...req.body, smtpPassword: '***' },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success'
    });

    res.json({
      success: true,
      message: 'Email settings updated successfully'
    });

  } catch (error) {
    console.error('Update email settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating email settings'
    });
  }
});

// @route   PUT /api/admin/settings/customer
// @desc    Update customer settings
// @access  Private (Admin with settings.edit permission)
router.put('/customer', adminAuth, checkPermission('settings.edit'), async (req, res) => {
  try {
    const {
      requireEmailVerification,
      allowTemporaryEmails,
      autoApproveNewSellers,
      defaultPlan,
      freeTrialDays
    } = req.body;

    const settings = await AdminSettings.getSettings();

    if (requireEmailVerification !== undefined) {
      settings.sellerSettings.requireEmailVerification = requireEmailVerification;
    }
    if (allowTemporaryEmails !== undefined) {
      settings.sellerSettings.allowTemporaryEmails = allowTemporaryEmails;
    }
    if (autoApproveNewSellers !== undefined) {
      settings.sellerSettings.autoApproveNewSellers = autoApproveNewSellers;
    }
    if (defaultPlan) settings.sellerSettings.defaultPlan = defaultPlan;
    if (freeTrialDays !== undefined) settings.sellerSettings.freeTrialDays = freeTrialDays;

    settings.lastUpdatedBy = req.userId;
    await settings.save();

    // Log activity
    await ActivityLog.logActivity({
      userId: req.userId,
      userName: req.user.name,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'settings_updated',
      actionType: 'update',
      targetModel: 'Settings',
      description: 'Updated customer settings',
      metadata: req.body,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success'
    });

    res.json({
      success: true,
      message: 'Customer settings updated successfully'
    });

  } catch (error) {
    console.error('Update customer settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating customer settings'
    });
  }
});

// @route   PUT /api/admin/settings/security
// @desc    Update security settings
// @access  Private (Super Admin)
router.put('/security', adminAuth, checkPermission('settings.edit'), async (req, res) => {
  try {
    const {
      maxLoginAttempts,
      lockoutDuration,
      passwordMinLength,
      requireStrongPassword,
      sessionTimeout,
      twoFactorEnabled
    } = req.body;

    const settings = await AdminSettings.getSettings();

    if (maxLoginAttempts) settings.securitySettings.maxLoginAttempts = maxLoginAttempts;
    if (lockoutDuration) settings.securitySettings.lockoutDuration = lockoutDuration;
    if (passwordMinLength) settings.securitySettings.passwordMinLength = passwordMinLength;
    if (requireStrongPassword !== undefined) {
      settings.securitySettings.requireStrongPassword = requireStrongPassword;
    }
    if (sessionTimeout) settings.securitySettings.sessionTimeout = sessionTimeout;
    if (twoFactorEnabled !== undefined) {
      settings.securitySettings.twoFactorEnabled = twoFactorEnabled;
    }

    settings.lastUpdatedBy = req.userId;
    await settings.save();

    // Log activity
    await ActivityLog.logActivity({
      userId: req.userId,
      userName: req.user.name,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'settings_updated',
      actionType: 'update',
      targetModel: 'Settings',
      description: 'Updated security settings',
      metadata: req.body,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success'
    });

    res.json({
      success: true,
      message: 'Security settings updated successfully'
    });

  } catch (error) {
    console.error('Update security settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating security settings'
    });
  }
});

// @route   PUT /api/admin/settings/notification
// @desc    Update notification settings
// @access  Private (Admin with settings.edit permission)
router.put('/notification', adminAuth, checkPermission('settings.edit'), async (req, res) => {
  try {
    const {
      enableEmailNotifications,
      enablePushNotifications,
      notifyAdminOnNewSeller,
      notifyAdminOnSubscription
    } = req.body;

    const settings = await AdminSettings.getSettings();

    if (enableEmailNotifications !== undefined) {
      settings.notificationSettings.enableEmailNotifications = enableEmailNotifications;
    }
    if (enablePushNotifications !== undefined) {
      settings.notificationSettings.enablePushNotifications = enablePushNotifications;
    }
    if (notifyAdminOnNewSeller !== undefined) {
      settings.notificationSettings.notifyAdminOnNewSeller = notifyAdminOnNewSeller;
    }
    if (notifyAdminOnSubscription !== undefined) {
      settings.notificationSettings.notifyAdminOnSubscription = notifyAdminOnSubscription;
    }

    settings.lastUpdatedBy = req.userId;
    await settings.save();

    // Log activity
    await ActivityLog.logActivity({
      userId: req.userId,
      userName: req.user.name,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'settings_updated',
      actionType: 'update',
      targetModel: 'Settings',
      description: 'Updated notification settings',
      metadata: req.body,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success'
    });

    res.json({
      success: true,
      message: 'Notification settings updated successfully'
    });

  } catch (error) {
    console.error('Update notification settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating notification settings'
    });
  }
});

// @route   PUT /api/admin/settings/maintenance
// @desc    Toggle maintenance mode
// @access  Private (Super Admin)
router.put('/maintenance', adminAuth, checkPermission('settings.edit'), async (req, res) => {
  try {
    const { enabled, message, allowAdminAccess } = req.body;

    // Only super admin can toggle maintenance mode
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Only super admin can toggle maintenance mode'
      });
    }

    const settings = await AdminSettings.getSettings();

    if (enabled !== undefined) settings.maintenanceMode.enabled = enabled;
    if (message) settings.maintenanceMode.message = message;
    if (allowAdminAccess !== undefined) {
      settings.maintenanceMode.allowAdminAccess = allowAdminAccess;
    }

    settings.lastUpdatedBy = req.userId;
    await settings.save();

    // Log activity
    await ActivityLog.logActivity({
      userId: req.userId,
      userName: req.user.name,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'system_maintenance',
      actionType: 'system',
      targetModel: 'Settings',
      description: `Maintenance mode ${enabled ? 'enabled' : 'disabled'}`,
      metadata: req.body,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success'
    });

    res.json({
      success: true,
      message: `Maintenance mode ${enabled ? 'enabled' : 'disabled'} successfully`
    });

  } catch (error) {
    console.error('Update maintenance mode error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating maintenance mode'
    });
  }
});

// @route   PUT /api/admin/settings/features
// @desc    Toggle feature flags
// @access  Private (Super Admin or Admin with settings.edit permission)
router.put('/features', adminAuth, checkPermission('settings.edit'), async (req, res) => {
  try {
    const {
      enableAnalysis,
      enableSubscriptions,
      enableCustomRoles,
      enableActivityLogs
    } = req.body;

    const settings = await AdminSettings.getSettings();

    if (enableAnalysis !== undefined) settings.features.enableAnalysis = enableAnalysis;
    if (enableSubscriptions !== undefined) settings.features.enableSubscriptions = enableSubscriptions;
    if (enableCustomRoles !== undefined) settings.features.enableCustomRoles = enableCustomRoles;
    if (enableActivityLogs !== undefined) settings.features.enableActivityLogs = enableActivityLogs;

    settings.lastUpdatedBy = req.userId;
    await settings.save();

    // Log activity
    await ActivityLog.logActivity({
      userId: req.userId,
      userName: req.user.name,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'settings_updated',
      actionType: 'update',
      targetModel: 'Settings',
      description: 'Updated feature flags',
      metadata: req.body,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success'
    });

    res.json({
      success: true,
      message: 'Feature flags updated successfully'
    });

  } catch (error) {
    console.error('Update feature flags error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating feature flags'
    });
  }
});

module.exports = router;

// @route   GET /api/v1/admin/settings/theme
// @desc    Get theme/branding settings
// @access  Private (Admin with settings.view permission)
router.get('/theme', adminAuth, checkPermission('settings.view'), async (req, res) => {
  try {
    const settings = await AdminSettings.getSettings();

    res.json({
      success: true,
      themeSettings: settings.themeSettings
    });

  } catch (error) {
    console.error('Get theme settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching theme settings'
    });
  }
});

// @route   PUT /api/v1/admin/settings/theme
// @desc    Update theme/branding settings
// @access  Private (Admin with settings.edit permission)
router.put('/theme', adminAuth, checkPermission('settings.edit'), async (req, res) => {
  try {
    const {
      appName,
      appTagline,
      appDescription,
      logoUrl,
      logoSmallUrl,
      faviconUrl,
      primaryService,
      secondaryService,
      targetPlatform,
      toolType,
      welcomeTitle,
      welcomeMessage,
      emailVerificationMessage,
      primaryColor,
      secondaryColor,
      accentColor
    } = req.body;

    const settings = await AdminSettings.getSettings();

    // Update theme settings
    if (appName !== undefined) settings.themeSettings.appName = appName;
    if (appTagline !== undefined) settings.themeSettings.appTagline = appTagline;
    if (appDescription !== undefined) settings.themeSettings.appDescription = appDescription;
    if (logoUrl !== undefined) settings.themeSettings.logoUrl = logoUrl;
    if (logoSmallUrl !== undefined) settings.themeSettings.logoSmallUrl = logoSmallUrl;
    if (faviconUrl !== undefined) settings.themeSettings.faviconUrl = faviconUrl;
    if (primaryService !== undefined) settings.themeSettings.primaryService = primaryService;
    if (secondaryService !== undefined) settings.themeSettings.secondaryService = secondaryService;
    if (targetPlatform !== undefined) settings.themeSettings.targetPlatform = targetPlatform;
    if (toolType !== undefined) settings.themeSettings.toolType = toolType;
    if (welcomeTitle !== undefined) settings.themeSettings.welcomeTitle = welcomeTitle;
    if (welcomeMessage !== undefined) settings.themeSettings.welcomeMessage = welcomeMessage;
    if (emailVerificationMessage !== undefined) settings.themeSettings.emailVerificationMessage = emailVerificationMessage;
    if (primaryColor !== undefined) settings.themeSettings.primaryColor = primaryColor;
    if (secondaryColor !== undefined) settings.themeSettings.secondaryColor = secondaryColor;
    if (accentColor !== undefined) settings.themeSettings.accentColor = accentColor;

    await settings.save();

    // Log activity
    await ActivityLog.logActivity({
      userId: req.userId,
      action: 'settings_updated',
      actionType: 'update',
      targetModel: 'AdminSettings',
      targetId: settings._id,
      description: 'Theme/branding settings updated',
      metadata: { updatedFields: Object.keys(req.body) },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      status: 'success'
    });

    res.json({
      success: true,
      message: 'Theme settings updated successfully',
      themeSettings: settings.themeSettings
    });

  } catch (error) {
    console.error('Update theme settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating theme settings'
    });
  }
});
