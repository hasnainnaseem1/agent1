# Sellsera — Ubuntu 24.04 LTS Deployment Guide (t3.small EC2)

**Last Updated:** March 4, 2026  
**Target Server:** AWS EC2 t3.small (2 vCPU, 2GB RAM)  
**OS:** Ubuntu 24.04 LTS  
**Architecture:** All-in-one deployment (Marketing + Customer Center + Admin Center + Backend API + MongoDB)

---

## Table of Contents

1. [Prerequisites & Server Setup](#1-prerequisites--server-setup)
2. [Install System Dependencies](#2-install-system-dependencies)
3. [Install & Configure MongoDB](#3-install--configure-mongodb)
4. [Install Node.js](#4-install-nodejs)
5. [Deploy Application Code](#5-deploy-application-code)
6. [Build All Frontends](#6-build-all-frontends)
7. [Configure Environment Variables](#7-configure-environment-variables)
8. [Install & Configure Nginx](#8-install--configure-nginx)
9. [Configure Backend Systemd Service](#9-configure-backend-systemd-service)
10. [SSL Certificate Setup (Let's Encrypt)](#10-ssl-certificate-setup-lets-encrypt)
11. [Migrate Local Database to EC2](#11-migrate-local-database-to-ec2)
12. [Security & Firewall Setup](#12-security--firewall-setup)
13. [Monitoring & Health Checks](#13-monitoring--health-checks)
14. [Deployment Checklist](#14-deployment-checklist)
15. [Troubleshooting](#15-troubleshooting)

---

## 1. Prerequisites & Server Setup

### 1.1 Launch EC2 Instance

- **Instance Type:** t3.small (2 vCPU, 2GB RAM, 20GB EBS storage minimum recommended)
- **OS:** Ubuntu 24.04 LTS
- **Security Group Rules:**
  - SSH (22) — Your IP only
  - HTTP (80) — 0.0.0.0/0
  - HTTPS (443) — 0.0.0.0/0
  - MongoDB (27017) — **INTERNAL ONLY** (do NOT expose publicly)

### 1.2 Connect to EC2

```bash
ssh -i your-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
```

### 1.3 Update System

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git build-essential software-properties-common
```

---

## 2. Install System Dependencies

### 2.1 Install Essential Build Tools

```bash
sudo apt install -y gcc g++ make python3 python3-pip
```

---

## 3. Install & Configure MongoDB

### 3.1 Install MongoDB 7.0 (Latest Stable)

```bash
# Import MongoDB GPG key
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg --dearmor -o /usr/share/keyrings/mongodb-archive-keyring.gpg

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-archive-keyring.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Update and install
sudo apt update
sudo apt install -y mongodb-org=7.0.6 mongodb-org-database=7.0.6 mongodb-org-server=7.0.6 mongodb-org-mongos=7.0.6 mongodb-org-tools=7.0.6

# Pin version to prevent accidental upgrades
echo "mongodb-org hold" | sudo dpkg --set-selections
echo "mongodb-org-database hold" | sudo dpkg --set-selections
echo "mongodb-org-server hold" | sudo dpkg --set-selections
echo "mongodb-org-mongos hold" | sudo dpkg --set-selections
echo "mongodb-org-tools hold" | sudo dpkg --set-selections
```

### 3.2 Configure MongoDB for Low Memory (Important for t3.small)

```bash
sudo nano /etc/mongod.conf
```

**Edit the file:**

```yaml
# mongod.conf — Optimized for t3.small (2GB RAM)

storage:
  dbPath: /var/lib/mongodb
  journal:
    enabled: true
  wiredTiger:
    engineConfig:
      cacheSizeGB: 0.5  # Limit cache to 512MB (default would be ~1GB)

systemLog:
  destination: file
  logAppend: true
  path: /var/log/mongodb/mongod.log

net:
  port: 27017
  bindIp: 127.0.0.1  # IMPORTANT: Only allow localhost connections

processManagement:
  timeZoneInfo: /usr/share/zoneinfo

security:
  authorization: enabled  # Enable authentication
```

### 3.3 Start MongoDB & Create Admin User

```bash
# Start MongoDB (without auth first)
sudo systemctl start mongod
sudo systemctl enable mongod

# Verify MongoDB is running
sudo systemctl status mongod

# Create admin user
mongosh
```

**Inside mongosh:**

```javascript
use admin

db.createUser({
  user: "adminUser",
  pwd: "YOUR_STRONG_ADMIN_PASSWORD_HERE",  // CHANGE THIS
  roles: [
    { role: "userAdminAnyDatabase", db: "admin" },
    { role: "readWriteAnyDatabase", db: "admin" },
    { role: "dbAdminAnyDatabase", db: "admin" }
  ]
})

exit
```

```bash
# Restart MongoDB with auth enabled
sudo systemctl restart mongod

# Test authentication
mongosh -u adminUser -p YOUR_STRONG_ADMIN_PASSWORD_HERE --authenticationDatabase admin
```

**Inside mongosh (authenticated):**

```javascript
use sellsera_production

db.createUser({
  user: "sellseraApp",
  pwd: "YOUR_APP_DB_PASSWORD_HERE",  // CHANGE THIS
  roles: [
    { role: "readWrite", db: "sellsera_production" }
  ]
})

exit
```

---

## 4. Install Node.js

### 4.1 Install Node.js 20.x LTS (via NodeSource)

```bash
# Add NodeSource repository for Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Install Node.js
sudo apt install -y nodejs

# Verify versions
node --version   # Should output: v20.11.1 or similar
npm --version    # Should output: v10.x.x or similar
```

**Note:** We'll use systemd (built into Ubuntu 24.04) for process management instead of PM2.

---

## 5. Deploy Application Code

### 5.1 Create Application Directory

```bash
mkdir -p /home/ubuntu/apps
cd /home/ubuntu/apps
```

### 5.2 Upload Code (Choose One Method)

**Method A: Git Clone (Recommended)**

```bash
git clone https://github.com/YOUR_USERNAME/sellsera.git
cd sellsera
```

**Method B: SCP from Local Machine**

```bash
# From your local machine (Windows PowerShell):
scp -i your-key.pem -r "c:\Users\Hasnain Naseem\Documents\agent1" ubuntu@YOUR_EC2_IP:/home/ubuntu/apps/sellsera
```

**Method C: Zip Upload**

```bash
# Local machine: Create zip
# PowerShell:
Compress-Archive -Path "c:\Users\Hasnain Naseem\Documents\agent1\*" -DestinationPath sellsera.zip

# Upload
scp -i your-key.pem sellsera.zip ubuntu@YOUR_EC2_IP:/home/ubuntu/apps/

# EC2: Unzip
cd /home/ubuntu/apps
unzip sellsera.zip
mv agent1 sellsera
cd sellsera
```

### 5.3 Install Backend Dependencies

```bash
cd /home/ubuntu/apps/sellsera/backend
npm install --production
```

---

## 6. Build All Frontends

### 6.1 Build Marketing Frontend

```bash
cd /home/ubuntu/apps/sellsera/frontend-marketing
npm install
npm run build

# Verify build output
ls -lh build/
```

### 6.2 Build Customer Center

```bash
cd /home/ubuntu/apps/sellsera/frontend-customer-center
npm install
npm run build

ls -lh build/
```

### 6.3 Build Admin Center

```bash
cd /home/ubuntu/apps/sellsera/frontend-admin-center
npm install
npm run build

ls -lh build/
```

**Expected Build Output Locations:**
- Marketing: `/home/ubuntu/apps/sellsera/frontend-marketing/build/`
- Customer: `/home/ubuntu/apps/sellsera/frontend-customer-center/build/`
- Admin: `/home/ubuntu/apps/sellsera/frontend-admin-center/build/`

---

## 7. Configure Environment Variables

### 7.1 Create Backend `.env` File

```bash
cd /home/ubuntu/apps/sellsera/backend
nano .env
```

**Paste and customize:**

```env
# ═════════════════════════════════════════════════════════════
# SELLSERA BACKEND — PRODUCTION ENVIRONMENT
# ═════════════════════════════════════════════════════════════

NODE_ENV=production
PORT=3001

# ─────────────────────────────────────────────────────────────
# DATABASE
# ─────────────────────────────────────────────────────────────
MONGODB_URI=mongodb://sellseraApp:YOUR_APP_DB_PASSWORD_HERE@127.0.0.1:27017/sellsera_production?authSource=sellsera_production

# ─────────────────────────────────────────────────────────────
# JWT SECRETS (CHANGE THESE TO RANDOM STRINGS)
# ─────────────────────────────────────────────────────────────
JWT_SECRET=CHANGE_THIS_TO_RANDOM_64_CHAR_STRING
JWT_REFRESH_SECRET=CHANGE_THIS_TO_ANOTHER_RANDOM_64_CHAR_STRING
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# ─────────────────────────────────────────────────────────────
# FRONTEND URLS
# ─────────────────────────────────────────────────────────────
ADMIN_CENTER_URL=https://me.sellsera.com
CUSTOMER_CENTER_URL=https://seller.sellsera.com
MARKETING_URL=https://sellsera.com

# CORS
CORS_ORIGIN=https://sellsera.com,https://www.sellsera.com,https://seller.sellsera.com,https://me.sellsera.com

# ─────────────────────────────────────────────────────────────
# STRIPE (Payment Gateway)
# ─────────────────────────────────────────────────────────────
STRIPE_SECRET_KEY=sk_live_YOUR_STRIPE_SECRET_KEY
STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_STRIPE_WEBHOOK_SECRET

# ─────────────────────────────────────────────────────────────
# LEMON SQUEEZY (Alternative Payment Gateway)
# ─────────────────────────────────────────────────────────────
LEMONSQUEEZY_API_KEY=YOUR_LEMONSQUEEZY_API_KEY
LEMONSQUEEZY_STORE_ID=YOUR_STORE_ID
LEMONSQUEEZY_WEBHOOK_SECRET=YOUR_WEBHOOK_SECRET

# ─────────────────────────────────────────────────────────────
# EMAIL (SMTP Configuration — Use your provider)
# ─────────────────────────────────────────────────────────────
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=YOUR_SENDGRID_API_KEY
EMAIL_FROM=noreply@sellsera.com
EMAIL_FROM_NAME=Sellsera

# Alternative: AWS SES
# SMTP_HOST=email-smtp.us-east-1.amazonaws.com
# SMTP_PORT=587
# SMTP_USER=YOUR_AWS_SES_SMTP_USERNAME
# SMTP_PASS=YOUR_AWS_SES_SMTP_PASSWORD

# ─────────────────────────────────────────────────────────────
# FILE UPLOADS
# ─────────────────────────────────────────────────────────────
UPLOAD_DIR=/home/ubuntu/apps/sellsera/backend/uploads
MAX_FILE_SIZE=10485760

# ─────────────────────────────────────────────────────────────
# SECURITY
# ─────────────────────────────────────────────────────────────
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
BCRYPT_ROUNDS=12

# ─────────────────────────────────────────────────────────────
# LOGGING
# ─────────────────────────────────────────────────────────────
LOG_LEVEL=info
LOG_FILE=/home/ubuntu/apps/sellsera/backend/logs/app.log

# ─────────────────────────────────────────────────────────────
# SESSION
# ─────────────────────────────────────────────────────────────
SESSION_SECRET=CHANGE_THIS_TO_RANDOM_64_CHAR_STRING
SESSION_MAX_AGE=86400000
```

**Generate Random Secrets:**

```bash
# Generate 3 random secrets
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('SESSION_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and replace in `.env`.

---

## 8. Install & Configure Nginx

### 8.1 Install Nginx

```bash
sudo apt install -y nginx

# Verify installation
nginx -v   # Should output: nginx version: nginx/1.24.x
```

### 8.2 Remove Default Site

```bash
sudo rm /etc/nginx/sites-enabled/default
```

### 8.3 Create Sellsera Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/sellsera
```

**Paste this configuration:**

```nginx
# ══════════════════════════════════════════════════════════════════════
# SELLSERA — NGINX REVERSE PROXY CONFIGURATION
# ══════════════════════════════════════════════════════════════════════
# Handles:
#   • Marketing Frontend      → sellsera.com + www.sellsera.com
#   • Customer Center         → seller.sellsera.com
#   • Admin Center            → me.sellsera.com
#   • Backend API             → api.sellsera.com
# ══════════════════════════════════════════════════════════════════════

# ──────────────────────────────────────────────────────────────────────
# Upstream: Backend API (Node.js on port 3001)
# ──────────────────────────────────────────────────────────────────────
upstream backend_api {
    server 127.0.0.1:3001;
    keepalive 64;
}

# ──────────────────────────────────────────────────────────────────────
# 1. MARKETING SITE — sellsera.com + www.sellsera.com
# ──────────────────────────────────────────────────────────────────────
server {
    listen 80;
    listen [::]:80;
    server_name sellsera.com www.sellsera.com;

    # Root directory for Marketing build
    root /home/ubuntu/apps/sellsera/frontend-marketing/build;
    index index.html;

    # Enable gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;
    gzip_min_length 1000;
    gzip_comp_level 6;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Browser caching for static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Serve static files
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Error pages
    error_page 404 /index.html;
}

# ──────────────────────────────────────────────────────────────────────
# 2. CUSTOMER CENTER — seller.sellsera.com
# ──────────────────────────────────────────────────────────────────────
server {
    listen 80;
    listen [::]:80;
    server_name seller.sellsera.com;

    root /home/ubuntu/apps/sellsera/frontend-customer-center/build;
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;
    gzip_min_length 1000;
    gzip_comp_level 6;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location / {
        try_files $uri $uri/ /index.html;
    }

    error_page 404 /index.html;
}

# ──────────────────────────────────────────────────────────────────────
# 3. ADMIN CENTER — me.sellsera.com
# ──────────────────────────────────────────────────────────────────────
server {
    listen 80;
    listen [::]:80;
    server_name me.sellsera.com;

    root /home/ubuntu/apps/sellsera/frontend-admin-center/build;
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;
    gzip_min_length 1000;
    gzip_comp_level 6;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location / {
        try_files $uri $uri/ /index.html;
    }

    error_page 404 /index.html;
}

# ──────────────────────────────────────────────────────────────────────
# 4. BACKEND API — api.sellsera.com
# ──────────────────────────────────────────────────────────────────────
server {
    listen 80;
    listen [::]:80;
    server_name api.sellsera.com;

    # Client max body size (for file uploads)
    client_max_body_size 10M;

    # Timeouts
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;

    # Proxy headers
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Connection "";
    proxy_http_version 1.1;

    # Proxy all requests to backend
    location / {
        proxy_pass http://backend_api;
    }

    # WebSocket support (if needed in future)
    location /ws {
        proxy_pass http://backend_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://backend_api/health;
        access_log off;
    }
}
```

**IMPORTANT:** Replace all instances of `yourdomain.com` with your actual domain.

### 8.4 Enable Site & Test Configuration

```bash
# Create symlink to enable site
sudo ln -s /etc/nginx/sites-available/sellsera /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# If test passes, reload Nginx
sudo systemctl reload nginx

# Enable Nginx to start on boot
sudo systemctl enable nginx
```

### 8.5 Configure DNS (Before SSL)

**In your DNS provider (Route 53, Cloudflare, Namecheap, etc.):**

Create A records pointing to your EC2 public IP:

```
Type    Name        Value (Points to)       TTL
──────────────────────────────────────────────────
A       @           YOUR_EC2_PUBLIC_IP      300
A       www         YOUR_EC2_PUBLIC_IP      300
A       seller      YOUR_EC2_PUBLIC_IP      300
A       me          YOUR_EC2_PUBLIC_IP      300
A       api         YOUR_EC2_PUBLIC_IP      300
```

Wait 5-10 minutes for DNS propagation. Verify:

```bash
nslookup www.sellsera.com
nslookup seller.sellsera.com
nslookup me.sellsera.com
nslookup api.sellsera.com
```

---

## 9. Configure Backend Systemd Service

### 9.1 Install Systemd Service File

The systemd service file should already be in your repository at `backend/sellsera-backend.service`. Install it:

```bash
# Copy service file to systemd directory
sudo cp /home/ubuntu/apps/sellsera/backend/sellsera-backend.service /etc/systemd/system/

# Reload systemd to recognize the new service
sudo systemctl daemon-reload

# Enable service to start on boot
sudo systemctl enable sellsera-backend

# Start the service
sudo systemctl start sellsera-backend

# Check status
sudo systemctl status sellsera-backend
```

### 9.2 Create Logs Directory

```bash
mkdir -p /home/ubuntu/apps/sellsera/backend/logs
```

### 9.3 Manage Backend Service

```bash
# View logs (follow mode)
sudo journalctl -u sellsera-backend -f

# View last 50 lines of logs
sudo journalctl -u sellsera-backend -n 50

# Restart service
sudo systemctl restart sellsera-backend

# Stop service
sudo systemctl stop sellsera-backend

# Check service status
sudo systemctl status sellsera-backend
```

### 9.4 Test Backend

```bash
# Check if backend is responding
curl http://localhost:3001/health
curl http://localhost:3001/api/v1/public/site

# Check from public API domain (after DNS propagates)
curl http://api.sellsera.com/health
```

---

## 10. SSL Certificate Setup (Let's Encrypt)

### 10.1 Install Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 10.2 Obtain SSL Certificates

```bash
# Obtain certificates for all subdomains in one command
sudo certbot --nginx -d sellsera.com -d www.sellsera.com -d seller.sellsera.com -d me.sellsera.com -d api.sellsera.com

# Follow prompts:
# 1. Enter email address
# 2. Agree to terms
# 3. Choose: Redirect HTTP to HTTPS (option 2)
```

Certbot will automatically:
- Obtain certificates from Let's Encrypt
- Update your Nginx configuration to use SSL
- Set up auto-renewal

### 10.3 Verify SSL Auto-Renewal

```bash
# Test renewal (dry run)
sudo certbot renew --dry-run

# Check renewal timer
sudo systemctl status certbot.timer
```

SSL certificates will auto-renew every 60 days.

### 10.4 Test HTTPS

```bash
curl https://www.sellsera.com
curl https://seller.sellsera.com
curl https://me.sellsera.com
curl https://api.sellsera.com/health
```

---

## 11. Migrate Local Database to EC2

### 11.1 Export Local Database (Windows)

**On your local machine (PowerShell):**

```powershell
# Export entire database
mongodump --uri="mongodb://localhost:27017/sellsera_dev" --out="C:\Users\Hasnain Naseem\Documents\mongodb-backup"

# ZIP the backup
Compress-Archive -Path "C:\Users\Hasnain Naseem\Documents\mongodb-backup\*" -DestinationPath "C:\Users\Hasnain Naseem\Documents\mongodb-backup.zip"

# Upload to EC2
scp -i your-key.pem "C:\Users\Hasnain Naseem\Documents\mongodb-backup.zip" ubuntu@YOUR_EC2_IP:/home/ubuntu/
```

### 11.2 Import Database on EC2

```bash
# On EC2: Unzip backup
cd /home/ubuntu
unzip mongodb-backup.zip -d mongodb-backup

# Import to production database
mongorestore --uri="mongodb://sellseraApp:YOUR_APP_DB_PASSWORD_HERE@127.0.0.1:27017/sellsera_production?authSource=sellsera_production" --drop mongodb-backup/sellsera_dev

# Verify import
mongosh -u sellseraApp -p YOUR_APP_DB_PASSWORD_HERE --authenticationDatabase sellsera_production sellsera_production

# Inside mongosh:
show collections
db.users.countDocuments()
db.marketingpages.countDocuments()
exit
```

### 11.3 Run Seed Scripts (If Database is Empty)

```bash
cd /home/ubuntu/apps/sellsera/backend

# Seed marketing pages
node src/scripts/seed/seedMarketingPages.js

# Seed other data (if you have seed scripts)
# node src/scripts/seed/seedPlans.js
# node src/scripts/seed/seedAdminUser.js
```

---

## 12. Security & Firewall Setup

### 12.1 Configure UFW (Ubuntu Firewall)

```bash
# Enable UFW
sudo ufw --force enable

# Allow SSH (CRITICAL: Do this first!)
sudo ufw allow 22/tcp

# Allow HTTP & HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Deny MongoDB external access (only allow localhost)
sudo ufw deny 27017/tcp

# Check status
sudo ufw status verbose
```

### 12.2 Secure MongoDB

```bash
# Verify MongoDB only listens on localhost
sudo netstat -tuln | grep 27017

# Should output: 127.0.0.1:27017 (NOT 0.0.0.0:27017)
```

### 12.3 Secure SSH

```bash
sudo nano /etc/ssh/sshd_config
```

**Update these lines:**

```
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
```

```bash
# Restart SSH
sudo systemctl restart sshd
```

### 12.4 Set Up Fail2Ban (Brute Force Protection)

```bash
sudo apt install -y fail2ban

# Enable and start
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Check status
sudo fail2ban-client status
```

---

## 13. Monitoring & Health Checks

### 13.1 Monitor Backend Service

```bash
# Follow backend logs in real-time
sudo journalctl -u sellsera-backend -f

# View last 50 lines of logs
sudo journalctl -u sellsera-backend -n 50

# Check service status
sudo systemctl status sellsera-backend

# Press Ctrl+C to exit
```

### 13.2 Set Up Log Rotation

```bash
sudo nano /etc/logrotate.d/sellsera
```

**Paste:**

```
/home/ubuntu/apps/sellsera/backend/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 ubuntu ubuntu
    sharedscripts
}
```

### 13.3 Monitor Disk Space

```bash
# Check disk usage
df -h

# Check MongoDB data size
du -sh /var/lib/mongodb
```

### 13.4 Monitor Memory

```bash
# Real-time memory usage
free -h

# Top processes
htop  # Install with: sudo apt install htop
```

### 13.5 Backend Health Endpoint

Create a simple health check script:

```bash
nano /home/ubuntu/health-check.sh
```

**Paste:**

```bash
#!/bin/bash
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/health)

if [ "$RESPONSE" -eq 200 ]; then
  echo "$(date): Backend healthy"
else
  echo "$(date): Backend down! Restarting..." | tee -a /home/ubuntu/health-check.log
  sudo systemctl restart sellsera-backend
fi
```

```bash
chmod +x /home/ubuntu/health-check.sh

# Add to crontab (runs every 5 minutes)
crontab -e

# Add this line:
*/5 * * * * /home/ubuntu/health-check.sh >> /home/ubuntu/health-check.log 2>&1
```

---

## 14. Deployment Checklist

### Pre-Deployment

- [ ] EC2 instance launched (t3.small, Ubuntu 24.04 LTS)
- [ ] Security group configured (ports 22, 80, 443 open)
- [ ] Domain DNS records created (A records for www, app, admin, api)
- [ ] `.env` file configured with production values
- [ ] JWT secrets generated (random 64-char strings)
- [ ] Payment gateway keys added (Stripe/LemonSqueezy)
- [ ] SMTP credentials configured (SendGrid/AWS SES)

### Installation

- [ ] System updated (`apt update && apt upgrade`)
- [ ] MongoDB 7.0.6 installed and configured
- [ ] MongoDB admin user created
- [ ] MongoDB app user created (`sellseraApp`)
- [ ] Node.js 20.x installed
- [ ] Application code uploaded to `/home/ubuntu/apps/sellsera`
- [ ] Backend dependencies installed (`npm install --production`)
- [ ] All 3 frontends built (`npm run build`)
- [ ] Nginx installed and configured

### Configuration

- [ ] Nginx configuration file created (`/etc/nginx/sites-available/sellsera`)
- [ ] Nginx symlink created (`/etc/nginx/sites-enabled/sellsera`)
- [ ] Nginx configuration tested (`nginx -t`)
- [ ] Systemd service file installed (`/etc/systemd/system/sellsera-backend.service`)
- [ ] Backend systemd service enabled (`systemctl enable sellsera-backend`)
- [ ] Backend service started (`systemctl start sellsera-backend`)
- [ ] SSL certificates obtained (Certbot)
- [ ] HTTPS redirect enabled

### Database

- [ ] Local database exported
- [ ] Database uploaded to EC2
- [ ] Database imported to production MongoDB
- [ ] Seed scripts run (marketing pages, plans, etc.)
- [ ] Database connection tested

### Security

- [ ] UFW firewall enabled
- [ ] MongoDB bound to 127.0.0.1 only
- [ ] SSH key-only authentication enabled
- [ ] Fail2Ban installed
- [ ] Log rotation configured

### Testing

- [ ] All 4 domains resolve correctly (DNS)
- [ ] HTTPS works on all domains
- [ ] Marketing site loads (`https://www.sellsera.com`)
- [ ] Customer Center loads (`https://seller.sellsera.com`)
- [ ] Admin Center loads (`https://me.sellsera.com`)
- [ ] API responds (`https://api.sellsera.com/health`)
- [ ] Backend logs show no errors (`sudo journalctl -u sellsera-backend -n 50`)

### Post-Deployment

- [ ] Systemd service verified to auto-start on boot
- [ ] Health check cron job configured
- [ ] Server rebooted and all services auto-start
- [ ] Monitoring set up (systemd status, disk space alerts)

---

## 15. Troubleshooting

### Issue: Nginx 502 Bad Gateway

**Cause:** Backend not running or wrong port.

**Fix:**

```bash
# Check backend status
sudo systemctl status sellsera-backend
sudo journalctl -u sellsera-backend -n 50

# Restart backend
sudo systemctl restart sellsera-backend

# Check if port 3001 is listening
sudo netstat -tuln | grep 3001
```

---

### Issue: Frontend shows "Cannot connect to API"

**Cause:** CORS or wrong API URL in frontend.

**Fix:**

1. Check `.env` file has correct `CORS_ORIGIN`
2. Verify API domain is accessible: `curl https://api.sellsera.com/health`
3. Check browser console for CORS errors
4. Restart backend after `.env` changes: `sudo systemctl restart sellsera-backend`

---

### Issue: MongoDB connection error

**Cause:** Wrong credentials or MongoDB not running.

**Fix:**

```bash
# Check MongoDB status
sudo systemctl status mongod

# Restart MongoDB
sudo systemctl restart mongod

# Test connection
mongosh -u sellseraApp -p YOUR_PASSWORD --authenticationDatabase sellsera_production sellsera_production

# Check backend logs
sudo journalctl -u sellsera-backend -n 100
```

---

### Issue: SSL certificate not renewing

**Fix:**

```bash
# Check renewal status
sudo certbot certificates

# Manually renew
sudo certbot renew

# Check timer
sudo systemctl status certbot.timer
```

---

### Issue: High memory usage / Server crashes

**Cause:** t3.small has limited RAM (2GB).

**Fix:**

```bash
# Check memory
free -h

# Check top processes
htop

# Restart backend service
sudo systemctl restart sellsera-backend
sudo systemctl restart mongod

# Optimize MongoDB cache (already done in mongod.conf)
# Consider adding swap space:
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

### Issue: Static files (CSS/JS) not loading

**Cause:** Wrong build path or Nginx misconfiguration.

**Fix:**

```bash
# Verify build directories exist
ls -lh /home/ubuntu/apps/sellsera/frontend-marketing/build/
ls -lh /home/ubuntu/apps/sellsera/frontend-customer-center/build/
ls -lh /home/ubuntu/apps/sellsera/frontend-admin-center/build/

# Check Nginx error log
sudo tail -f /var/log/nginx/error.log

# Rebuild frontend if needed
cd /home/ubuntu/apps/sellsera/frontend-marketing
npm run build

# Reload Nginx
sudo systemctl reload nginx
```

---

### Useful Commands Reference

```bash
# ────────────────────────────────────────────────────────────
# Systemd Backend Service Commands
# ────────────────────────────────────────────────────────────
sudo systemctl status sellsera-backend          # Check service status
sudo systemctl start sellsera-backend           # Start service
sudo systemctl stop sellsera-backend            # Stop service
sudo systemctl restart sellsera-backend         # Restart service
sudo systemctl enable sellsera-backend          # Enable auto-start on boot
sudo systemctl disable sellsera-backend         # Disable auto-start

# ────────────────────────────────────────────────────────────
# Backend Logs (journalctl)
# ────────────────────────────────────────────────────────────
sudo journalctl -u sellsera-backend -f          # Follow logs (real-time)
sudo journalctl -u sellsera-backend -n 50       # View last 50 lines
sudo journalctl -u sellsera-backend -n 100      # View last 100 lines
sudo journalctl -u sellsera-backend --since "1 hour ago"  # Logs from last hour
sudo journalctl -u sellsera-backend --since "2024-03-01"  # Logs since date
sudo journalctl --vacuum-time=1d                # Clear logs older than 1 day

# ────────────────────────────────────────────────────────────
# Nginx Commands
# ────────────────────────────────────────────────────────────
sudo nginx -t                       # Test configuration
sudo systemctl reload nginx         # Reload (graceful)
sudo systemctl restart nginx        # Full restart
sudo systemctl status nginx         # Check status
sudo tail -f /var/log/nginx/access.log   # Access logs
sudo tail -f /var/log/nginx/error.log    # Error logs

# ────────────────────────────────────────────────────────────
# MongoDB Commands
# ────────────────────────────────────────────────────────────
sudo systemctl status mongod        # Check status
sudo systemctl restart mongod       # Restart
sudo tail -f /var/log/mongodb/mongod.log   # View logs
mongosh -u USER -p PASS --authenticationDatabase DB   # Connect
du -sh /var/lib/mongodb             # Check DB size

# ────────────────────────────────────────────────────────────
# System Monitoring
# ────────────────────────────────────────────────────────────
htop                                # Interactive process viewer
free -h                             # Memory usage
df -h                               # Disk usage
du -sh /home/ubuntu/apps/sellsera   # App directory size
sudo netstat -tuln | grep LISTEN    # Check listening ports
journalctl -u mongod -f             # MongoDB system logs
```

---

## Additional Recommendations

### 1. Set Up Automated Backups

```bash
# Create backup script
nano /home/ubuntu/backup-mongodb.sh
```

**Paste:**

```bash
#!/bin/bash
BACKUP_DIR="/home/ubuntu/backups"
DATE=$(date +"%Y%m%d_%H%M%S")
FILENAME="sellsera_backup_$DATE"

mkdir -p $BACKUP_DIR

mongodump --uri="mongodb://sellseraApp:YOUR_PASSWORD@127.0.0.1:27017/sellsera_production?authSource=sellsera_production" --out="$BACKUP_DIR/$FILENAME"

# Compress backup
tar -czf "$BACKUP_DIR/$FILENAME.tar.gz" -C "$BACKUP_DIR" "$FILENAME"
rm -rf "$BACKUP_DIR/$FILENAME"

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $FILENAME.tar.gz"
```

```bash
chmod +x /home/ubuntu/backup-mongodb.sh

# Add to crontab (daily at 2 AM)
crontab -e

# Add:
0 2 * * * /home/ubuntu/backup-mongodb.sh >> /home/ubuntu/backup.log 2>&1
```

### 2. Set Up CloudWatch Monitoring (Optional but Recommended)

Install CloudWatch agent for detailed EC2 metrics:

```bash
wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
sudo dpkg -i -E ./amazon-cloudwatch-agent.deb
```

### 3. Use Environment-Specific React Configs

Update frontend `.env` files for production API URLs:

**`frontend-marketing/.env.production`:**
```
REACT_APP_API_URL=https://api.sellsera.com
```

**`frontend-customer-center/.env.production`:**
```
REACT_APP_API_URL=https://api.sellsera.com
```

**`frontend-admin-center/.env.production`:**
```
REACT_APP_API_URL=https://api.sellsera.com
```

Rebuild frontends after creating these files.

---

## Support & Maintenance

**Regular Maintenance Tasks:**

- **Weekly:** Review backend logs (`sudo journalctl -u sellsera-backend`), check disk usage, review error logs
- **Monthly:** Review SSL certificate expiry, update packages (`apt update && apt upgrade`), review security patches
- **Quarterly:** Audit user access, review backup integrity, load test application

**Emergency Contacts:**

- MongoDB Community: https://www.mongodb.com/community/forums
- Nginx Documentation: https://nginx.org/en/docs/
- Let's Encrypt Support: https://community.letsencrypt.org/
- Systemd Documentation: https://www.freedesktop.org/software/systemd/man/

---

## Estimated Deployment Time

- **Initial Server Setup:** 30-45 minutes
- **Application Deployment:** 20-30 minutes
- **SSL & Security:** 15-20 minutes
- **Database Migration:** 10-15 minutes
- **Testing & Verification:** 20-30 minutes

**Total:** ~2-2.5 hours (first-time deployment)

---

**🎉 Your Sellsera SaaS is now live on Ubuntu 24.04 LTS!**

Access your application:
- Marketing: `https://www.sellsera.com`
- Customer Portal: `https://seller.sellsera.com`
- Admin Dashboard: `https://me.sellsera.com`
- API: `https://api.sellsera.com`
