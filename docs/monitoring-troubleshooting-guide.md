# 📊 Monitoring & Troubleshooting Guide

## 🎯 Tổng quan Monitoring

### Key Performance Indicators (KPIs)
- **Application Uptime**: Target 99.9%
- **API Response Time**: < 500ms average
- **Database Query Time**: < 100ms average
- **WebSocket Connection Success Rate**: > 95%
- **Trading API Success Rate**: > 99%
- **Memory Usage**: < 80% of allocated
- **CPU Usage**: < 70% average

### Monitoring Stack
- **Application Monitoring**: PM2, New Relic
- **Infrastructure Monitoring**: System metrics, disk space
- **API Monitoring**: Custom health checks, Binance API status
- **Error Tracking**: Sentry, application logs
- **Real-time Alerts**: WebSocket, email notifications

## 🔍 System Health Monitoring

### 1. Built-in Health Check Endpoint
```bash
# Check application health
curl -X GET https://your-domain.com/api/system-health

# Expected response
{
  "timestamp": "2025-07-07T10:30:00.000Z",
  "overall": "healthy",
  "services": {
    "api": {
      "status": "healthy",
      "responseTime": 45,
      "uptime": 86400,
      "lastCheck": "2025-07-07T10:30:00.000Z"
    },
    "binance": {
      "status": "healthy",
      "latency": 120,
      "rateLimit": 85,
      "connectivity": true
    },
    "database": {
      "status": "healthy",
      "connections": 5,
      "responseTime": 25
    },
    "system": {
      "cpu": 45.2,
      "memory": 62.8,
      "uptime": 86400,
      "diskSpace": 78.5
    }
  },
  "alerts": []
}
```

### 2. PM2 Monitoring
```bash
# Check PM2 status
pm2 status
pm2 monit
pm2 logs ccxt-trading-app

# PM2 monitoring commands
pm2 show ccxt-trading-app
pm2 restart ccxt-trading-app
pm2 reload ccxt-trading-app
pm2 stop ccxt-trading-app
```

### 3. System Resource Monitoring
```bash
# CPU and Memory monitoring
htop
free -h
df -h

# Network monitoring
netstat -tulpn | grep :3000
ss -tulpn | grep :3000

# Process monitoring
ps aux | grep node
lsof -i :3000
```

## 📈 Application Performance Monitoring

### 1. Response Time Monitoring
```typescript
// lib/performanceMonitor.ts
export class PerformanceMonitor {
  private static metrics: Map<string, number[]> = new Map();

  static recordResponseTime(endpoint: string, duration: number) {
    if (!this.metrics.has(endpoint)) {
      this.metrics.set(endpoint, []);
    }
    
    const times = this.metrics.get(endpoint)!;
    times.push(duration);
    
    // Keep only last 100 measurements
    if (times.length > 100) {
      times.shift();
    }
    
    // Alert if average > 1000ms
    const average = times.reduce((a, b) => a + b, 0) / times.length;
    if (average > 1000) {
      this.sendAlert(`High response time for ${endpoint}: ${average}ms`);
    }
  }

  static getMetrics() {
    const result: Record<string, any> = {};
    
    for (const [endpoint, times] of this.metrics.entries()) {
      const average = times.reduce((a, b) => a + b, 0) / times.length;
      const max = Math.max(...times);
      const min = Math.min(...times);
      
      result[endpoint] = { average, max, min, count: times.length };
    }
    
    return result;
  }
}
```

### 2. Database Performance Monitoring
```sql
-- Monitor slow queries
SELECT query, mean_time, calls, total_time
FROM pg_stat_statements
WHERE mean_time > 100
ORDER BY mean_time DESC
LIMIT 10;

-- Monitor database connections
SELECT count(*) as active_connections
FROM pg_stat_activity
WHERE state = 'active';

-- Monitor table sizes
SELECT schemaname, tablename, 
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### 3. API Rate Limit Monitoring
```typescript
// lib/rateLimitMonitor.ts
export class RateLimitMonitor {
  private static binanceUsage = {
    weight: 0,
    orders: 0,
    lastReset: Date.now()
  };

