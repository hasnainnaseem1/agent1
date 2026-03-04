# Post-Deployment Steps — After Running deploy.sh

**Date:** March 5, 2026  
**Target:** Ubuntu 24.04 LTS on AWS EC2 t3.small

---

## ✅ What deploy.sh Already Did

The deployment script installed and configured:
- ✓ MongoDB 7.0.6 (optimized for 2GB RAM)
- ✓ Node.js 20.x LTS
- ✓ Nginx web server
- ✓ Certbot (for SSL certificates)
- ✓ UFW firewall (ports 22, 80, 443)
- ✓ Fail2Ban security
- ✓ 2GB swap file
- ✓ Helper scripts (backup, health-check, system-info)

---

## 🔑 Important: Frontend vs Backend Deployment

### **Frontends (React Apps) — NO systemd service needed**
- Frontends compile to static files (HTML, CSS, JS)
- Nginx serves these files directly (like Apache/IIS)
- No Node.js process runs in production for frontends
- Built once with `npm run build`, served forever by Nginx

### **Backend (Node.js API) — systemd service required**
- Backend is a running Node.js server process
- Needs systemd to manage, restart, and monitor
- Service file: `sellsera-backend.service`

---

## 📋 Steps to Complete (After deploy.sh)

### **Step 1: Upload Your Code**

```bash
# From your local Windows machine, upload code to server
scp -i your-key.pem -r agent1/* ubuntu@YOUR_EC2_IP:/home/ubuntu/apps/sellsera/
```

Or use WinSCP / FileZilla to upload the entire project to `/home/ubuntu/apps/sellsera/`

---

### **Step 2: Set Up MongoDB Users**

```bash
# Connect to MongoDB
mongosh

# In mongosh, create admin user
use admin
db.createUser({
  user: "adminUser",
  pwd: "YOUR_STRONG_ADMIN_PASSWORD",
  roles: ["userAdminAnyDatabase", "dbAdminAnyDatabase", "readWriteAnyDatabase"]
})

# Create application database and user
use sellsera_production
db.createUser({
  user: "sellseraApp",
  pwd: "YOUR_STRONG_APP_PASSWORD",
  roles: [
    { role: "readWrite", db: "sellsera_production" },
    { role: "dbAdmin", db: "sellsera_production" }
  ]
})

exit
```

**Save these credentials securely!**

---

### **Step 3: Configure Backend Environment**

```bash
cd /home/ubuntu/apps/sellsera/backend

# Copy template
cp .env.production.template .env

# Edit with your credentials
nano .env
```

**Update these critical values:**
```bash
# MongoDB (use credentials from Step 2)
MONGODB_URI=mongodb://sellseraApp:YOUR_STRONG_APP_PASSWORD@127.0.0.1:27017/sellsera_production?authSource=sellsera_production

# Generate JWT secrets (run this on server):
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=<paste-64-char-hex-here>
JWT_REFRESH_SECRET=<paste-64-char-hex-here>
SESSION_SECRET=<paste-64-char-hex-here>

# Stripe (get from stripe.com dashboard)
STRIPE_SECRET_KEY=sk_live_YOUR_KEY
STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_KEY

# Email (e.g., SendGrid)
SMTP_PASS=YOUR_SENDGRID_API_KEY

# Admin
SUPER_ADMIN_KEY=<random-string>
```

Save and exit (`Ctrl+X`, `Y`, `Enter`)

---

### **Step 4: Install Backend Dependencies**

```bash
cd /home/ubuntu/apps/sellsera/backend
npm install --production
```

---

### **Step 5: Build All Frontends**

```bash
# Marketing frontend
cd /home/ubuntu/apps/sellsera/frontend-marketing
npm install
npm run build

# Customer Center
cd /home/ubuntu/apps/sellsera/frontend-customer-center
npm install
npm run build

# Admin Center
cd /home/ubuntu/apps/sellsera/frontend-admin-center
npm install
npm run build
```

**Wait for builds to complete (5-10 minutes total)**

---

### **Step 6: Configure Nginx**

```bash
sudo nano /etc/nginx/sites-available/sellsera
```

**Paste this complete configuration:**

