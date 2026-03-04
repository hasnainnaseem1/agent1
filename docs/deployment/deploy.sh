#!/bin/bash

# ══════════════════════════════════════════════════════════════════════
# SELLSERA — UBUNTU 24.04 LTS AUTOMATED DEPLOYMENT SCRIPT
# ══════════════════════════════════════════════════════════════════════
# This script automates the deployment process on a fresh Ubuntu 24.04 instance
# Run as ubuntu user (not root)
#
# Usage:
#   chmod +x deploy.sh
#   ./deploy.sh
# ══════════════════════════════════════════════════════════════════════

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
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

print_success() {
    echo -e "${GREEN}✓ $1${NC}\n"
}

# Check if running as root (should NOT be root)
if [ "$EUID" -eq 0 ]; then 
    print_error "Do not run this script as root. Run as ubuntu user."
fi

# ══════════════════════════════════════════════════════════════════════
# STEP 1: System Update
# ══════════════════════════════════════════════════════════════════════
print_header "STEP 1: Updating System"

print_step "Updating package lists..."
sudo apt update

print_step "Upgrading packages..."
sudo DEBIAN_FRONTEND=noninteractive apt upgrade -y

print_step "Installing essential tools..."
sudo apt install -y curl wget git build-essential software-properties-common \
    gcc g++ make python3 python3-pip unzip htop vim

print_success "System updated successfully"

# ══════════════════════════════════════════════════════════════════════
# STEP 2: Install MongoDB 7.0
# ══════════════════════════════════════════════════════════════════════
print_header "STEP 2: Installing MongoDB 7.0"

if command -v mongod &> /dev/null; then
    print_warning "MongoDB is already installed. Skipping..."
else
    print_step "Adding MongoDB GPG key..."
    curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
        sudo gpg --dearmor -o /usr/share/keyrings/mongodb-archive-keyring.gpg

    print_step "Adding MongoDB repository..."
    echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-archive-keyring.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | \
        sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

    print_step "Installing MongoDB 7.0.6..."
    sudo apt update
    sudo apt install -y mongodb-org=7.0.6 mongodb-org-database=7.0.6 \
        mongodb-org-server=7.0.6 mongodb-org-mongos=7.0.6 mongodb-org-tools=7.0.6

    print_step "Pinning MongoDB version..."
    echo "mongodb-org hold" | sudo dpkg --set-selections
    echo "mongodb-org-database hold" | sudo dpkg --set-selections
    echo "mongodb-org-server hold" | sudo dpkg --set-selections
    echo "mongodb-org-mongos hold" | sudo dpkg --set-selections
    echo "mongodb-org-tools hold" | sudo dpkg --set-selections

    print_step "Configuring MongoDB for low memory (t3.small)..."
    sudo tee /etc/mongod.conf > /dev/null <<'EOF'
# mongod.conf — Optimized for t3.small (2GB RAM)

storage:
  dbPath: /var/lib/mongodb
  journal:
    enabled: true
  wiredTiger:
    engineConfig:
      cacheSizeGB: 0.5

systemLog:
  destination: file
  logAppend: true
  path: /var/log/mongodb/mongod.log

net:
  port: 27017
  bindIp: 127.0.0.1

processManagement:
  timeZoneInfo: /usr/share/zoneinfo

security:
  authorization: enabled
EOF

    print_step "Starting MongoDB..."
    sudo systemctl start mongod
    sudo systemctl enable mongod

    print_success "MongoDB 7.0.6 installed and configured"
    
    print_warning "IMPORTANT: You need to create MongoDB users manually:"
    echo "1. Run: mongosh"
    echo "2. Create admin user and app user (see DEPLOYMENT_GUIDE.md Section 3.3)"
fi

# ══════════════════════════════════════════════════════════════════════
# STEP 3: Install Node.js 20.x LTS
# ══════════════════════════════════════════════════════════════════════
print_header "STEP 3: Installing Node.js 20.x LTS"

