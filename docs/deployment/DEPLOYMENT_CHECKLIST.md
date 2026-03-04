# Sellsera Deployment Checklist

**📋 Use this checklist to ensure a smooth deployment to Ubuntu 24.04 LTS**

Print this page or save it to track your progress during deployment.

---

## Pre-Deployment Preparation

### AWS / Server Setup
- [ ] EC2 instance launched (t3.small, Ubuntu 24.04 LTS)
- [ ] Key pair downloaded and saved securely (`.pem` file)
- [ ] Security group configured:
  - [ ] Port 22 (SSH) — Your IP only
  - [ ] Port 80 (HTTP) — 0.0.0.0/0
  - [ ] Port 443 (HTTPS) — 0.0.0.0/0
  - [ ] Port 27017 (MongoDB) — **NOT OPEN** (internal only)
- [ ] Elastic IP allocated and associated (optional but recommended)
- [ ] SSH connection tested: `ssh -i your-key.pem ubuntu@YOUR_EC2_IP`

### Domain & DNS
- [ ] Domain purchased (e.g., sellsera.com)
- [ ] DNS A records created pointing to EC2 IP:
  - [ ] `@` → YOUR_EC2_IP (apex domain)
  - [ ] `www` → YOUR_EC2_IP
  - [ ] `app` (seller) → YOUR_EC2_IP
  - [ ] `admin` (me) → YOUR_EC2_IP
  - [ ] `api` → YOUR_EC2_IP
- [ ] DNS propagation verified (use `nslookup www.sellsera.com`)

### Credentials & API Keys
- [ ] Stripe account created: https://dashboard.stripe.com
  - [ ] Live secret key obtained
  - [ ] Live publishable key obtained
  - [ ] Webhook signing secret configured
- [ ] Email service configured (SendGrid, AWS SES, or Gmail):
  - [ ] SMTP host, port, username, password noted
  - [ ] Sender email verified
- [ ] (Optional) Etsy API credentials obtained if using Etsy features
- [ ] MongoDB admin password chosen (strong, 20+ chars)
- [ ] MongoDB app user password chosen (strong, 20+ chars)

### Local Development
- [ ] Local database backup created:
  ```bash
  mongodump --uri="mongodb://localhost:27017/sellsera_dev" --out=./mongodb-backup
  ```
- [ ] All environment variables documented
- [ ] All 3 frontends build successfully locally:
  - [ ] Marketing: `npm run build`
  - [ ] Customer Center: `npm run build`
  - [ ] Admin Center: `npm run build`
- [ ] Backend runs without errors locally
- [ ] Application code ready to upload

---

## Phase 1: System Setup (30-45 min)

### Initial Server Configuration
- [ ] Connected to EC2: `ssh -i your-key.pem ubuntu@YOUR_EC2_IP`
- [ ] Uploaded automated script: `scp -i key.pem deploy.sh ubuntu@IP:/home/ubuntu/`
- [ ] Made script executable: `chmod +x deploy.sh`
- [ ] Ran automated setup: `./deploy.sh`
- [ ] Verified installations:
  - [ ] Node.js 20.x: `node --version`
  - [ ] MongoDB 7.0.6: `mongod --version`
  - [ ] Nginx: `nginx -v`
  - [ ] systemd: `systemctl --version`
  - [ ] Certbot: `certbot --version`

### MongoDB Configuration
- [ ] Started mongosh: `mongosh`
- [ ] Created admin user:
  ```javascript
  use admin
  db.createUser({user: "adminUser", pwd: "STRONG_PASS", roles: ["userAdminAnyDatabase", "readWriteAnyDatabase"]})
  ```
- [ ] Created app user:
  ```javascript
  use sellsera_production
  db.createUser({user: "sellseraApp", pwd: "APP_PASS", roles: [{role: "readWrite", db: "sellsera_production"}]})
  ```
- [ ] Tested authentication:
  ```bash
  mongosh -u sellseraApp -p 'APP_PASS' --authenticationDatabase sellsera_production sellsera_production
  ```
- [ ] Verified MongoDB is bound to localhost only:
  ```bash
  sudo netstat -tuln | grep 27017  # Should show 127.0.0.1:27017
  ```

### Firewall & Security
- [ ] UFW firewall enabled and configured
- [ ] Fail2Ban installed and running
- [ ] SSH key-only authentication verified
- [ ] Swap space created (2GB)

---

## Phase 2: Application Deployment (20-30 min)

### Upload Application Code
- [ ] Code uploaded to EC2:
  ```bash
  scp -i key.pem -r agent1 ubuntu@IP:/home/ubuntu/apps/sellsera
  # OR
  git clone https://github.com/yourusername/sellsera.git /home/ubuntu/apps/sellsera
  ```
