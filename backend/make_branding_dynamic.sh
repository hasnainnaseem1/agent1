#!/bin/bash

echo "🎨 Making ALL Branding Dynamic..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ==========================================
# STEP 1: UPDATE .ENV WITH BRANDING VARIABLES
# ==========================================
echo "📝 Step 1: Adding branding variables to .env..."

cat > .env << 'EOF'
PORT=3001
NODE_ENV=development

# MongoDB connection
MONGODB_URI=mongodb://admin:password123@localhost:27017/etsy-seo-optimizer?authSource=admin

# JWT Secret
JWT_SECRET=E8KuzIwctHG0K7iDSD2IcO305TMrllNY6Qg

# Admin Setup
SUPER_ADMIN_NAME=Super Admin
SUPER_ADMIN_EMAIL=admin@ssh.com
SUPER_ADMIN_PASSWORD=ChangeThisSecurely123!

# ==========================================
# BRANDING & CUSTOMIZATION
# ==========================================

# Application Branding
APP_NAME=My Platform
APP_TAGLINE=Your Business Optimization Platform
APP_DESCRIPTION=AI-powered business optimization platform
APP_VERSION=1.0.0

# Product/Service Keywords (for dynamic content)
PRIMARY_SERVICE=SEO
SECONDARY_SERVICE=Optimization
TARGET_PLATFORM=Etsy
TOOL_TYPE=AI Agent

# Welcome Messages
WELCOME_TITLE=Welcome to {APP_NAME}!
WELCOME_MESSAGE=Thank you for joining {APP_NAME}. Please verify your email to get started.
EMAIL_VERIFICATION_MESSAGE=Please verify your email to start using our platform.

# Email Branding
EMAIL_FROM_NAME=My Platform Team
EMAIL_SUBJECT_PREFIX=[My Platform]

# ==========================================
# FRONTEND URLs
# ==========================================
FRONTEND_URL=http://localhost:3000
CUSTOMER_FRONTEND_URL=http://localhost:3002
ADMIN_FRONTEND_URL=http://localhost:3003

# API Keys
#ETSY_API_KEY=add_your_key_here
#ANTHROPIC_API_KEY=add_your_key_here
#STRIPE_SECRET_KEY=add_your_key_here
EOF

echo "  ✅ .env updated with branding variables"

cat > .env.example << 'EOF'
PORT=3001
NODE_ENV=development

# MongoDB connection
MONGODB_URI=mongodb://localhost:27017/your-database-name

# JWT Secret
JWT_SECRET=change_this_to_a_random_secret_key

# Admin Setup
SUPER_ADMIN_NAME=Super Admin
SUPER_ADMIN_EMAIL=admin@yourdomain.com
SUPER_ADMIN_PASSWORD=ChangeThisPassword123!

# ==========================================
# BRANDING & CUSTOMIZATION
# ==========================================

# Application Branding
APP_NAME=My Platform
APP_TAGLINE=Your Business Optimization Platform
APP_DESCRIPTION=AI-powered business optimization platform
APP_VERSION=1.0.0

# Product/Service Keywords (for dynamic content)
PRIMARY_SERVICE=SEO
SECONDARY_SERVICE=Optimization
TARGET_PLATFORM=Etsy
TOOL_TYPE=AI Agent

# Welcome Messages
WELCOME_TITLE=Welcome to {APP_NAME}!
WELCOME_MESSAGE=Thank you for joining {APP_NAME}. Please verify your email to get started.
EMAIL_VERIFICATION_MESSAGE=Please verify your email to start using our platform.

# Email Branding
EMAIL_FROM_NAME=My Platform Team
EMAIL_SUBJECT_PREFIX=[My Platform]

# ==========================================
# FRONTEND URLs
# ==========================================
FRONTEND_URL=http://localhost:3000
CUSTOMER_FRONTEND_URL=http://localhost:3002
ADMIN_FRONTEND_URL=http://localhost:3003

# API Keys
ETSY_API_KEY=your_etsy_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
STRIPE_SECRET_KEY=your_stripe_secret_key
EOF

echo "  ✅ .env.example updated"

# ==========================================
# STEP 2: CREATE BRANDING HELPER UTILITY
# ==========================================
echo ""
echo "🛠️  Step 2: Creating branding utility..."

mkdir -p src/utils/helpers

cat > src/utils/helpers/brandingHelper.js << 'HELPER'
/**
 * Branding Helper
 * Replaces all hardcoded branding with dynamic values from .env
 */