if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_warning "Node.js is already installed: $NODE_VERSION"
    
    if [[ ! "$NODE_VERSION" =~ ^v20\. ]]; then
        print_warning "Installed version is not 20.x. Consider upgrading."
    fi
else
    print_step "Adding NodeSource repository..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

    print_step "Installing Node.js..."
    sudo apt install -y nodejs

    NODE_VERSION=$(node --version)
    NPM_VERSION=$(npm --version)
    
    print_success "Node.js $NODE_VERSION and npm $NPM_VERSION installed"
fi

# ══════════════════════════════════════════════════════════════════════
# STEP 4: Verify Systemd (Built-in Process Manager)
# ══════════════════════════════════════════════════════════════════════
print_header "STEP 4: Verifying Systemd"

print_step "Checking systemd status..."
if systemctl --version &> /dev/null; then
    SYSTEMD_VERSION=$(systemctl --version | head -n 1)
    print_success "Systemd available: $SYSTEMD_VERSION"
else
    print_error "Systemd not found. Ubuntu 24.04 should have systemd by default."
fi

# ══════════════════════════════════════════════════════════════════════
# STEP 5: Install Nginx
# ══════════════════════════════════════════════════════════════════════
print_header "STEP 5: Installing Nginx"

if command -v nginx &> /dev/null; then
    print_warning "Nginx is already installed: $(nginx -v 2>&1)"
else
    print_step "Installing Nginx..."
    sudo apt install -y nginx

    print_step "Removing default site..."
    sudo rm -f /etc/nginx/sites-enabled/default

    print_step "Starting Nginx..."
    sudo systemctl start nginx
    sudo systemctl enable nginx

    print_success "Nginx installed: $(nginx -v 2>&1)"
fi

# ══════════════════════════════════════════════════════════════════════
# STEP 6: Install Certbot (Let's Encrypt)
# ══════════════════════════════════════════════════════════════════════
print_header "STEP 6: Installing Certbot (SSL)"

if command -v certbot &> /dev/null; then
    print_warning "Certbot is already installed: $(certbot --version)"
else
    print_step "Installing Certbot..."
    sudo apt install -y certbot python3-certbot-nginx

    print_success "Certbot installed: $(certbot --version)"
fi

# ══════════════════════════════════════════════════════════════════════
# STEP 7: Configure UFW Firewall
# ══════════════════════════════════════════════════════════════════════
print_header "STEP 7: Configuring UFW Firewall"

if sudo ufw status | grep -q "Status: active"; then
    print_warning "UFW is already active"
else
    print_step "Configuring UFW rules..."
    sudo ufw --force enable
    sudo ufw allow 22/tcp comment 'SSH'
    sudo ufw allow 80/tcp comment 'HTTP'
    sudo ufw allow 443/tcp comment 'HTTPS'
    sudo ufw deny 27017/tcp comment 'Block external MongoDB'

    print_success "UFW firewall configured"
fi

sudo ufw status verbose

# ══════════════════════════════════════════════════════════════════════
# STEP 8: Install Fail2Ban
# ══════════════════════════════════════════════════════════════════════
print_header "STEP 8: Installing Fail2Ban"

if command -v fail2ban-client &> /dev/null; then
    print_warning "Fail2Ban is already installed"
else
    print_step "Installing Fail2Ban..."
    sudo apt install -y fail2ban
    sudo systemctl enable fail2ban
    sudo systemctl start fail2ban

    print_success "Fail2Ban installed and running"
fi

# ══════════════════════════════════════════════════════════════════════
# STEP 9: Create Application Directory Structure
# ══════════════════════════════════════════════════════════════════════
print_header "STEP 9: Creating Application Directory"

APP_DIR="/home/ubuntu/apps/sellsera"

if [ -d "$APP_DIR" ]; then
    print_warning "Application directory already exists: $APP_DIR"
