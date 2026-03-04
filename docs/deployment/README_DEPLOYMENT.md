# Sellsera Deployment Documentation — Index

**📚 Complete Ubuntu 24.04 LTS Deployment Package**

This directory contains everything you need to deploy Sellsera on an AWS EC2 t3.small instance running Ubuntu 24.04 LTS.

---

## 📖 Documentation Files

### 1. **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** ⭐ START HERE
**The complete step-by-step deployment guide** — 15 sections covering:
- Server setup & dependency installation (MongoDB 7.0, Node.js 20.x, Nginx, systemd)
- Application deployment & configuration
- Nginx reverse proxy setup for 3 frontends + backend API
- SSL certificate setup with Let's Encrypt
- Database migration from local to production
- Security hardening (UFW, Fail2Ban, SSH)
- Monitoring, logging, and health checks
- Troubleshooting common issues

**When to use:** Your primary reference during initial deployment.

---

### 2. **[DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)** ✅ PRINT THIS
**A printable 9-phase checklist** with checkboxes for every deployment step:
- Pre-deployment preparation (AWS, DNS, credentials)
- System setup (30-45 min)
- Application deployment (20-30 min)
- Nginx & SSL configuration (15-20 min)
- Start application (10-15 min)
- Testing & verification (20-30 min)
- Post-deployment setup (15-20 min)
- Application configuration (10-15 min)
- External integrations (15-20 min)

**When to use:** Print this and check off each step as you complete it. Ensures nothing is forgotten.

---

### 3. **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** 🚀 BOOKMARK THIS
**One-page cheat sheet** with the most-used commands:
- systemd commands (logs, restart, status, monitor)
- Nginx commands (reload, test config, view logs)
- MongoDB commands (connect, backup, restore)
- System monitoring (memory, disk, processes)
- Database backup & restore
- SSL certificate management
- Security checks
- Troubleshooting quick fixes

**When to use:** Daily operations, quick command lookups, and troubleshooting.

---

### 4. **[T3_SMALL_OPTIMIZATION.md](T3_SMALL_OPTIMIZATION.md)** 🔧 IMPORTANT FOR t3.small
**Memory & performance optimization guide** for 2GB RAM:
- Understanding t3.small limitations
- Memory allocation strategy (MongoDB 512MB, Node.js 400MB)
- MongoDB optimization (cache tuning, index management)
- Node.js backend optimization (memory limits, GC tuning)
- Nginx optimization (worker tuning, buffer sizes)
- Swap space configuration
- Monitoring & alerts for low memory
- Common issues (OOM kills, slow queries, crash recovery)
- When to upgrade to larger instance

**When to use:** If experiencing memory issues, slow performance, or frequent crashes.

---

## 🛠️ Deployment Scripts

