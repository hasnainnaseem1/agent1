# Sellsera — Quick Reference Card

**🚀 One-Page Cheat Sheet for Ubuntu 24.04 LTS Deployment**

---

## Initial Deployment Commands

```bash
# 1. Upload and run automated setup
scp -i your-key.pem deploy.sh ubuntu@YOUR_EC2_IP:/home/ubuntu/
ssh -i your-key.pem ubuntu@YOUR_EC2_IP
chmod +x deploy.sh
./deploy.sh

# 2. Upload application code
scp -i your-key.pem -r agent1 ubuntu@YOUR_EC2_IP:/home/ubuntu/apps/sellsera

# 3. Set up MongoDB users (must do manually)
mongosh
use admin
db.createUser({user: "adminUser", pwd: "STRONG_PASSWORD", roles: ["userAdminAnyDatabase", "readWriteAnyDatabase"]})
use sellsera_production
db.createUser({user: "sellseraApp", pwd: "APP_PASSWORD", roles: [{role: "readWrite", db: "sellsera_production"}]})
exit

# 4. Configure backend
cd /home/ubuntu/apps/sellsera/backend
cp .env.production.template .env
nano .env  # Fill in all secrets and credentials
npm install --production

# 5. Build frontends
cd /home/ubuntu/apps/sellsera/frontend-marketing && npm install && npm run build
cd /home/ubuntu/apps/sellsera/frontend-customer-center && npm install && npm run build
cd /home/ubuntu/apps/sellsera/frontend-admin-center && npm install && npm run build

# 6. Configure Nginx
sudo nano /etc/nginx/sites-available/sellsera
# Paste config from DEPLOYMENT_GUIDE.md Section 8
sudo ln -s /etc/nginx/sites-available/sellsera /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# 7. Start backend
sudo systemctl start sellsera-backend
sudo systemctl status sellsera-backend

# 8. Get SSL certificates (after DNS is configured)
sudo certbot --nginx -d sellsera.com -d www.sellsera.com -d seller.sellsera.com -d me.sellsera.com -d api.sellsera.com
```

---

## Backend Service (systemd)

```bash
sudo systemctl status sellsera-backend                # Check service status
sudo systemctl start sellsera-backend                 # Start service
sudo systemctl stop sellsera-backend                  # Stop service
sudo systemctl restart sellsera-backend               # Restart service
sudo journalctl -u sellsera-backend -f                # Follow logs in real-time
sudo journalctl -u sellsera-backend -n 50             # View last 50 log lines
sudo journalctl -u sellsera-backend --since "1 hour ago"   # View logs from last hour
sudo journalctl --vacuum-time=1d                      # Clear logs older than 1 day
```

---

## Common Nginx Commands

```bash
sudo nginx -t                       # Test configuration
sudo systemctl reload nginx         # Reload (graceful restart)
sudo systemctl restart nginx        # Hard restart
sudo systemctl status nginx         # Check status
sudo tail -f /var/log/nginx/access.log   # Access logs
sudo tail -f /var/log/nginx/error.log    # Error logs
```

---

## MongoDB Commands

```bash
sudo systemctl status mongod        # Check MongoDB status
sudo systemctl restart mongod       # Restart MongoDB
sudo tail -f /var/log/mongodb/mongod.log   # View MongoDB logs

# Connect to database
mongosh -u sellseraApp -p 'YOUR_PASSWORD' --authenticationDatabase sellsera_production sellsera_production

# Inside mongosh:
show collections                    # List collections
db.users.countDocuments()           # Count users
db.marketingpages.find().pretty()   # View marketing pages
db.plans.find({status: "active"})   # View active plans
exit
```

---

## Update/Redeploy Application

```bash
# Update everything
cd /home/ubuntu/apps/sellsera
./update.sh all

# Update specific component
./update.sh backend      # Backend only
./update.sh marketing    # Marketing frontend only
./update.sh customer     # Customer Center only
./update.sh admin        # Admin Center only
```

---

## System Monitoring

```bash
# System overview
./system-info.sh

# Memory usage
free -h

# Disk usage
df -h
du -sh /home/ubuntu/apps/sellsera
du -sh /var/lib/mongodb

# Process monitoring
htop
top

# Network connections
sudo netstat -tuln | grep LISTEN

# Check which ports are in use
sudo lsof -i :3001   # Backend
sudo lsof -i :80     # HTTP
sudo lsof -i :443    # HTTPS
sudo lsof -i :27017  # MongoDB
```

---

## Database Backup & Restore

```bash
# Manual backup
./backup-mongodb.sh

# Or manual mongodump:
mongodump --uri="mongodb://sellseraApp:PASSWORD@localhost/sellsera_production?authSource=sellsera_production" --out=/home/ubuntu/backups/backup_$(date +%Y%m%d)

# Restore from backup
mongorestore --uri="mongodb://sellseraApp:PASSWORD@localhost/sellsera_production?authSource=sellsera_production" --drop /home/ubuntu/backups/backup_YYYYMMDD

# Download backup to local machine
scp -i your-key.pem ubuntu@YOUR_EC2_IP:/home/ubuntu/backups/backup.tar.gz ./
```

---

## SSL Certificate Management