- [ ] Directory structure verified:
  ```bash
  ls -la /home/ubuntu/apps/sellsera/
  ```

### Backend Setup
- [ ] Navigated to backend: `cd /home/ubuntu/apps/sellsera/backend`
- [ ] Generated secrets: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- [ ] Created `.env` file: `cp .env.production.template .env`
- [ ] Filled in all `.env` values:
  - [ ] `MONGODB_URI` with app user credentials
  - [ ] `JWT_SECRET`, `JWT_REFRESH_SECRET`, `SESSION_SECRET`
  - [ ] All domain URLs (www, app, admin, api)
  - [ ] `CORS_ORIGIN` with all frontend URLs
  - [ ] Stripe keys
  - [ ] SMTP credentials
  - [ ] All file paths are absolute
- [ ] Installed dependencies: `npm install --production`
- [ ] Verified ecosystem config exists: `ls ecosystem.config.js`
- [ ] Created logs directory: `mkdir -p logs`

### Frontend Builds
- [ ] Marketing frontend:
  ```bash
  cd /home/ubuntu/apps/sellsera/frontend-marketing
  npm install
  npm run build
  ls -lh build/  # Verify build/ exists
  ```
- [ ] Customer Center:
  ```bash
  cd /home/ubuntu/apps/sellsera/frontend-customer-center
  npm install
  npm run build
  ls -lh build/
  ```
- [ ] Admin Center:
  ```bash
  cd /home/ubuntu/apps/sellsera/frontend-admin-center
  npm install
  npm run build
  ls -lh build/
  ```

---

## Phase 3: Nginx & SSL Configuration (15-20 min)

### Nginx Setup
- [ ] Created Nginx config: `sudo nano /etc/nginx/sites-available/sellsera`
- [ ] Pasted configuration from `DEPLOYMENT_GUIDE.md` Section 8.3
- [ ] Domains already configured for sellsera.com (www, seller, me, api)
- [ ] Verified all frontend build paths are correct
- [ ] Created symlink: `sudo ln -s /etc/nginx/sites-available/sellsera /etc/nginx/sites-enabled/`
- [ ] Tested configuration: `sudo nginx -t`
- [ ] Reloaded Nginx: `sudo systemctl reload nginx`

### SSL Certificate (Let's Encrypt)
- [ ] Verified DNS records are propagated (wait 10-15 min if just created)
- [ ] Obtained certificates:
  ```bash
  sudo certbot --nginx -d sellsera.com -d www.sellsera.com -d seller.sellsera.com -d me.sellsera.com -d api.sellsera.com
  ```
- [ ] Entered email address
- [ ] Agreed to Terms of Service
- [ ] Chose "Redirect HTTP to HTTPS" (option 2)
- [ ] Verified SSL auto-renewal: `sudo certbot renew --dry-run`

---

## Phase 4: Start Application (10-15 min)

### Launch Backend
- [ ] Navigated to backend: `cd /home/ubuntu/apps/sellsera/backend`
- [ ] Started with systemd: `sudo systemctl start sellsera-backend`
- [ ] Checked status: `sudo systemctl status sellsera-backend`
- [ ] Viewed logs: `sudo journalctl -u sellsera-backend -n 50`
- [ ] Verified no errors in logs
- [ ] Enabled auto-start on boot: `sudo systemctl enable sellsera-backend`
- [ ] Tested health endpoint:
  ```bash
  curl http://localhost:3001/health
  curl https://api.sellsera.com/health
  ```

### Database Migration
- [ ] Uploaded local backup to EC2:
  ```bash
  scp -i key.pem -r mongodb-backup ubuntu@IP:/home/ubuntu/
  ```
- [ ] Imported database:
  ```bash
  mongorestore --uri="mongodb://sellseraApp:PASS@localhost/sellsera_production?authSource=sellsera_production" --drop /home/ubuntu/mongodb-backup/sellsera_dev
  ```
- [ ] Verified import:
  ```bash
  mongosh -u sellseraApp -p 'PASS' --authenticationDatabase sellsera_production sellsera_production
  show collections
  db.users.countDocuments()
  exit
  ```

### Run Seed Scripts (if database is empty)
- [ ] Seeded marketing pages: `node src/scripts/seed/seedMarketingPages.js`
- [ ] (Optional) Seeded plans: `node src/scripts/seed/seedPlans.js`
- [ ] (Optional) Created admin user: `node src/scripts/seed/seedAdminUser.js`

---

## Phase 5: Testing & Verification (20-30 min)

