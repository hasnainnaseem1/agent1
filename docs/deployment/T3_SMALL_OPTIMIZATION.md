# t3.small Optimization Guide for Sellsera

**🔧 Memory & Performance Optimization for 2GB RAM Instance**

The t3.small instance (2 vCPU, 2GB RAM) is sufficient for Sellsera in development and low-traffic production, but requires careful resource management. This guide covers optimizations and troubleshooting for memory-constrained environments.

---

## Table of Contents

1. [Understanding t3.small Limitations](#understanding-t3small-limitations)
2. [Memory Allocation Strategy](#memory-allocation-strategy)
3. [MongoDB Optimization](#mongodb-optimization)
4. [Node.js Backend Optimization](#nodejs-backend-optimization)
5. [Nginx Optimization](#nginx-optimization)
6. [Swap Space Configuration](#swap-space-configuration)
7. [Monitoring & Alerts](#monitoring--alerts)
8. [Common Issues & Solutions](#common-issues--solutions)
9. [When to Upgrade](#when-to-upgrade)

---

## Understanding t3.small Limitations

### Specifications
- **CPU:** 2 vCPU (burstable)
- **RAM:** 2 GB (1.9 GB usable)
- **Baseline Performance:** 20% CPU
- **Burst Credits:** Limited CPU burst capability

### Typical Memory Usage (Sellsera Stack)
```
Component                Memory    Percentage
─────────────────────────────────────────────
System (Ubuntu)          ~150 MB     7.5%
MongoDB 7.0              ~500 MB    25.0%
Node.js Backend          ~200 MB    10.0%
Nginx                     ~20 MB     1.0%
Systemd Services          ~20 MB     1.0%
Swap Space (buffer)      2048 MB      —
─────────────────────────────────────────────
Total Used               ~890 MB    44.5%
Free for spikes         ~1010 MB    50.5%
System reserved          ~100 MB     5.0%
```

### Risk Factors
- **Traffic spikes** can exceed available memory
- **MongoDB cache** can grow if not limited
- **Multiple npm builds** simultaneously will cause OOM
- **Background cron jobs** must be staggered

---

## Memory Allocation Strategy

### Recommended Allocation

```yaml
MongoDB:
  Cache Size: 512 MB (configured in mongod.conf)
  Total Usage: ~500-600 MB
  
Node.js Backend:
  Initial Heap: ~128 MB
  Max Heap: ~400 MB
  Systemd MemoryMax: 450 MB
  
Nginx:
  Worker Processes: 1
  Worker Connections: 512
  
Swap:
  Size: 2 GB (as safety buffer)
```

### Setting Node.js Memory Limit

Edit `/home/ubuntu/apps/sellsera/backend/sellsera-backend.service` or `/etc/systemd/system/sellsera-backend.service`:

```ini
[Service]
Environment="NODE_OPTIONS=--max-old-space-size=400"
MemoryMax=450M
MemoryHigh=400M
OOMPolicy=kill

# The service will be killed if memory exceeds MemoryMax
# MemoryHigh triggers warnings and pressure before hard limit
```

Apply changes:
```bash
sudo systemctl daemon-reload
sudo systemctl restart sellsera-backend
```

---

## MongoDB Optimization

### Current Configuration (Already Applied)

File: `/etc/mongod.conf`

```yaml
storage:
  wiredTiger:
    engineConfig:
      cacheSizeGB: 0.5  # Limit to 512MB
```

### Additional Optimizations

#### 1. Disable MongoDB Journaling (Only if acceptable)

⚠️ **Warning:** Reduces durability but saves ~100-200 MB

```bash
sudo nano /etc/mongod.conf
```

```yaml
storage:
  journal:
    enabled: false  # Disable journaling (use with caution)
```

```bash
sudo systemctl restart mongod
```

#### 2. Compact Collections (Reclaim Space)

Run monthly:

```javascript
mongosh -u sellseraApp -p 'PASSWORD' --authenticationDatabase sellsera_production sellsera_production

db.getCollectionNames().forEach(function(collection) {
  print("Compacting: " + collection);
  db.runCommand({ compact: collection, force: true });
});
```

#### 3. Index Optimization

Remove unused indexes:

```javascript
// List all indexes
db.users.getIndexes()

// Drop unused index
db.users.dropIndex("index_name")

// Rebuild indexes (reclaim space)
db.users.reIndex()
```

#### 4. Monitor MongoDB Memory

```bash
# Real-time memory usage
mongosh -u sellseraApp -p 'PASSWORD' --authenticationDatabase sellsera_production sellsera_production --eval "db.serverStatus().mem"

# Check cache statistics
mongosh -u sellseraApp -p 'PASSWORD' --authenticationDatabase sellsera_production sellsera_production --eval "db.serverStatus().wiredTiger.cache"
```

---

## Node.js Backend Optimization

### 1. NPM Production Mode

Always use `--production` flag:

```bash
cd /home/ubuntu/apps/sellsera/backend
npm install --production
npm prune --production  # Remove dev dependencies
```

### 2. Memory Leak Detection

Monitor memory usage with systemd and native tools:

```bash
# View real-time service status and memory
sudo systemctl status sellsera-backend

# Monitor memory usage continuously
watch -n 2 'sudo systemctl status sellsera-backend | grep Memory'

# Or use top/htop to monitor the Node.js process
top -p $(pgrep -f "node.*server.js")
```

### 3. Garbage Collection Tuning

Edit `/home/ubuntu/apps/sellsera/backend/sellsera-backend.service` or `/etc/systemd/system/sellsera-backend.service`:

```ini
[Service]
Environment="NODE_OPTIONS=--max-old-space-size=400 --optimize-for-size --gc-interval=100 --max-executable-size=192"

# Explanation:
# --max-old-space-size=400   : Max heap 400MB
# --optimize-for-size        : Optimize for low memory
# --gc-interval=100          : Run GC more frequently
# --max-executable-size=192  : Limit V8 code size
```

Restart backend:

```bash
sudo systemctl daemon-reload
sudo systemctl restart sellsera-backend
```

### 4. Lazy Loading Modules

In your backend code, load heavy modules only when needed:

```javascript
// Bad: Loads everything at startup
const PDF = require('pdf-lib');
const ImageProcessor = require('sharp');

// Good: Load on-demand
async function generatePDF() {
  const PDF = require('pdf-lib');
  // ... use PDF
}
```

---

## Nginx Optimization

### 1. Reduce Worker Processes

File: `/etc/nginx/nginx.conf`

```nginx
user www-data;
worker_processes 1;  # t3.small only needs 1 worker
pid /run/nginx.pid;

events {
  worker_connections 512;  # Reduced from default 768
  use epoll;               # Linux optimization
  multi_accept on;
}

http {
  sendfile on;
  tcp_nopush on;
  tcp_nodelay on;
  keepalive_timeout 30;    # Reduced from 65
  keepalive_requests 50;   # Limit per connection
  reset_timedout_connection on;
  client_body_timeout 10;
  send_timeout 10;
  
  # Gzip compression (CPU for memory tradeoff)
  gzip on;
  gzip_vary on;
  gzip_min_length 1024;
  gzip_comp_level 4;       # Lower than default 6
  gzip_types text/plain text/css application/json application/javascript text/xml application/xml image/svg+xml;
  
  # Buffer settings (reduce per-connection memory)
  client_body_buffer_size 16k;
  client_header_buffer_size 1k;
  large_client_header_buffers 2 4k;
  
  # Include other configs
  include /etc/nginx/conf.d/*.conf;
  include /etc/nginx/sites-enabled/*;
}
```

```bash
sudo nginx -t && sudo systemctl reload nginx
```

---

## Swap Space Configuration

### Why Swap Matters on t3.small

Swap acts as overflow when RAM is full, preventing OOM kills.

### Current Swap Setup (Already Done by deploy.sh)

```bash
# Verify swap is active
swapon --show

# Should output:
# NAME      TYPE SIZE USED PRIO
# /swapfile file   2G   0B   -2
```

### Swappiness Tuning

Swappiness controls how aggressively Linux uses swap:
- **0-10:** Avoid swap, risk OOM
- **30-50:** Balanced (recommended for t3.small)
- **60-100:** Use swap aggressively (slower but safer)

```bash
# Check current swappiness
cat /proc/sys/vm/swappiness

# Set to 40 (recommended for t3.small)
sudo sysctl vm.swappiness=40

# Make permanent
echo "vm.swappiness=40" | sudo tee -a /etc/sysctl.conf
```

---

## Monitoring & Alerts

### 1. Real-Time Memory Monitoring

```bash
# Watch memory every 2 seconds
watch -n 2 free -h

# Top memory consumers
ps aux --sort=-%mem | head -n 10

# Detailed process memory
sudo pmap -x $(pgrep mongod)
```

### 2. Memory Alert Script

Create: `/home/ubuntu/memory-alert.sh`

```bash
#!/bin/bash
THRESHOLD=85  # Alert at 85% memory usage

MEM_USAGE=$(free | grep Mem | awk '{printf("%.0f", $3/$2 * 100)}')

if [ "$MEM_USAGE" -gt "$THRESHOLD" ]; then
  echo "$(date): ALERT - Memory usage at ${MEM_USAGE}%" | tee -a /home/ubuntu/memory-alerts.log
  
  # Log top processes
  ps aux --sort=-%mem | head -n 5 >> /home/ubuntu/memory-alerts.log
  
  # Optional: Restart backend if memory critical
  if [ "$MEM_USAGE" -gt "90" ]; then
    sudo systemctl restart sellsera-backend
    echo "$(date): Backend restarted due to high memory" >> /home/ubuntu/memory-alerts.log
  fi
fi
```

```bash
chmod +x /home/ubuntu/memory-alert.sh

# Run every 10 minutes
crontab -e
# Add: */10 * * * * /home/ubuntu/memory-alert.sh
```

### 3. Systemd Service Monitoring

```bash
# View service status and memory usage
sudo systemctl status sellsera-backend

# Monitor memory continuously
watch -n 2 'sudo systemctl status sellsera-backend | grep -E "Active|Memory"'

# View service logs in real-time
sudo journalctl -u sellsera-backend -f

# Check for service restarts
sudo journalctl -u sellsera-backend | grep -i "started\|stopped\|restart"
```

---

## Common Issues & Solutions

### Issue 1: "Out of Memory" Errors / Process Killed

**Symptoms:**
- `systemctl status sellsera-backend` shows backend as "failed" or "inactive"
- System logs show: `Out of memory: Kill process`
- Frontend shows 502 Bad Gateway

**Diagnosis:**
```bash
# Check system logs
sudo journalctl -p err -n 50

# Check for OOM kills
sudo dmesg | grep -i "killed process"
```

**Solutions:**

1. **Immediate:** Restart services
   ```bash
   sudo systemctl restart sellsera-backend
   sudo systemctl restart mongod
   ```

2. **Short-term:** Increase swap and lower systemd memory limit
   ```bash
   # In sellsera-backend.service, change:
   sudo nano /etc/systemd/system/sellsera-backend.service
   # Update: MemoryMax=400M (from 450M)
   # Update: MemoryHigh=350M (from 400M)
   sudo systemctl daemon-reload
   sudo systemctl restart sellsera-backend
   ```

3. **Long-term:** Optimize queries and indexes
   ```javascript
   // Add indexes for frequently queried fields
   db.users.createIndex({ email: 1 })
   db.sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
   ```

---

### Issue 2: Slow Response Times

**Symptoms:**
- API takes 3-5 seconds to respond
- Frontend feels sluggish
- High iowait in `htop`

**Diagnosis:**
```bash
# Check if swap is being used heavily
free -h
# If "Swap used" > 500MB, memory is exhausted

# Check MongoDB slow queries
mongosh -u sellseraApp -p 'PASSWORD' --authenticationDatabase sellsera_production sellsera_production --eval "db.system.profile.find({millis: {\$gt: 100}}).sort({ts: -1}).limit(5).pretty()"
```

**Solutions:**

1. **Add database indexes**
   ```javascript
   // Find slow queries
   db.setProfilingLevel(1, { slowms: 100 })
   db.system.profile.find().sort({ts: -1}).limit(5).pretty()
   
   // Add indexes
   db.marketingpages.createIndex({ slug: 1 })
   db.plans.createIndex({ status: 1, displayOrder: 1 })
   ```

2. **Enable Redis caching** (optional, adds ~50MB)
   ```bash
   sudo apt install redis-server
   sudo systemctl enable redis-server
   
   # Configure Redis for low memory
   sudo nano /etc/redis/redis.conf
   # Set: maxmemory 100mb
   # Set: maxmemory-policy allkeys-lru
   ```

3. **Reduce MongoDB log verbosity**
   ```yaml
   # /etc/mongod.conf
   systemLog:
     verbosity: 0  # 0 = errors only
   ```

---

### Issue 3: Cannot Build Frontends (npm Fails)

**Symptoms:**
- `npm run build` fails with "JavaScript heap out of memory"
- Build process hangs or crashes

**Solutions:**

1. **Build with memory limit**
   ```bash
   cd /home/ubuntu/apps/sellsera/frontend-marketing
   NODE_OPTIONS="--max-old-space-size=512" npm run build
   ```

2. **Build one frontend at a time** (never in parallel)
   ```bash
   # Stop backend first to free memory
   sudo systemctl stop sellsera-backend
   
   # Build frontends sequentially
   cd frontend-marketing && npm run build && cd ..
   cd frontend-customer-center && npm run build && cd ..
   cd frontend-admin-center && npm run build && cd ..
   
   # Restart backend
   sudo systemctl start sellsera-backend
   ```

3. **Build locally and upload** (recommended for t3.small)
   ```bash
   # On local machine (Windows):
   cd "C:\Users\Hasnain Naseem\Documents\agent1\frontend-marketing"
   npm run build
   
   # Upload build folder to EC2:
   scp -i key.pem -r build ubuntu@YOUR_EC2_IP:/home/ubuntu/apps/sellsera/frontend-marketing/
   ```

---

### Issue 4: MongoDB Crashes or Won't Start

**Symptoms:**
- `sudo systemctl status mongod` shows "failed"
- Logs show: `WiredTiger error: __wt_cache_create`

**Diagnosis:**
```bash
sudo tail -f /var/log/mongodb/mongod.log
```

**Solutions:**

1. **Repair MongoDB**
   ```bash
   sudo systemctl stop mongod
   sudo rm -rf /tmp/mongodb-*.sock
   sudo mongod --repair --dbpath /var/lib/mongodb
   sudo chown -R mongodb:mongodb /var/lib/mongodb
   sudo systemctl start mongod
   ```

2. **Reduce MongoDB cache even further**
   ```yaml
   # /etc/mongod.conf
   storage:
     wiredTiger:
       engineConfig:
         cacheSizeGB: 0.3  # From 0.5
   ```

3. **Close other processes before starting MongoDB**
   ```bash
   sudo systemctl stop sellsera-backend
   sudo systemctl start mongod
   sudo systemctl start sellsera-backend
   ```

---

## When to Upgrade

### Signs You Need More Resources

1. **Memory constantly above 85%**
   ```bash
   free -h  # If "used" > 1.7 GB consistently
   ```

2. **Frequent swap usage** (> 500 MB swap used regularly)

3. **Service restarts multiple times per day**
   ```bash
   sudo journalctl -u sellsera-backend | grep -i "started\|stopped" | tail -20
   ```

4. **Database queries taking > 500ms**

5. **More than 50-100 concurrent users**

6. **Multiple shops/tenants using the system**

### Upgrade Path

```
t3.small (2GB)
  ↓ (when memory > 85% consistently)
t3.medium (4GB) — Recommended for light production
  ↓ (when CPU credits deplete or users > 500)
t3.large (8GB) — Good for 1,000-5,000 users
  ↓ (when database > 20GB or high write load)
t3.xlarge (16GB) + Separate RDS for MongoDB
```

### Horizontal Scaling Alternative

Instead of vertical scaling, consider:

1. **Move MongoDB to Atlas** (managed, $57/mo for M10)
   - Frees ~500 MB on EC2
   - Better performance
   - Automatic backups

2. **Use S3 for file uploads** (instead of local storage)
   - Saves disk space
   - Better for multi-server setups

3. **Add Cloudflare CDN** (free tier)
   - Caches static assets
   - Reduces Nginx load

4. **Use Redis for sessions** (optional, $15/mo for Redis Cloud)
   - Offloads session storage from MongoDB

---

## Optimization Checklist

Copy and mark as complete:

### MongoDB
- [ ] Cache limited to 512 MB (`cacheSizeGB: 0.5`)
- [ ] Journaling disabled (if acceptable)
- [ ] Indexes created for all frequent queries
- [ ] Collections compacted monthly
- [ ] Slow query profiling enabled
- [ ] Unnecessary indexes removed

### Node.js Backend
- [ ] Memory limit set (`--max-old-space-size=400`)
- [ ] Systemd MemoryMax: 450 MB, MemoryHigh: 400 MB
- [ ] Production dependencies only (`npm install --production`)
- [ ] Heavy modules lazy-loaded
- [ ] Garbage collection tuned
- [ ] No memory leaks (monitored with journalctl and systemctl)

### Nginx
- [ ] 1 worker process (not auto)
- [ ] 512 worker connections (not 768)
- [ ] Gzip level 4 (not 6)
- [ ] Buffer sizes reduced
- [ ] Keepalive timeout lowered to 30s

### System
- [ ] 2 GB swap space active
- [ ] Swappiness set to 40
- [ ] Memory alerts configured (85% threshold)
- [ ] Cron jobs staggered (not simultaneous)
- [ ] No unnecessary services running

### Frontend Builds
- [ ] Builds done locally and uploaded (recommended)
- [ ] Or: build with memory limit + backend stopped
- [ ] Never build all 3 simultaneously

### Monitoring
- [ ] Systemd service monitoring active
- [ ] Memory alert script running every 10 min
- [ ] Daily memory report generated
- [ ] Logs reviewed weekly (journalctl)

---

## Quick Diagnostic Commands

```bash
# Memory overview
free -h && swapon --show

# Top 5 memory hogs
ps aux --sort=-%mem | head -n 6

# MongoDB memory
mongosh --quiet --eval "db.serverStatus().mem" -u sellseraApp -p 'PASS' --authenticationDatabase sellsera_production sellsera_production

# Backend memory
ps aux | grep node

# System resource summary
./system-info.sh

# Last 10 service restarts
sudo journalctl -u sellsera-backend | grep -i "started\|stopped" | tail -20

# View service status and memory
sudo systemctl status sellsera-backend

# Check for OOM kills
sudo dmesg | grep -i "killed" | tail -20
```

---

## Conclusion

The t3.small instance is **viable for development and low-traffic production** (<100 concurrent users) when properly optimized. Follow this guide to:

1. **Limit MongoDB to 512 MB**
2. **Limit Node.js to 400 MB**
3. **Use 2 GB swap as buffer**
4. **Build frontends locally** (or one at a time with backend stopped)
5. **Monitor memory alerts** at 85% threshold
6. **Upgrade when consistently above 85% memory usage**

With these optimizations, Sellsera will run smoothly on t3.small during development and early production phases.

---

**For more help:**
- Full deployment guide: `DEPLOYMENT_GUIDE.md`
- Command reference: `QUICK_REFERENCE.md`
- System monitoring: `./system-info.sh`
- Memory alerts: `./memory-alert.sh`