const brandingConfig = {
  appName: process.env.APP_NAME || 'My Platform',
  appTagline: process.env.APP_TAGLINE || 'Your Business Optimization Platform',
  appDescription: process.env.APP_DESCRIPTION || 'AI-powered business optimization platform',
  appVersion: process.env.APP_VERSION || '1.0.0',
  
  // Service Keywords
  primaryService: process.env.PRIMARY_SERVICE || 'SEO',
  secondaryService: process.env.SECONDARY_SERVICE || 'Optimization',
  targetPlatform: process.env.TARGET_PLATFORM || 'Etsy',
  toolType: process.env.TOOL_TYPE || 'AI Agent',
  
  // Welcome Messages
  welcomeTitle: process.env.WELCOME_TITLE || 'Welcome to {APP_NAME}!',
  welcomeMessage: process.env.WELCOME_MESSAGE || 'Thank you for joining {APP_NAME}. Please verify your email to get started.',
  emailVerificationMessage: process.env.EMAIL_VERIFICATION_MESSAGE || 'Please verify your email to start using our platform.',
  
  // Email
  emailFromName: process.env.EMAIL_FROM_NAME || 'Platform Team',
  emailSubjectPrefix: process.env.EMAIL_SUBJECT_PREFIX || '[Platform]',
};

/**
 * Replace placeholders in text with actual branding values
 * @param {string} text - Text with placeholders like {APP_NAME}
 * @returns {string} - Text with replaced values
 */
const replacePlaceholders = (text) => {
  if (!text) return text;
  
  return text
    .replace(/{APP_NAME}/g, brandingConfig.appName)
    .replace(/{APP_TAGLINE}/g, brandingConfig.appTagline)
    .replace(/{PRIMARY_SERVICE}/g, brandingConfig.primaryService)
    .replace(/{SECONDARY_SERVICE}/g, brandingConfig.secondaryService)
    .replace(/{TARGET_PLATFORM}/g, brandingConfig.targetPlatform)
    .replace(/{TOOL_TYPE}/g, brandingConfig.toolType);
};

/**
 * Get welcome notification data
 */
const getWelcomeNotification = () => ({
  type: 'welcome',
  title: replacePlaceholders(brandingConfig.welcomeTitle),
  message: replacePlaceholders(brandingConfig.welcomeMessage),
  priority: 'high'
});

/**
 * Get email verification message
 */
const getEmailVerificationMessage = () => replacePlaceholders(brandingConfig.emailVerificationMessage);

/**
 * Get app info for API responses
 */
const getAppInfo = () => ({
  name: brandingConfig.appName,
  tagline: brandingConfig.appTagline,
  description: brandingConfig.appDescription,
  version: brandingConfig.appVersion
});

/**
 * Get service info
 */
const getServiceInfo = () => ({
  primaryService: brandingConfig.primaryService,
  secondaryService: brandingConfig.secondaryService,
  targetPlatform: brandingConfig.targetPlatform,
  toolType: brandingConfig.toolType
});

module.exports = {
  brandingConfig,
  replacePlaceholders,
  getWelcomeNotification,
  getEmailVerificationMessage,
  getAppInfo,
  getServiceInfo
};
HELPER

echo "  ✅ Created: src/utils/helpers/brandingHelper.js"

cat > src/utils/helpers/index.js << 'HELPERINDEX'
const { 
  brandingConfig, 
  replacePlaceholders, 
  getWelcomeNotification,
  getEmailVerificationMessage,
  getAppInfo,
  getServiceInfo
} = require('./brandingHelper');

module.exports = {
  brandingConfig,
  replacePlaceholders,
  getWelcomeNotification,
  getEmailVerificationMessage,
  getAppInfo,
  getServiceInfo
};
HELPERINDEX

echo "  ✅ Created: src/utils/helpers/index.js"

# ==========================================
# STEP 3: UPDATE AdminSettings MODEL
# ==========================================
echo ""
echo "📊 Step 3: Adding theme/branding settings to AdminSettings model..."

# The AdminSettings.js file will be updated manually with theme settings

echo "  ⚠️  Note: AdminSettings model needs manual update for theme settings"

# ==========================================
# COMPLETE
# ==========================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ BRANDING SETUP COMPLETE!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Summary:"
echo "  ✅ Added branding variables to .env"
echo "  ✅ Created brandingHelper.js utility"
echo "  ✅ Ready for dynamic branding"
echo ""
echo "🔧 Branding Variables in .env:"
echo "  • APP_NAME"
echo "  • APP_TAGLINE"
echo "  • APP_DESCRIPTION"
echo "  • PRIMARY_SERVICE (SEO, Analytics, etc.)"
echo "  • SECONDARY_SERVICE (Optimization, etc.)"
echo "  • TARGET_PLATFORM (Etsy, Shopify, etc.)"
echo "  • TOOL_TYPE (AI Agent, etc.)"
echo "  • WELCOME_TITLE"
echo "  • WELCOME_MESSAGE"
echo ""
echo "🚀 Next: Update route files to use branding helper"
echo ""