### Frontend Testing
- [ ] Marketing site loads: https://www.sellsera.com
  - [ ] Homepage displays correctly
  - [ ] Images load
  - [ ] Links work
  - [ ] Favicon displays
- [ ] Customer Center loads: https://seller.sellsera.com
  - [ ] Login page displays
  - [ ] Can access dashboard (if logged in)
  - [ ] Favicon displays
- [ ] Admin Center loads: https://me.sellsera.com
  - [ ] Login page displays
  - [ ] Can access admin dashboard (if logged in)
  - [ ] Favicon displays

### API Testing
- [ ] API health check: `curl https://api.sellsera.com/health`
- [ ] Public site endpoint: `curl https://api.sellsera.com/api/v1/public/site`
- [ ] Public plans endpoint: `curl https://api.sellsera.com/api/v1/public/plans`
- [ ] CORS working (check browser console for errors)

### Backend Testing
- [ ] Backend logs show no errors: `sudo journalctl -u sellsera-backend -n 50`
- [ ] Backend process running: `sudo systemctl status sellsera-backend`
- [ ] MongoDB connection successful (check logs)
- [ ] No 502 Bad Gateway errors
- [ ] No 500 Internal Server errors

### SSL/HTTPS Testing
- [ ] All URLs redirect HTTP → HTTPS
- [ ] SSL certificates valid (no browser warnings)
- [ ] Check certificate: https://www.ssllabs.com/ssltest/
- [ ] Mixed content warnings resolved (all resources load over HTTPS)

### Performance Testing
- [ ] Page load times acceptable (< 3 seconds)
- [ ] Images optimized and loading
- [ ] No console errors in browser DevTools
- [ ] API response times reasonable

---

## Phase 6: Post-Deployment Setup (15-20 min)

### Monitoring & Backups
- [ ] Updated backup script with MongoDB password: `nano /home/ubuntu/backup-mongodb.sh`
- [ ] Tested backup script: `./backup-mongodb.sh`
- [ ] Verified backup created: `ls -lh /home/ubuntu/backups/`
- [ ] Set up daily backup cron:
  ```bash
  crontab -e
  # Add: 0 2 * * * /home/ubuntu/backup-mongodb.sh >> /home/ubuntu/backup.log 2>&1
  ```
- [ ] Set up health check cron:
  ```bash
  crontab -e
  # Add: */5 * * * * /home/ubuntu/health-check.sh >> /home/ubuntu/health-check.log 2>&1
  ```
- [ ] Tested health check: `./health-check.sh`

### System Hardening
- [ ] Reviewed SSH config: `sudo nano /etc/ssh/sshd_config`
  - [ ] `PermitRootLogin no`
  - [ ] `PasswordAuthentication no`
- [ ] Restarted SSH: `sudo systemctl restart sshd`
- [ ] Verified UFW rules: `sudo ufw status verbose`
- [ ] Checked Fail2Ban: `sudo fail2ban-client status`
- [ ] Deleted secrets file: `rm /home/ubuntu/secrets.txt`

### Final Verification
- [ ] Rebooted server: `sudo reboot`
- [ ] After reboot, verified all services auto-started:
  - [ ] MongoDB: `sudo systemctl status mongod`
  - [ ] Nginx: `sudo systemctl status nginx`
  - [ ] Backend: `sudo systemctl status sellsera-backend`
- [ ] Tested all URLs again after reboot

---

## Phase 7: Application Configuration (10-15 min)

