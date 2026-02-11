#!/bin/bash

echo "🔄 Starting Complete Backend Renaming..."
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
# STEP 3: UPDATE .ENV
# ==========================================
echo ""
echo "🔧 Step 3: Updating .env files..."

cat > .env << 'EOF'
PORT=3001
NODE_ENV=development

# MongoDB connection (with authentication)
MONGODB_URI=mongodb://admin:password123@localhost:27017/etsy-seo-optimizer?authSource=admin

# JWT Secret - Change this!
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

# API Keys (add later when testing)
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

# JWT Secret - Generate a strong secret!
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

# ==========================================
# STEP 4: UPDATE PACKAGE.JSON
# ==========================================
echo ""
echo "📦 Step 4: Updating package.json..."

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
# STEP 5: UPDATE CODE FILES
# ==========================================
echo ""
echo "💻 Step 5: Updating code files..."

# Function to safely update a file
update_file() {
    local file="$1"
    if [ -f "$file" ]; then
        # Create temp file
        local temp_file="${file}.tmp"
        
        # Apply replacements
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
        
        # Replace original with temp
        mv "$temp_file" "$file"
        echo "    ✅ Updated: $(basename $file)"
    fi
}

# Update all route files
echo ""
echo "  📂 Updating route files..."
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

# Update core files
echo ""
echo "  📂 Updating core files..."
update_file "src/server.js"
update_file "src/app.js"

# Update models
echo ""
echo "  📂 Updating models..."
update_file "src/models/user/User.js"
update_file "src/models/user/CustomRole.js"
update_file "src/models/admin/AdminSettings.js"
update_file "src/models/admin/ActivityLog.js"
update_file "src/models/notification/Notification.js"

# Update middleware
echo ""
echo "  📂 Updating middleware..."
update_file "src/middleware/auth/auth.js"
update_file "src/middleware/auth/adminAuth.js"

# Update scripts
echo ""
echo "  📂 Updating scripts..."
update_file "src/scripts/migration/migrateExistingCustomers.js"
update_file "src/scripts/seed/seedSuperAdmin.js"

# ==========================================
# STEP 6: FIX DATABASE ENUM VALUES
# ==========================================
echo ""
echo "🗄️  Step 6: Reverting database enum values (for backward compatibility)..."

# In User.js, revert enum values back to 'seller' for DB compatibility
if [ -f "src/models/user/User.js" ]; then
    sed -i "s/enum: \['customer', 'admin'\]/enum: ['seller', 'admin'] \/\/ 'seller' = customer in app/" "src/models/user/User.js"
    sed -i "s/enum: \['customer', 'super_admin'/enum: ['seller', 'super_admin' \/\/ 'seller' = customer/" "src/models/user/User.js"
    sed -i "s/default: 'customer'/default: 'seller' \/\/ DB value/" "src/models/user/User.js"
    echo "  ✅ Fixed User.js enum values for DB compatibility"
fi

# In ActivityLog.js, keep action enum values as 'seller_*'
if [ -f "src/models/admin/ActivityLog.js" ]; then
    sed -i "s/'customer_created'/'seller_created' \/\/ customer in app/" "src/models/admin/ActivityLog.js"
    sed -i "s/'customer_updated'/'seller_updated' \/\/ customer in app/" "src/models/admin/ActivityLog.js"
    sed -i "s/'customer_deleted'/'seller_deleted' \/\/ customer in app/" "src/models/admin/ActivityLog.js"
    sed -i "s/'customer_suspended'/'seller_suspended' \/\/ customer in app/" "src/models/admin/ActivityLog.js"
    sed -i "s/'customer_activated'/'seller_activated' \/\/ customer in app/" "src/models/admin/ActivityLog.js"
    sed -i "s/'customer_plan_changed'/'seller_plan_changed' \/\/ customer in app/" "src/models/admin/ActivityLog.js"
    sed -i "s/'customer_verified'/'seller_verified' \/\/ customer in app/" "src/models/admin/ActivityLog.js"
    echo "  ✅ Fixed ActivityLog.js action enum values for DB compatibility"
fi

# ==========================================
# COMPLETE
# ==========================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ RENAMING COMPLETE!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Summary:"
echo "  ✅ Renamed 3 directories"
echo "  ✅ Renamed 3 files"
echo "  ✅ Updated .env and .env.example"
echo "  ✅ Updated package.json"
echo "  ✅ Updated ~20+ code files"
echo "  ✅ Fixed database enum values for compatibility"
echo ""
echo "🔧 What Changed:"
echo "  • seller → customer (everywhere in code/comments)"
echo "  • /seller/ → /customer/ (all route URLs)"
echo "  • Database enums kept as 'seller' (backward compatible)"
echo "  • APP_NAME added to .env (dynamic app name)"
echo ""
echo "⚠️  IMPORTANT:"
echo "  • Database values still use 'seller' (no migration needed)"
echo "  • Frontend needs to update API URLs to /customer/"
echo "  • Test all endpoints before deploying"
echo ""
echo "🚀 Next Steps:"
echo "  1. cd backend"
echo "  2. npm install"
echo "  3. npm run dev"
echo "  4. Test endpoints"
echo ""
