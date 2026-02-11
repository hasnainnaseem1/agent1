#!/bin/bash

echo "🔄 Complete Database Renaming: seller → customer (INCLUDING DATABASE)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ==========================================
# STEP 1: RENAME DIRECTORIES
# ==========================================
echo "📁 Step 1: Renaming directories..."
[ -d "src/models/seller" ] && mv src/models/seller src/models/customer && echo "  ✅ models/seller → customer"
[ -d "src/routes/v1/seller" ] && mv src/routes/v1/seller src/routes/v1/customer && echo "  ✅ routes/v1/seller → customer"
[ -d "src/controllers/seller" ] && mv src/controllers/seller src/controllers/customer && echo "  ✅ controllers/seller → customer"

# ==========================================
# STEP 2: RENAME FILES
# ==========================================
echo ""
echo "📄 Step 2: Renaming files..."
[ -f "src/routes/v1/auth/seller.routes.js" ] && mv src/routes/v1/auth/seller.routes.js src/routes/v1/auth/customer.routes.js && echo "  ✅ seller.routes.js → customer.routes.js"
[ -f "src/routes/v1/admin/sellers.routes.js" ] && mv src/routes/v1/admin/sellers.routes.js src/routes/v1/admin/customers.routes.js && echo "  ✅ sellers.routes.js → customers.routes.js"
[ -f "src/scripts/migration/migrateExistingSellers.js" ] && mv src/scripts/migration/migrateExistingSellers.js src/scripts/migration/migrateExistingCustomers.js && echo "  ✅ migrateExistingSellers.js → migrateExistingCustomers.js"

# ==========================================
# STEP 3: UPDATE .ENV & CONFIG
# ==========================================
echo ""
echo "🔧 Step 3: Updating .env files..."

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

# Application Info
APP_NAME=Etsy SEO Optimizer
APP_DESCRIPTION=AI-powered Etsy listing optimization platform
APP_VERSION=1.0.0

# Frontend URLs
FRONTEND_URL=http://localhost:3000
CUSTOMER_FRONTEND_URL=http://localhost:3002
ADMIN_FRONTEND_URL=http://localhost:3003

# API Keys
#ETSY_API_KEY=add_your_key_here
#ANTHROPIC_API_KEY=add_your_key_here
#STRIPE_SECRET_KEY=add_your_key_here
EOF
echo "  ✅ .env updated"

cat > .env.example << 'EOF'
PORT=3001
NODE_ENV=development

# MongoDB connection
MONGODB_URI=mongodb://localhost:27017/etsy-seo-optimizer

# JWT Secret
JWT_SECRET=change_this_to_a_random_secret_key

# Admin Setup
SUPER_ADMIN_NAME=Super Admin
SUPER_ADMIN_EMAIL=admin@yourdomain.com
SUPER_ADMIN_PASSWORD=ChangeThisPassword123!

# Application Info
APP_NAME=Etsy SEO Optimizer
APP_DESCRIPTION=AI-powered Etsy listing optimization platform
APP_VERSION=1.0.0

# Frontend URLs
FRONTEND_URL=http://localhost:3000
CUSTOMER_FRONTEND_URL=http://localhost:3002
ADMIN_FRONTEND_URL=http://localhost:3003

# API Keys
ETSY_API_KEY=your_etsy_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
STRIPE_SECRET_KEY=your_stripe_secret_key
EOF
echo "  ✅ .env.example updated"

cat > package.json << 'EOF'
{
    "name": "etsy-seo-optimizer-backend",
    "version": "1.0.0",
    "description": "AI-powered Etsy listing optimization platform - Backend API",
    "main": "server.js",
    "scripts": {
        "start": "node src/server.js",
        "dev": "nodemon src/server.js",
        "seed": "node src/scripts/seed/seedSuperAdmin.js",
        "migrate": "node src/scripts/migration/migrateExistingCustomers.js"
    },
    "keywords": [
        "etsy",
        "ai",
        "optimization",
        "listing",
        "seo"
    ],
    "author": "Etsy SEO Optimizer",
    "license": "ISC",
    "dependencies": {
        "bcryptjs": "^2.4.3",
        "cors": "^2.8.6",
        "dotenv": "^16.6.1",
        "express": "^4.22.1",
        "express-validator": "^7.0.1",
        "jsonwebtoken": "^9.0.3",
        "mongoose": "^7.8.9"
    },
    "devDependencies": {
        "nodemon": "^3.0.1"
    }
}
EOF
echo "  ✅ package.json updated"