  static updateUsage(weight: number, orders: number = 0) {
    const now = Date.now();
    
    // Reset counters every minute
    if (now - this.binanceUsage.lastReset > 60000) {
      this.binanceUsage.weight = 0;
      this.binanceUsage.orders = 0;
      this.binanceUsage.lastReset = now;
    }
    
    this.binanceUsage.weight += weight;
    this.binanceUsage.orders += orders;
    
    // Alert if approaching limits
    if (this.binanceUsage.weight > 1000) {
      console.warn(`High Binance API usage: ${this.binanceUsage.weight}/1200`);
    }
    
    if (this.binanceUsage.orders > 8) {
      console.warn(`High order rate: ${this.binanceUsage.orders}/10 per second`);
    }
  }

  static getUsage() {
    return { ...this.binanceUsage };
  }
}
```

## 🚨 Common Issues & Solutions

### 1. Application Won't Start
**Symptoms:**
- PM2 shows app as "errored" or "stopped"
- Port already in use errors
- Module not found errors

**Troubleshooting Steps:**
```bash
# Check if port is in use
sudo lsof -i :3000
sudo netstat -tulpn | grep :3000

# Kill process using port
sudo kill -9 $(sudo lsof -t -i:3000)

# Check application logs
pm2 logs ccxt-trading-app --lines 50

# Verify environment variables
cat .env.local
env | grep BINANCE
env | grep SUPABASE

# Check Node.js version
node --version  # Should be >= 20.0.0

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Rebuild application
npm run build
```

### 2. Database Connection Issues
**Symptoms:**
- "Connection refused" errors
- Slow database queries
- Authentication failures

**Troubleshooting Steps:**
```bash
# Test Supabase connection
curl -H "apikey: YOUR_ANON_KEY" \
     -H "Authorization: Bearer YOUR_ANON_KEY" \
     "https://YOUR_PROJECT.supabase.co/rest/v1/enhanced_trailing_positions?select=*&limit=1"

# Check environment variables
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY

# Test database connectivity
psql "postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"

# Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public';
```

### 3. Binance API Issues
**Symptoms:**
- API key errors
- Rate limit exceeded
- Invalid signature errors
- Network connectivity issues

**Troubleshooting Steps:**
```bash
# Test API connectivity
curl -X GET "https://api.binance.com/api/v3/ping"

# Test API key (testnet)
curl -X GET "https://testnet.binance.vision/api/v3/account" \
     -H "X-MBX-APIKEY: YOUR_API_KEY" \
     -d "timestamp=$(date +%s)000&signature=YOUR_SIGNATURE"

# Check API key permissions in Binance
# Go to Binance > API Management > Check permissions

# Verify system time synchronization
ntpdate -s time.nist.gov
timedatectl status

# Check rate limits
curl -X GET "https://api.binance.com/api/v3/exchangeInfo" | jq '.rateLimits'
```

### 4. WebSocket Connection Issues
**Symptoms:**
- WebSocket connection failures
- Real-time data not updating
- Connection timeouts

**Troubleshooting Steps:**
```bash
# Test WebSocket endpoint
wscat -c ws://localhost:3001/ws

# Check WebSocket server logs
pm2 logs ccxt-trading-app | grep WebSocket

# Test browser WebSocket connection
# Open browser console and run:
const ws = new WebSocket('ws://localhost:3001/ws');
ws.onopen = () => console.log('Connected');
ws.onerror = (error) => console.error('Error:', error);
ws.onmessage = (event) => console.log('Message:', event.data);

# Check firewall settings
sudo ufw status
sudo iptables -L

# Verify Nginx WebSocket proxy configuration
sudo nginx -t
sudo systemctl reload nginx
```

### 5. High Memory Usage
**Symptoms:**
- Application crashes with "out of memory" errors
- Slow performance
- System becomes unresponsive

**Troubleshooting Steps:**
```bash
# Check memory usage
free -h
ps aux --sort=-%mem | head -10

# Check Node.js heap usage
node --max-old-space-size=4096 server.js

# Monitor memory leaks
pm2 monit

# Analyze heap dump
node --inspect server.js
# Then use Chrome DevTools > Memory tab