else
    print_step "Creating directory structure..."
    mkdir -p /home/ubuntu/apps
    mkdir -p /home/ubuntu/backups
    
    print_success "Directory structure created"
    echo "Application directory: $APP_DIR"
    echo "Backup directory: /home/ubuntu/backups"
fi

# ══════════════════════════════════════════════════════════════════════
# STEP 10: Set Up Swap Space (Important for t3.small)
# ══════════════════════════════════════════════════════════════════════
print_header "STEP 10: Setting Up Swap Space"

if swapon --show | grep -q '/swapfile'; then
    print_warning "Swap is already configured"
else
    print_step "Creating 2GB swap file..."
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    
    print_step "Making swap permanent..."
    if ! grep -q '/swapfile' /etc/fstab; then
        echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    fi

    print_success "2GB swap space configured"
fi

free -h

# ══════════════════════════════════════════════════════════════════════
# STEP 11: Generate Random Secrets
# ══════════════════════════════════════════════════════════════════════
print_header "STEP 11: Generating Random Secrets"

print_step "Generating JWT and session secrets..."

JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_REFRESH_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
SESSION_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

echo ""
echo "Save these secrets for your .env file:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "JWT_SECRET=$JWT_SECRET"
echo "JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET"
echo "SESSION_SECRET=$SESSION_SECRET"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Save to a file
cat > /home/ubuntu/secrets.txt <<EOF
# Generated Secrets — $(date)
# IMPORTANT: Copy these to your backend/.env file and DELETE this file after

JWT_SECRET=$JWT_SECRET
JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET
SESSION_SECRET=$SESSION_SECRET
EOF

print_success "Secrets saved to /home/ubuntu/secrets.txt"

# ══════════════════════════════════════════════════════════════════════
# STEP 12: Create Helper Scripts
# ══════════════════════════════════════════════════════════════════════
print_header "STEP 12: Creating Helper Scripts"

# Database backup script
cat > /home/ubuntu/backup-mongodb.sh <<'EOF'
#!/bin/bash
BACKUP_DIR="/home/ubuntu/backups"
DATE=$(date +"%Y%m%d_%H%M%S")
FILENAME="sellsera_backup_$DATE"

mkdir -p $BACKUP_DIR

# Update with your actual MongoDB credentials
MONGO_USER="sellseraApp"
MONGO_PASS="YOUR_PASSWORD_HERE"
MONGO_DB="sellsera_production"

mongodump --uri="mongodb://$MONGO_USER:$MONGO_PASS@127.0.0.1:27017/$MONGO_DB?authSource=$MONGO_DB" --out="$BACKUP_DIR/$FILENAME"

tar -czf "$BACKUP_DIR/$FILENAME.tar.gz" -C "$BACKUP_DIR" "$FILENAME"
rm -rf "$BACKUP_DIR/$FILENAME"

# Keep only last 7 days
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $FILENAME.tar.gz"
EOF

chmod +x /home/ubuntu/backup-mongodb.sh
print_success "Created: /home/ubuntu/backup-mongodb.sh"

# Health check script
cat > /home/ubuntu/health-check.sh <<'EOF'
#!/bin/bash
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/health)

if [ "$RESPONSE" -eq 200 ]; then
  echo "$(date): Backend healthy"
else
  echo "$(date): Backend down! Restarting..." | tee -a /home/ubuntu/health-check.log
  sudo systemctl restart sellsera-backend
fi
EOF

chmod +x /home/ubuntu/health-check.sh
print_success "Created: /home/ubuntu/health-check.sh"

# System info script
cat > /home/ubuntu/system-info.sh <<'EOF'
#!/bin/bash
echo "════════════════════════════════════════════════════════════"
echo "  SELLSERA SYSTEM STATUS"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "▶ System Resources:"
echo "─────────────────────────────────────────────────────────────"
free -h
echo ""
df -h | grep -E 'Filesystem|/$'
echo ""