### Admin Portal Setup
- [ ] Logged into Admin Center: https://me.sellsera.com
- [ ] Created first admin account (if seed script wasn't run)
- [ ] Configured branding settings:
  - [ ] Uploaded logo
  - [ ] Uploaded favicon
  - [ ] Set company name
  - [ ] Set brand colors
- [ ] Created subscription plans
- [ ] Configured payment gateway (Stripe or LemonSqueezy)
- [ ] Set up email templates (if needed)

### Marketing Site Configuration
- [ ] Verified all pages load:
  - [ ] Home
  - [ ] Features
  - [ ] Pricing
  - [ ] Contact
  - [ ] Blog
  - [ ] Privacy Policy
  - [ ] Terms & Conditions
- [ ] Edited content if needed via Admin Center
- [ ] Tested contact form (if applicable)

### Customer Portal Testing
- [ ] Created test customer account
- [ ] Logged in successfully
- [ ] Verified dashboard loads
- [ ] Tested subscription flow (if applicable)

---

## Phase 8: External Integrations (15-20 min)

### Payment Gateway
- [ ] Stripe webhook configured: https://dashboard.stripe.com/webhooks
  - [ ] Webhook URL: `https://api.sellsera.com/api/v1/webhooks/stripe`
  - [ ] Events selected: `invoice.payment_succeeded`, `customer.subscription.deleted`, etc.
  - [ ] Webhook signing secret added to `.env`
- [ ] Test payment processed successfully (use Stripe test mode first)

### Email Service
- [ ] Test email sent successfully:
  ```bash
  # Trigger test email from Admin Center or Customer Portal
  ```
- [ ] Verified email deliverability
- [ ] Checked spam folder (first email might land there)
- [ ] Configured SPF/DKIM records if using custom domain (optional)

### Analytics (Optional)
- [ ] Google Analytics configured (if using)
- [ ] Sentry error tracking configured (if using)
- [ ] Added analytics tracking IDs to frontend `.env` files

---

## Phase 9: Documentation & Handoff (10 min)

### Documentation
- [ ] Saved all passwords in secure password manager
- [ ] Documented server IP address
- [ ] Documented all domain URLs
- [ ] Saved SSH key securely (`.pem` file)
- [ ] Noted all API keys and secrets
- [ ] Created internal runbook with common commands

### Team Access (if applicable)
- [ ] Created admin accounts for team members
- [ ] Set up SSH keys for team members (if needed)
- [ ] Shared relevant documentation
- [ ] Conducted walkthrough of Admin Center

---

## Final Checklist

### Functional Testing
- [ ] Can sign up as new user
- [ ] Can log in as existing user
- [ ] Can log in to Admin Center
- [ ] Can upload images (logos, favicons)
- [ ] Can create/edit marketing pages
- [ ] Can create/edit subscription plans
- [ ] Can view analytics (if applicable)
- [ ] Email notifications working
- [ ] Payment processing working (Stripe test mode)

### Performance & Monitoring
- [ ] Server resources monitored: `./system-info.sh`
- [ ] Memory usage acceptable (< 80%): `free -h`
- [ ] Disk usage acceptable (< 70%): `df -h`
- [ ] No errors in backend logs: `sudo journalctl -u sellsera-backend`
- [ ] No errors in Nginx logs: `sudo tail -f /var/log/nginx/error.log`
- [ ] No errors in MongoDB logs: `sudo tail -f /var/log/mongodb/mongod.log`

### Security
- [ ] SSL certificates valid
- [ ] HTTPS enforced (no HTTP access)
- [ ] MongoDB not publicly accessible
- [ ] Firewall rules correct
- [ ] SSH key-only access
- [ ] No `.env` file committed to git
- [ ] Strong passwords used everywhere

### Backup & Recovery
- [ ] Database backup tested
- [ ] Backup cron job scheduled
- [ ] Know how to restore from backup
- [ ] Know how to restart all services

---

## Post-Launch Maintenance Tasks

### Daily
- [ ] Review backend logs: `sudo journalctl -u sellsera-backend -n 50`
- [ ] Check server health: `./system-info.sh`

### Weekly
- [ ] Review error logs: `sudo journalctl -u sellsera-backend -p err`
- [ ] Check disk usage: `df -h`
- [ ] Review backup logs: `cat /home/ubuntu/backup.log`

### Monthly
- [ ] Update system packages: `sudo apt update && sudo apt upgrade -y`
- [ ] Review SSL certificate expiry: `sudo certbot certificates`
- [ ] Audit user accounts and access
- [ ] Review security logs: `sudo cat /var/log/auth.log | grep Failed`

### Quarterly
- [ ] Full database backup download to local: `scp -i key.pem ubuntu@IP:/home/ubuntu/backups/ ./`
- [ ] Security audit
- [ ] Performance optimization review

---

## 🎉 Deployment Complete!

**Your Sellsera application is now live!**

**Access your application:**
- 🌐 Marketing: https://www.sellsera.com
- 👥 Customer Portal: https://seller.sellsera.com
- ⚙️ Admin Dashboard: https://me.sellsera.com
- 🔌 API: https://api.sellsera.com

**Quick reference files:**
- `DEPLOYMENT_GUIDE.md` — Full deployment guide
- `QUICK_REFERENCE.md` — Command cheat sheet
- `deploy.sh` — Automated setup script
- `update.sh` — Application update script

**Get help:**
- Review logs: `sudo journalctl -u sellsera-backend -n 50`
- System status: `./system-info.sh`
- Troubleshooting: See `DEPLOYMENT_GUIDE.md` Section 15

---

**Deployment Date:** ________________  
**Deployed By:** ________________  
**Server IP:** ________________  
**Domain:** ________________  

**Notes:**
_________________________________________________________________________
_________________________________________________________________________
_________________________________________________________________________