```nginx
# Backend API upstream
upstream backend_api {
    server 127.0.0.1:3001;
    keepalive 64;
}

# Marketing — sellsera.com
server {
    listen 80;
    listen [::]:80;
    server_name sellsera.com www.sellsera.com;
    
    root /home/ubuntu/apps/sellsera/frontend-marketing/build;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}

# Customer Portal — seller.sellsera.com
server {
    listen 80;
    listen [::]:80;
    server_name seller.sellsera.com;
    
    root /home/ubuntu/apps/sellsera/frontend-customer-center/build;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}

# Admin Dashboard — me.sellsera.com
server {
    listen 80;
    listen [::]:80;
    server_name me.sellsera.com;
    
    root /home/ubuntu/apps/sellsera/frontend-admin-center/build;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}

# Backend API — api.sellsera.com
server {
    listen 80;
    listen [::]:80;
    server_name api.sellsera.com;
    
    client_max_body_size 10M;
    
    location / {
        proxy_pass http://backend_api;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection "";
    }
}
```

**Enable site and test:**

```bash
# Create symlink
sudo ln -s /etc/nginx/sites-available/sellsera /etc/nginx/sites-enabled/

# Remove default site
sudo rm -f /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

### **Step 7: Set Up DNS Records**

Go to your domain registrar (Namecheap, GoDaddy, Cloudflare, etc.) and create **A records**:

| Hostname | Type | Value (IP Address) | TTL |
|----------|------|-------------------|-----|
| `@` | A | `YOUR_EC2_PUBLIC_IP` | 300 |
| `www` | A | `YOUR_EC2_PUBLIC_IP` | 300 |
| `seller` | A | `YOUR_EC2_PUBLIC_IP` | 300 |
| `me` | A | `YOUR_EC2_PUBLIC_IP` | 300 |
| `api` | A | `YOUR_EC2_PUBLIC_IP` | 300 |

**Wait 5-10 minutes for DNS propagation**

Verify:
```bash
nslookup sellsera.com
nslookup seller.sellsera.com
nslookup me.sellsera.com
nslookup api.sellsera.com
```

---

### **Step 8: Start Backend Service**

```bash
# Install systemd service
sudo cp /home/ubuntu/apps/sellsera/backend/sellsera-backend.service /etc/systemd/system/

# Reload systemd
sudo systemctl daemon-reload

# Enable auto-start on boot
sudo systemctl enable sellsera-backend

# Start the service
sudo systemctl start sellsera-backend

# Check status (should show "active (running)")
sudo systemctl status sellsera-backend

# View logs
sudo journalctl -u sellsera-backend -f
```

**Expected output:** Service should be `active (running)` in green

---

### **Step 9: Test Without SSL**

```bash
# Test backend API
curl http://localhost:3001/health

# Test from domain (after DNS propagates)
curl http://api.sellsera.com/health

# Test frontends (should return HTML)
curl http://sellsera.com
curl http://seller.sellsera.com
curl http://me.sellsera.com
```

**Open in browser:**
- http://sellsera.com (Marketing site)
- http://seller.sellsera.com (Customer portal)
- http://me.sellsera.com (Admin dashboard)

---

### **Step 10: Enable HTTPS (SSL Certificates)**

```bash
sudo certbot --nginx \
  -d sellsera.com \
  -d www.sellsera.com \
  -d seller.sellsera.com \
  -d me.sellsera.com \
  -d api.sellsera.com
```

**Follow prompts:**
1. Enter email for renewal notifications
2. Agree to Terms of Service
3. Select option 2: "Redirect HTTP to HTTPS"

**Test HTTPS:**
```bash
curl https://api.sellsera.com/health
```

**Open in browser:**
- https://sellsera.com ✓ Green padlock
- https://seller.sellsera.com ✓ Secure
- https://me.sellsera.com ✓ Secure
- https://api.sellsera.com/health ✓ Returns JSON

---

### **Step 11: Import Database (If Migrating)**

If you have existing data from local development:

**On Windows (export):**
```powershell
mongodump --db=sellsera_development --out=backup
```

**Upload to server:**
```bash
scp -i your-key.pem -r backup ubuntu@YOUR_EC2_IP:/home/ubuntu/
```

**On server (import):**
```bash
mongorestore \
  --uri='mongodb://sellseraApp:YOUR_STRONG_APP_PASSWORD@localhost/sellsera_production?authSource=sellsera_production' \
  /home/ubuntu/backup/sellsera_development