### 5. **[deploy.sh](deploy.sh)** 🤖 AUTOMATED SETUP
**Automated server setup script** that installs:
- System updates & essential tools
- MongoDB 7.0.6 with optimized config for t3.small
- Node.js 20.x LTS via NodeSource
- systemd service configuration
- Nginx web server
- Certbot (Let's Encrypt SSL)
- UFW firewall with proper rules
- Fail2Ban for SSH brute-force protection
- 2GB swap space
- Helper scripts (backup, health check, system info)

**Usage:**
```bash
scp -i your-key.pem deploy.sh ubuntu@YOUR_EC2_IP:/home/ubuntu/
ssh -i your-key.pem ubuntu@YOUR_EC2_IP
chmod +x deploy.sh
./deploy.sh
```

**Run time:** ~10-15 minutes  
**Result:** Server ready for application deployment

---

### 6. **[update.sh](update.sh)** 🔄 REDEPLOY SCRIPT
**Application update script** for pushing code changes after initial deployment.

**Usage:**
```bash
./update.sh all          # Update everything
./update.sh backend      # Backend only
./update.sh marketing    # Marketing frontend only
./update.sh customer     # Customer Center only
./update.sh admin        # Admin Center only
```

**What it does:**
- Installs dependencies
- Rebuilds frontends
- Restarts backend with systemctl
- Reloads Nginx
- Runs health checks

---

## ⚙️ Configuration Templates

### 7. **[backend/sellsera-backend.service](backend/sellsera-backend.service)** 
**systemd service configuration** for backend:
- Memory limit: 400 MB with auto-restart
- Single instance (for t3.small)
- Log rotation and error handling
- Service management configuration

---

### 8. **[backend/.env.production.template](backend/.env.production.template)**
**Production environment variables template** covering:
- Database connection (MongoDB)
- JWT secrets
- Frontend URLs & CORS
- Stripe payment gateway
- LemonSqueezy payment gateway
- Email/SMTP configuration
- File upload settings
- Security settings (rate limiting, bcrypt rounds, session)
- Logging configuration
- Feature flags
- Admin settings
- Optional services (Redis, AWS S3, Etsy API, analytics)

**Usage:**
```bash
cd /home/ubuntu/apps/sellsera/backend
cp .env.production.template .env
nano .env  # Fill in all values
```

---

## 📦 What's Already Deployed

### Application Overview

Your Sellsera SaaS consists of:

1. **Marketing Frontend** (React 18)
   - Port: Served via Nginx
   - Domain: `www.sellsera.com`
   - Purpose: Public-facing marketing site with dynamic CMS pages
   - Build: `frontend-marketing/build/`

2. **Customer Center** (React 18)
   - Port: Served via Nginx
   - Domain: `seller.sellsera.com`
   - Purpose: Customer dashboard & subscription management
   - Build: `frontend-customer-center/build/`

3. **Admin Center** (React 18)
   - Port: Served via Nginx
   - Domain: `me.sellsera.com`
   - Purpose: Admin dashboard for content, users, plans, and settings
   - Build: `frontend-admin-center/build/`

4. **Backend API** (Node.js/Express)
   - Port: 3001 (proxied via Nginx)
   - Domain: `api.sellsera.com`
   - Purpose: REST API for all frontends
   - Process Manager: systemd

5. **MongoDB 7.0** (Database)
   - Port: 27017 (localhost only, not exposed)
   - Database: `sellsera_production`
   - Auth: Username/password authentication enabled

6. **Nginx** (Reverse Proxy)
   - Handles all 4 domains
   - SSL/HTTPS via Let's Encrypt
   - Static file serving for frontends
   - API proxy with timeouts & headers

---

## 🚀 Deployment Flow

### Initial Deployment (2-2.5 hours)

```
1. Server Setup (30-45 min)
   ├─ Run deploy.sh
   ├─ Create MongoDB users
   └─ Generate JWT secrets

2. Upload Code (5-10 min)
   ├─ Git clone OR
   └─ SCP upload from local

3. Configure Backend (10 min)
   ├─ Create .env file
   └─ npm install --production

4. Build Frontends (20-30 min)
   ├─ Marketing: npm run build
   ├─ Customer: npm run build
   └─ Admin: npm run build

5. Configure Nginx (10 min)
   ├─ Create site config
   └─ Enable & reload

6. SSL Setup (10 min)
   └─ Run certbot

7. Start Backend (5 min)
   ├─ systemctl start
   └─ Health check

8. Migrate Database (10 min)
   ├─ Upload backup
   └─ mongorestore

9. Test Everything (20-30 min)
   ├─ All URLs accessible
   ├─ HTTPS working
   ├─ API responding
   └─ Login/signup working
```

---

## 📊 Resource Requirements

### Minimum (Development / Low Traffic)
- **Instance:** AWS EC2 t3.small
- **RAM:** 2 GB
- **CPU:** 2 vCPU (burstable)
- **Storage:** 20 GB EBS
- **Network:** Standard AWS networking
- **Domain:** 1 domain with 5 A records

**Estimated Cost:** ~$15-20/month  
**User Capacity:** Up to 50-100 concurrent users

### Recommended (Production)
- **Instance:** AWS EC2 t3.medium
- **RAM:** 4 GB
- **CPU:** 2 vCPU
- **Storage:** 30 GB EBS + S3 for uploads
- **Database:** MongoDB Atlas M10 ($57/mo) OR self-hosted
- **CDN:** Cloudflare (free tier)

**Estimated Cost:** ~$100-150/month  
**User Capacity:** 500-1,000 concurrent users

---

## 🔒 Security Checklist

After deployment, verify:

- [ ] SSH key-only authentication (no passwords)
- [ ] UFW firewall active with correct rules
- [ ] MongoDB bound to localhost only (127.0.0.1:27017)
- [ ] SSL certificates valid on all domains
- [ ] HTTP redirects to HTTPS
- [ ] Strong passwords for MongoDB (20+ characters)
- [ ] JWT secrets are random (64 characters)
- [ ] `.env` file not committed to version control
- [ ] Fail2Ban active and monitoring SSH
- [ ] Regular backups scheduled (daily 2 AM)

---

## 📈 Monitoring & Maintenance

### Daily
```bash
sudo journalctl -u sellsera-backend -n 50   # Check backend logs
./system-info.sh                            # System status
```

### Weekly
```bash
df -h                                   # Disk usage
free -h                                 # Memory usage
sudo tail -f /var/log/nginx/error.log  # Nginx errors
```

### Monthly
```bash
sudo apt update && sudo apt upgrade -y  # System updates
sudo certbot certificates               # SSL expiry check
cat /home/ubuntu/backup.log             # Backup status
```

---

## 🆘 Getting Help

### If something goes wrong:

1. **Check logs:**
   - Backend: `sudo journalctl -u sellsera-backend -f`
   - Nginx: `sudo tail -f /var/log/nginx/error.log`
   - MongoDB: `sudo tail -f /var/log/mongodb/mongod.log`

2. **Run diagnostics:**
   - System: `./system-info.sh`
   - Memory: `free -h`
   - Disk: `df -h`

3. **Restart services:**
   - Backend: `sudo systemctl restart sellsera-backend`
   - Nginx: `sudo systemctl restart nginx`
   - MongoDB: `sudo systemctl restart mongod`

4. **Consult troubleshooting:**
   - Generic: `DEPLOYMENT_GUIDE.md` Section 15
   - Memory issues: `T3_SMALL_OPTIMIZATION.md` Section 8
   - Quick fixes: `QUICK_REFERENCE.md`

---

## 📞 Support Resources

- **MongoDB:** https://www.mongodb.com/docs/manual/
- **Node.js:** https://nodejs.org/en/docs/
- **systemd:** https://systemd.io/
- **Nginx:** https://nginx.org/en/docs/
- **Let's Encrypt:** https://letsencrypt.org/docs/
- **Ubuntu:** https://help.ubuntu.com/

---

## ✅ Pre-Deployment Checklist

Before you begin, ensure you have:

- [ ] AWS account with EC2 access
- [ ] Domain name purchased
- [ ] Stripe account (or LemonSqueezy)
- [ ] Email service (SendGrid/AWS SES)
- [ ] SSH key pair (.pem file)
- [ ] Local database backup
- [ ] All passwords documented in password manager
- [ ] Read `DEPLOYMENT_GUIDE.md` Sections 1-3
- [ ] Printed `DEPLOYMENT_CHECKLIST.md`

---

## 🎯 Deployment Success Criteria

Your deployment is successful when:

1. ✅ All 4 URLs accessible via HTTPS:
   - https://www.sellsera.com (Marketing)
   - https://seller.sellsera.com (Customer)
   - https://me.sellsera.com (Admin)
   - https://api.sellsera.com/health (API)

2. ✅ Can sign up / log in as customer
3. ✅ Can log in to Admin Center
4. ✅ Marketing pages load from database
5. ✅ Pricing plans display correctly
6. ✅ Favicon and logo display on all sites
7. ✅ No browser console errors
8. ✅ systemctl shows backend as "active (running)"
9. ✅ MongoDB connected and queryable
10. ✅ SSL certificates valid (no warnings)

---

## 📦 Included Files Summary

```
agent1/
├─ DEPLOYMENT_GUIDE.md              ⭐ Full step-by-step guide
├─ DEPLOYMENT_CHECKLIST.md          ✅ Printable checklist
├─ QUICK_REFERENCE.md               🚀 Command cheat sheet
├─ T3_SMALL_OPTIMIZATION.md         🔧 Memory optimization
├─ README.md                        📚 This file (index)
├─ deploy.sh                        🤖 Automated setup script
├─ update.sh                        🔄 Update/redeploy script
├─ backend/
│  ├─ sellsera-backend.service      ⚙️ systemd configuration
│  └─ .env.production.template      ⚙️ Environment variables
└─ ... (application code)
```

---

## 🚀 Quick Start (TL;DR)

```bash
# 1. Upload and run automated setup
scp -i key.pem deploy.sh ubuntu@YOUR_EC2_IP:/home/ubuntu/
ssh -i key.pem ubuntu@YOUR_EC2_IP
chmod +x deploy.sh && ./deploy.sh

# 2. Create MongoDB users (manual)
mongosh
# Run user creation commands from DEPLOYMENT_GUIDE.md Section 3.3

# 3. Upload application code
scp -i key.pem -r agent1 ubuntu@YOUR_EC2_IP:/home/ubuntu/apps/sellsera

# 4. Configure backend
cd /home/ubuntu/apps/sellsera/backend
cp .env.production.template .env
nano .env  # Fill in secrets & credentials
npm install --production

# 5. Build frontends
cd ../frontend-marketing && npm install && npm run build
cd ../frontend-customer-center && npm install && npm run build
cd ../frontend-admin-center && npm install && npm run build

# 6. Configure Nginx (paste config from guide)
sudo nano /etc/nginx/sites-available/sellsera
sudo ln -s /etc/nginx/sites-available/sellsera /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# 7. Start backend
sudo systemctl start sellsera-backend
sudo systemctl enable sellsera-backend
sudo systemctl status sellsera-backend

# 8. Get SSL certificates
sudo certbot --nginx -d sellsera.com -d www.sellsera.com -d seller.sellsera.com -d me.sellsera.com -d api.sellsera.com

# Done! Test: https://www.sellsera.com
```

---

## 📝 Notes

- **Do not commit `.env` files to Git** — they contain secrets
- **Always test changes locally** before deploying to production
- **Keep MongoDB credentials secure** — store in password manager
- **Monitor memory usage** on t3.small — see T3_SMALL_OPTIMIZATION.md
- **Set up daily backups** — use the included backup script
- **Update system monthly** — `sudo apt update && apt upgrade`

---

## 🎉 Ready to Deploy?

**Start here:** [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)  
**Print this:** [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)  

Good luck! 🚀