echo "▶ Backend Service (systemd):"
echo "─────────────────────────────────────────────────────────────"
sudo systemctl status sellsera-backend --no-pager -l | head -10
echo ""

echo "▶ Nginx Status:"
echo "─────────────────────────────────────────────────────────────"
sudo systemctl status nginx --no-pager -l | head -10
echo ""

echo "▶ MongoDB Status:"
echo "─────────────────────────────────────────────────────────────"
sudo systemctl status mongod --no-pager -l | head -10
echo ""

echo "▶ Listening Ports:"
echo "─────────────────────────────────────────────────────────────"
sudo netstat -tuln | grep LISTEN
echo ""

echo "▶ SSL Certificates:"
echo "─────────────────────────────────────────────────────────────"
sudo certbot certificates 2>&1 | grep -E 'Certificate Name|Domains|Expiry Date' || echo "No certificates found"
echo ""

echo "════════════════════════════════════════════════════════════"
EOF

chmod +x /home/ubuntu/system-info.sh
print_success "Created: /home/ubuntu/system-info.sh"

# ══════════════════════════════════════════════════════════════════════
# DEPLOYMENT COMPLETE
# ══════════════════════════════════════════════════════════════════════

print_header "🎉 DEPLOYMENT SCRIPT COMPLETE"

echo ""
echo "Next Steps:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Upload your application code to: $APP_DIR"
echo "   Example: scp -r local-folder ubuntu@server:$APP_DIR"
echo ""
echo "2. Set up MongoDB users (see DEPLOYMENT_GUIDE.md Section 3.3)"
echo "   Run: mongosh"
echo ""
echo "3. Create backend/.env file with your secrets:"
echo "   - Copy from /home/ubuntu/secrets.txt"
echo "   - Add MongoDB credentials"
echo "   - Add Stripe/LemonSqueezy keys"
echo "   - Add SMTP credentials"
echo ""
echo "4. Install backend dependencies:"
echo "   cd $APP_DIR/backend"
echo "   npm install --production"
echo ""
echo "5. Build all frontends:"
echo "   cd $APP_DIR/frontend-marketing && npm install && npm run build"
echo "   cd $APP_DIR/frontend-customer-center && npm install && npm run build"
echo "   cd $APP_DIR/frontend-admin-center && npm install && npm run build"
echo ""
echo "6. Configure Nginx (see DEPLOYMENT_GUIDE.md Section 8)"
echo "   sudo nano /etc/nginx/sites-available/sellsera"
echo "   sudo ln -s /etc/nginx/sites-available/sellsera /etc/nginx/sites-enabled/"
echo "   sudo nginx -t && sudo systemctl reload nginx"
echo ""
echo "7. Set up DNS records for your domains (A records)"
echo ""
echo "8. Start backend with systemd:"
echo "   sudo cp $APP_DIR/backend/sellsera-backend.service /etc/systemd/system/"
echo "   sudo systemctl daemon-reload"
echo "   sudo systemctl enable sellsera-backend"
echo "   sudo systemctl start sellsera-backend"
echo "   sudo systemctl status sellsera-backend"
echo ""
echo "9. Obtain SSL certificates:"
echo "   sudo certbot --nginx -d sellsera.com -d www.sellsera.com \\"
echo "     -d seller.sellsera.com -d me.sellsera.com -d api.sellsera.com"
echo ""
echo "10. Import database:"
echo "    mongorestore --uri='mongodb://USER:PASS@localhost/sellsera_production?authSource=sellsera_production' backup-folder/"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Helper Scripts Created:"
echo "  • /home/ubuntu/backup-mongodb.sh   — Database backup"
echo "  • /home/ubuntu/health-check.sh     — Backend health monitoring"
echo "  • /home/ubuntu/system-info.sh      — System status overview"
echo ""
echo "Full deployment guide: DEPLOYMENT_GUIDE.md"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