```bash
# List certificates
sudo certbot certificates

# Renew manually
sudo certbot renew

# Test renewal (dry run)
sudo certbot renew --dry-run

# Check auto-renewal timer
sudo systemctl status certbot.timer
```

---

## Troubleshooting Quick Fixes

### Backend not responding (502 Bad Gateway)

```bash
sudo systemctl restart sellsera-backend
sudo journalctl -u sellsera-backend -n 100
curl http://localhost:3001/health
```

### Frontend showing blank page

```bash
# Rebuild frontend
cd /home/ubuntu/apps/sellsera/frontend-marketing
npm run build
sudo systemctl reload nginx

# Check browser console for errors
# Check Nginx logs: sudo tail -f /var/log/nginx/error.log
```

### MongoDB connection errors

```bash
sudo systemctl status mongod
sudo systemctl restart mongod
sudo tail -f /var/log/mongodb/mongod.log

# Test connection
mongosh -u sellseraApp -p 'PASSWORD' --authenticationDatabase sellsera_production sellsera_production
```

### High memory usage / Server crash

```bash
# Check memory
free -h
htop

# Restart services
sudo systemctl restart sellsera-backend
sudo systemctl restart mongod

# Check swap
swapon --show
```

### Can't access website (DNS issues)

```bash
# Check DNS resolution
nslookup www.sellsera.com
nslookup seller.sellsera.com
nslookup api.sellsera.com

# Check Nginx is listening
sudo netstat -tuln | grep :80
sudo netstat -tuln | grep :443

# Test locally
curl http://localhost
curl https://localhost -k
```

---

## Security Checks

```bash
# Check firewall status
sudo ufw status verbose

# Check SSH configuration
sudo sshd -T | grep -E 'permitrootlogin|passwordauthentication'

# Check MongoDB is not publicly accessible
sudo netstat -tuln | grep 27017  # Should show 127.0.0.1:27017 only

# Check for failed login attempts
sudo cat /var/log/auth.log | grep "Failed password"

# Fail2Ban status
sudo fail2ban-client status
sudo fail2ban-client status sshd
```

---

## Performance Optimization

```bash
# Enable MongoDB profiling (slow queries)
mongosh -u sellseraApp -p 'PASSWORD' --authenticationDatabase sellsera_production sellsera_production
db.setProfilingLevel(1, {slowms: 100})  # Log queries > 100ms
db.system.profile.find().limit(5).sort({ts: -1}).pretty()

# Check backend memory usage
top -p $(pgrep -f "node.*server.js")

# Optimize frontend bundles (if slow)
cd /home/ubuntu/apps/sellsera/frontend-marketing
npm run build -- --stats
npx webpack-bundle-analyzer build/static/js/*.js
```

---

## Useful File Locations

```
Application:
  /home/ubuntu/apps/sellsera/                   — Main app directory
  /home/ubuntu/apps/sellsera/backend/           — Backend code
  /home/ubuntu/apps/sellsera/backend/.env       — Environment variables
  /home/ubuntu/apps/sellsera/backend/logs/      — Backend logs

Frontends:
  /home/ubuntu/apps/sellsera/frontend-marketing/build/
  /home/ubuntu/apps/sellsera/frontend-customer-center/build/
  /home/ubuntu/apps/sellsera/frontend-admin-center/build/

Nginx:
  /etc/nginx/sites-available/sellsera           — Nginx config
  /etc/nginx/sites-enabled/sellsera             — Symlink to config
  /var/log/nginx/access.log                     — Access logs
  /var/log/nginx/error.log                      — Error logs

MongoDB:
  /var/lib/mongodb/                             — Database files
  /var/log/mongodb/mongod.log                   — MongoDB logs
  /etc/mongod.conf                              — MongoDB config

Helpers:
  /home/ubuntu/backup-mongodb.sh                — Backup script
  /home/ubuntu/health-check.sh                  — Health monitor
  /home/ubuntu/system-info.sh                   — System status
  /home/ubuntu/update.sh                        — Update script
  /home/ubuntu/secrets.txt                      — Generated secrets (delete after use)
```

---

## Emergency Recovery

### If server crashes:

```bash
# Reboot
sudo reboot

# After reboot, verify all services:
sudo systemctl status mongod
sudo systemctl status nginx
sudo systemctl status sellsera-backend

# If services didn't auto-start:
sudo systemctl start mongod
sudo systemctl start nginx
sudo systemctl start sellsera-backend
```

### If backend won't start:

```bash
# Check for port conflicts
sudo lsof -i :3001
# If something else is using port 3001, kill it: sudo kill -9 PID

# Check .env file exists
ls -la /home/ubuntu/apps/sellsera/backend/.env

# Test backend manually
cd /home/ubuntu/apps/sellsera/backend
node src/server.js
# If errors appear, fix them in .env or code
```

---

## Contact & Support

- **Full Guide:** `DEPLOYMENT_GUIDE.md`
- **View live logs:** `sudo journalctl -u sellsera-backend -f`
- **System status:** `./system-info.sh`
- **MongoDB docs:** https://www.mongodb.com/docs/
- **systemd docs:** https://www.freedesktop.org/wiki/Software/systemd/
- **Nginx docs:** https://nginx.org/en/docs/

---

**💡 Tip:** Bookmark this file and keep it handy for quick reference during deployments and troubleshooting.