# Restart application to clear memory
pm2 restart ccxt-trading-app
```

### 6. SSL Certificate Issues
**Symptoms:**
- HTTPS not working
- Certificate expired warnings
- Mixed content errors

**Troubleshooting Steps:**
```bash
# Check certificate status
openssl x509 -in /etc/letsencrypt/live/your-domain.com/fullchain.pem -text -noout

# Renew Let's Encrypt certificate
sudo certbot renew --dry-run
sudo certbot renew

# Test SSL configuration
curl -I https://your-domain.com
openssl s_client -connect your-domain.com:443

# Check Nginx SSL configuration
sudo nginx -t
sudo systemctl reload nginx
```

## 📊 Monitoring Dashboard Setup

### 1. Custom Monitoring Page
```typescript
// app/admin/monitoring/page.tsx
export default function MonitoringDashboard() {
  const [healthData, setHealthData] = useState(null);
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const [health, perf] = await Promise.all([
        fetch('/api/system-health').then(r => r.json()),
        fetch('/api/performance-metrics').then(r => r.json())
      ]);
      
      setHealthData(health);
      setMetrics(perf);
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // Update every 30s
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="monitoring-dashboard">
      <SystemHealthCard data={healthData} />
      <PerformanceMetrics data={metrics} />
      <AlertsPanel />
      <LogsViewer />
    </div>
  );
}
```

### 2. Automated Alerts
```typescript
// lib/alertManager.ts
export class AlertManager {
  private static alerts: Alert[] = [];

  static async checkSystemHealth() {
    const health = await fetch('/api/system-health').then(r => r.json());
    
    // Check critical metrics
    if (health.services.binance.status !== 'healthy') {
      this.sendAlert('CRITICAL', 'Binance API connection failed');
    }
    
    if (health.services.database.responseTime > 1000) {
      this.sendAlert('WARNING', `Database slow: ${health.services.database.responseTime}ms`);
    }
    
    if (health.services.system.memory > 90) {
      this.sendAlert('CRITICAL', `High memory usage: ${health.services.system.memory}%`);
    }
  }

  static async sendAlert(level: 'INFO' | 'WARNING' | 'CRITICAL', message: string) {
    const alert = {
      id: Date.now().toString(),
      level,
      message,
      timestamp: new Date().toISOString(),
      acknowledged: false
    };

    this.alerts.push(alert);
    
    // Send notifications
    if (level === 'CRITICAL') {
      await this.sendEmailAlert(alert);
      await this.sendSlackAlert(alert);
    }
    
    // Store in database
    await this.storeAlert(alert);
  }
}
```

## 🔧 Maintenance Procedures

### 1. Regular Maintenance Tasks
```bash
#!/bin/bash
# maintenance.sh - Run weekly

# Update system packages
sudo apt update && sudo apt upgrade -y

# Clean up logs
pm2 flush
sudo logrotate -f /etc/logrotate.conf

# Database maintenance
psql -c "VACUUM ANALYZE;"
psql -c "REINDEX DATABASE your_database;"

# Clear application cache
redis-cli FLUSHALL

# Restart services
pm2 restart all
sudo systemctl restart nginx

# Check disk space
df -h | awk '$5 > 80 {print "WARNING: " $0}'

# Backup database
pg_dump your_database > backup_$(date +%Y%m%d).sql
```

### 2. Emergency Recovery Procedures
```bash
#!/bin/bash
# emergency-recovery.sh

# Stop all services
pm2 stop all
sudo systemctl stop nginx

# Restore from backup
pg_restore -d your_database latest_backup.sql

# Reset application state
rm -rf .next/cache
npm run build

# Start services
pm2 start all
sudo systemctl start nginx

# Verify system health
curl -f http://localhost:3000/api/system-health || exit 1
```

---

**🚨 EMERGENCY CONTACTS:**
- **System Admin**: admin@your-domain.com
- **Database Admin**: dba@your-domain.com  
- **On-call Engineer**: +1-xxx-xxx-xxxx
- **Binance Support**: https://www.binance.com/en/support
- **Supabase Support**: https://supabase.com/support
