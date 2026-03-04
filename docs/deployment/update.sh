#!/bin/bash

# ══════════════════════════════════════════════════════════════════════
# SELLSERA — UPDATE / REDEPLOY SCRIPT
# ══════════════════════════════════════════════════════════════════════
# Use this script to update your live application after the initial deployment
# 
# Usage:
#   chmod +x update.sh
#   ./update.sh [backend|marketing|customer|admin|all]
#
# Examples:
#   ./update.sh all           # Update everything
#   ./update.sh backend       # Update backend only
#   ./update.sh marketing     # Update marketing frontend only
# ══════════════════════════════════════════════════════════════════════

set -e  # Exit on any error

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

print_header() {
    echo -e "\n${BLUE}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}\n"
}

print_step() {
    echo -e "${GREEN}▶ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✘ ERROR: $1${NC}"
    exit 1
}

# Configuration
APP_DIR="/home/ubuntu/apps/sellsera"
COMPONENT="${1:-all}"

# Check if app directory exists
if [ ! -d "$APP_DIR" ]; then
    print_error "Application directory not found: $APP_DIR"
fi

cd "$APP_DIR"

# ══════════════════════════════════════════════════════════════════════
# FUNCTION: Update Backend
# ══════════════════════════════════════════════════════════════════════
update_backend() {
    print_header "Updating Backend"
    
    cd "$APP_DIR/backend"
    
    print_step "Installing dependencies..."
    npm install --production
    
    print_step "Restarting backend with systemd..."
    sudo systemctl restart sellsera-backend
    
    print_step "Checking backend health..."
    sleep 3
    
    if curl -s -f http://localhost:3001/health > /dev/null; then
        echo -e "${GREEN}✓ Backend is healthy${NC}"
    else
        print_warning "Backend health check failed. Check logs: sudo journalctl -u sellsera-backend -n 50"
    fi
    
    echo ""
}

# ══════════════════════════════════════════════════════════════════════
# FUNCTION: Update Marketing Frontend
# ══════════════════════════════════════════════════════════════════════
update_marketing() {
    print_header "Updating Marketing Frontend"
    
    cd "$APP_DIR/frontend-marketing"
    
    print_step "Installing dependencies..."
    npm install
    
    print_step "Building production bundle..."
    npm run build
    
    print_step "Clearing old build cache..."
    # Often helps with cache issues
    
    echo -e "${GREEN}✓ Marketing frontend updated${NC}\n"
}

# ══════════════════════════════════════════════════════════════════════
# FUNCTION: Update Customer Center
# ══════════════════════════════════════════════════════════════════════
update_customer() {
    print_header "Updating Customer Center"
    
    cd "$APP_DIR/frontend-customer-center"
    
    print_step "Installing dependencies..."
    npm install
    
    print_step "Building production bundle..."
    npm run build
    
    echo -e "${GREEN}✓ Customer Center updated${NC}\n"
}

# ══════════════════════════════════════════════════════════════════════
# FUNCTION: Update Admin Center
# ══════════════════════════════════════════════════════════════════════
update_admin() {
    print_header "Updating Admin Center"
    
    cd "$APP_DIR/frontend-admin-center"
    
    print_step "Installing dependencies..."
    npm install
    
    print_step "Building production bundle..."
    npm run build
    
    echo -e "${GREEN}✓ Admin Center updated${NC}\n"
}

# ══════════════════════════════════════════════════════════════════════
# MAIN EXECUTION
# ══════════════════════════════════════════════════════════════════════

print_header "SELLSERA UPDATE SCRIPT"
echo "Component: $COMPONENT"
echo "App Directory: $APP_DIR"
echo ""

case "$COMPONENT" in
    backend)
        update_backend
        ;;
    marketing)
        update_marketing
        ;;
    customer)
        update_customer
        ;;
    admin)
        update_admin
        ;;
    all)
        update_backend
        update_marketing
        update_customer
        update_admin
        
        print_header "🎉 ALL COMPONENTS UPDATED"
        echo ""
        print_step "Reloading Nginx..."
        sudo nginx -t && sudo systemctl reload nginx
        echo ""
        ;;
    *)
        print_error "Invalid component. Use: backend, marketing, customer, admin, or all"
        ;;
esac

print_header "✓ UPDATE COMPLETE"

echo ""
echo "Next Steps:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. Test your changes:"
echo "   - Marketing:  https://sellsera.com"
echo "   - Customer:   https://seller.sellsera.com"
echo "   - Admin:      https://me.sellsera.com"
echo "   - API:        https://api.sellsera.com/health"
echo ""
echo "2. Monitor backend logs:"
echo "   sudo journalctl -u sellsera-backend -f"
echo ""
echo "3. Check system status:"
echo "   ./system-info.sh"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