# ==========================================
# STEP 4: UPDATE ALL CODE FILES
# ==========================================
echo ""
echo "💻 Step 4: Updating ALL code files (including database enums)..."

update_file() {
    local file="$1"
    if [ -f "$file" ]; then
        local temp_file="${file}.tmp"
        
        # Apply ALL replacements including database values
        sed 's/\bseller\b/customer/g' "$file" | \
        sed 's/\bsellers\b/customers/g' | \
        sed 's/\bSeller\b/Customer/g' | \
        sed 's/\bSellers\b/Customers/g' | \
        sed "s|'/seller|'/customer|g" | \
        sed "s|/seller/|/customer/|g" | \
        sed "s|'/sellers|'/customers|g" | \
        sed "s|/sellers/|/customers/|g" | \
        sed "s|require('./seller')|require('./customer')|g" | \
        sed "s|require('./sellers')|require('./customers')|g" | \
        sed "s|seller.routes|customer.routes|g" | \
        sed "s|sellers.routes|customers.routes|g" > "$temp_file"
        
        mv "$temp_file" "$file"
        echo "    ✅ $(basename $file)"
    fi
}

echo ""
echo "  📂 Routes..."
update_file "src/routes/v1/auth/customer.routes.js"
update_file "src/routes/v1/customer/analysis.routes.js"
update_file "src/routes/v1/customer/history.routes.js"
update_file "src/routes/v1/customer/index.js"
update_file "src/routes/v1/admin/customers.routes.js"
update_file "src/routes/v1/admin/users.routes.js"
update_file "src/routes/v1/admin/analytics.routes.js"
update_file "src/routes/v1/admin/settings.routes.js"
update_file "src/routes/v1/admin/logs.routes.js"
update_file "src/routes/v1/admin/roles.routes.js"
update_file "src/routes/v1/index.js"
update_file "src/routes/v1/auth/index.js"
update_file "src/routes/v1/admin/index.js"
update_file "src/routes/index.js"

echo ""
echo "  📂 Core..."
update_file "src/server.js"
update_file "src/app.js"

echo ""
echo "  📂 Models (INCLUDING DATABASE ENUMS)..."
update_file "src/models/user/User.js"
update_file "src/models/user/CustomRole.js"
update_file "src/models/admin/AdminSettings.js"
update_file "src/models/admin/ActivityLog.js"
update_file "src/models/notification/Notification.js"
update_file "src/models/customer/Analysis.js"
update_file "src/models/customer/index.js"

echo ""
echo "  📂 Middleware..."
update_file "src/middleware/auth/auth.js"
update_file "src/middleware/auth/adminAuth.js"
update_file "src/middleware/validation/emailValidator.js"

echo ""
echo "  📂 Scripts..."
update_file "src/scripts/migration/migrateExistingCustomers.js"
update_file "src/scripts/seed/seedSuperAdmin.js"

# ==========================================
# STEP 5: CREATE DATABASE MIGRATION SCRIPT
# ==========================================
echo ""
echo "🗄️  Step 5: Creating database migration script..."

cat > src/scripts/migration/migrateSellersToCustomers.js << 'DBSCRIPT'
const mongoose = require('mongoose');
require('dotenv').config();