```

---

## ✅ Verification Checklist

After completing all steps, verify:

- [ ] **Backend API:** `curl https://api.sellsera.com/health` returns `{"status":"ok"}`
- [ ] **Marketing site:** https://sellsera.com loads your landing page
- [ ] **Customer portal:** https://seller.sellsera.com shows login page
- [ ] **Admin dashboard:** https://me.sellsera.com shows admin login
- [ ] **SSL certificates:** All domains show green padlock 🔒
- [ ] **Backend logs:** `sudo journalctl -u sellsera-backend -n 50` shows no errors
- [ ] **Service status:** `sudo systemctl status sellsera-backend` shows `active (running)`
- [ ] **MongoDB:** `mongosh --username sellseraApp --password YOUR_PASSWORD --authenticationDatabase sellsera_production` connects successfully

---

## 🛠️ Daily Management Commands

### **Check Backend Status**
```bash
sudo systemctl status sellsera-backend
```

### **View Backend Logs**
```bash
# Live logs
sudo journalctl -u sellsera-backend -f

# Last 50 lines
sudo journalctl -u sellsera-backend -n 50

# Logs from last hour
sudo journalctl -u sellsera-backend --since "1 hour ago"
```

### **Restart Backend**
```bash
sudo systemctl restart sellsera-backend
```

### **Update Application**
```bash
# Pull latest code
cd /home/ubuntu/apps/sellsera
git pull origin main

# Rebuild frontends if changed
cd frontend-marketing && npm run build
cd ../frontend-customer-center && npm run build
cd ../frontend-admin-center && npm run build

# Restart backend if changed
cd ../backend
npm install --production
sudo systemctl restart sellsera-backend
```

### **Backup Database**
```bash
/home/ubuntu/backup-mongodb.sh
```

### **System Health Check**
```bash
/home/ubuntu/system-info.sh
```

---

## 🆘 Quick Troubleshooting

### **Backend Not Starting**
```bash
# Check logs for error
sudo journalctl -u sellsera-backend -n 100

# Common issues:
# - MongoDB not running: sudo systemctl start mongod
# - Wrong .env credentials
# - Port 3001 already in use: sudo lsof -i :3001
```

### **Frontend Shows 404**
```bash
# Check if build folder exists
ls -la /home/ubuntu/apps/sellsera/frontend-marketing/build
ls -la /home/ubuntu/apps/sellsera/frontend-customer-center/build
ls -la /home/ubuntu/apps/sellsera/frontend-admin-center/build

# If missing, rebuild:
cd /home/ubuntu/apps/sellsera/frontend-marketing
npm run build
```

### **502 Bad Gateway (API)**
```bash
# Check if backend is running
sudo systemctl status sellsera-backend

# If stopped, start it
sudo systemctl start sellsera-backend

# Check if accessing correct port
curl http://localhost:3001/health
```

### **SSL Certificate Issues**
```bash
# Test renewal
sudo certbot renew --dry-run

# Force renewal
sudo certbot renew --force-renewal
```

---

## 📞 Support Resources

- **Deployment Guide:** DEPLOYMENT_GUIDE.md (detailed version)
- **Quick Reference:** QUICK_REFERENCE.md (command cheat sheet)
- **Optimization:** T3_SMALL_OPTIMIZATION.md (memory tuning)
- **Systemd Docs:** https://www.freedesktop.org/software/systemd/man/systemd.service.html
- **Nginx Docs:** https://nginx.org/en/docs/

---

## 🎯 Success Criteria

Your deployment is complete when:

1. ✅ All 4 domains load with HTTPS and green padlock
2. ✅ Backend API returns `{"status":"ok"}` at `/health` endpoint
3. ✅ Backend service shows `active (running)` status
4. ✅ No errors in backend logs for past 10 minutes
5. ✅ You can log in to admin dashboard and customer portal
6. ✅ MongoDB contains your data (if imported)
7. ✅ `sudo systemctl status sellsera-backend` shows 0 restarts

**Congratulations! 🎉 Your Sellsera platform is now live!**