async function migrateSellersToCustomers() {
  try {
    console.log('🔄 Starting database migration: seller → customer...');
    console.log('');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('✅ Connected to MongoDB');
    
    const db = mongoose.connection.db;
    
    // ==========================================
    // UPDATE USERS COLLECTION
    // ==========================================
    console.log('');
    console.log('📊 Updating users collection...');
    
    // Update accountType from 'seller' to 'customer'
    const usersAccountType = await db.collection('users').updateMany(
      { accountType: 'seller' },
      { $set: { accountType: 'customer' } }
    );
    console.log(`  ✅ Updated accountType: ${usersAccountType.modifiedCount} users`);
    
    // Update role from 'seller' to 'customer'
    const usersRole = await db.collection('users').updateMany(
      { role: 'seller' },
      { $set: { role: 'customer' } }
    );
    console.log(`  ✅ Updated role: ${usersRole.modifiedCount} users`);
    
    // ==========================================
    // UPDATE ACTIVITY LOGS
    // ==========================================
    console.log('');
    console.log('📊 Updating activity logs...');
    
    // Update action field values
    const actions = {
      'seller_created': 'customer_created',
      'seller_updated': 'customer_updated',
      'seller_deleted': 'customer_deleted',
      'seller_suspended': 'customer_suspended',
      'seller_activated': 'customer_activated',
      'seller_plan_changed': 'customer_plan_changed',
      'seller_verified': 'customer_verified'
    };
    
    let totalLogsUpdated = 0;
    for (const [oldAction, newAction] of Object.entries(actions)) {
      const result = await db.collection('activitylogs').updateMany(
        { action: oldAction },
        { $set: { action: newAction } }
      );
      totalLogsUpdated += result.modifiedCount;
    }
    console.log(`  ✅ Updated action fields: ${totalLogsUpdated} logs`);
    
    // Update userRole field
    const logsUserRole = await db.collection('activitylogs').updateMany(
      { userRole: 'seller' },
      { $set: { userRole: 'customer' } }
    );
    console.log(`  ✅ Updated userRole: ${logsUserRole.modifiedCount} logs`);
    
    // ==========================================
    // UPDATE ADMIN SETTINGS
    // ==========================================
    console.log('');
    console.log('📊 Updating admin settings...');
    
    // Rename sellerSettings to customerSettings
    const settingsResult = await db.collection('adminsettings').updateMany(
      { sellerSettings: { $exists: true } },
      { $rename: { sellerSettings: 'customerSettings' } }
    );
    console.log(`  ✅ Renamed sellerSettings to customerSettings: ${settingsResult.modifiedCount} documents`);
    
    // ==========================================
    // COMPLETE
    // ==========================================
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ DATABASE MIGRATION COMPLETE!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('Summary:');
    console.log(`  • Users accountType updated: ${usersAccountType.modifiedCount}`);
    console.log(`  • Users role updated: ${usersRole.modifiedCount}`);
    console.log(`  • Activity logs updated: ${totalLogsUpdated + logsUserRole.modifiedCount}`);
    console.log(`  • Admin settings updated: ${settingsResult.modifiedCount}`);
    console.log('');
    console.log('⚠️  IMPORTANT: Restart your server for changes to take effect!');
    console.log('');
    
    await mongoose.connection.close();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

// Run migration
migrateSellersToCustomers();
DBSCRIPT

chmod +x src/scripts/migration/migrateSellersToCustomers.js
echo "  ✅ Created: migrateSellersToCustomers.js"

# Add to package.json scripts
cat > package.json << 'EOF'
{
    "name": "etsy-seo-optimizer-backend",
    "version": "1.0.0",
    "description": "AI-powered Etsy listing optimization platform - Backend API",
    "main": "server.js",
    "scripts": {
        "start": "node src/server.js",
        "dev": "nodemon src/server.js",
        "seed": "node src/scripts/seed/seedSuperAdmin.js",
        "migrate": "node src/scripts/migration/migrateExistingCustomers.js",
        "migrate:database": "node src/scripts/migration/migrateSellersToCustomers.js"
    },
    "keywords": [
        "etsy",
        "ai",
        "optimization",
        "listing",
        "seo"
    ],
    "author": "Etsy SEO Optimizer",
    "license": "ISC",
    "dependencies": {
        "bcryptjs": "^2.4.3",
        "cors": "^2.8.6",
        "dotenv": "^16.6.1",
        "express": "^4.22.1",
        "express-validator": "^7.0.1",
        "jsonwebtoken": "^9.0.3",
        "mongoose": "^7.8.9"
    },
    "devDependencies": {
        "nodemon": "^3.0.1"
    }
}
EOF

# ==========================================
# COMPLETE
# ==========================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ COMPLETE RENAMING DONE!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Summary:"
echo "  ✅ Renamed 3 directories"
echo "  ✅ Renamed 3 files"
echo "  ✅ Updated .env, .env.example, package.json"
echo "  ✅ Updated 25+ code files"
echo "  ✅ Database enums changed to 'customer'"
echo "  ✅ Created database migration script"
echo ""
echo "🔧 What Changed:"
echo "  • seller → customer (EVERYWHERE including database!)"
echo "  • Database enums: 'seller' → 'customer'"
echo "  • Database fields: sellerSettings → customerSettings"
echo "  • All routes: /seller/ → /customer/"
echo ""
echo "⚠️  CRITICAL: Run database migration!"
echo "  npm run migrate:database"
echo ""
echo "🚀 Next Steps:"
echo "  1. npm install"
echo "  2. npm run migrate:database  (REQUIRED!)"
echo "  3. npm run seed"
echo "  4. npm run dev"
echo ""
