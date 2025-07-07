# 🔑 API Keys & External Services Configuration

## 📋 Tổng quan các dịch vụ bên ngoài

Ứng dụng CCXT Binance Trading App tích hợp với các dịch vụ bên ngoài sau:

### Core Services
- **Binance API**: Trading data, order execution, account information
- **Supabase**: Database, authentication, real-time subscriptions
- **WebSocket**: Real-time price updates và notifications

### Optional Services
- **Sentry**: Error tracking và monitoring
- **New Relic**: Application performance monitoring
- **Redis**: Caching layer (optional)
- **SendGrid**: Email notifications (optional)

## 🏦 Binance API Configuration

### 1. Account Setup
```bash
# Development (Testnet)
BINANCE_API_KEY=your_testnet_api_key
BINANCE_API_SECRET=your_testnet_secret
BINANCE_TESTNET=true
BINANCE_BASE_URL=https://testnet.binance.vision

# Production (Mainnet)
BINANCE_API_KEY=your_production_api_key
BINANCE_API_SECRET=your_production_secret
BINANCE_TESTNET=false
BINANCE_BASE_URL=https://api.binance.com
```

### 2. API Key Permissions
**Required Permissions:**
- ✅ **Read Info**: Để đọc account information
- ✅ **Enable Spot & Margin Trading**: Để thực hiện trades (nếu cần)

**Security Recommendations:**
- ❌ **NEVER enable Withdrawals**: Tránh rủi ro mất tiền
- ❌ **NEVER enable Internal Transfer**: Không cần thiết
- ✅ **Enable IP Whitelist**: Chỉ cho phép IP servers cụ thể
- ✅ **Set API Key Expiration**: Tự động expire sau thời gian nhất định

### 3. Rate Limits & Best Practices
```typescript
// lib/tradingApiService.ts configuration
const BINANCE_RATE_LIMITS = {
  // Weight-based limits
  REQUEST_WEIGHT_LIMIT: 1200,  // per minute
  ORDER_LIMIT: 10,             // per second
  RAW_REQUEST_LIMIT: 5000,     // per 5 minutes
  
  // Specific endpoint limits
  TICKER_24HR_LIMIT: 40,       // per 40 seconds
  KLINES_LIMIT: 1000,          // per minute
  DEPTH_LIMIT: 5000,           // per minute
};

// Implement exponential backoff
const retryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2
};
```

### 4. Error Handling
```typescript
// Common Binance API errors
const BINANCE_ERROR_CODES = {
  '-1021': 'Timestamp for this request is outside of the recvWindow',
  '-1022': 'Signature for this request is not valid',
  '-2010': 'NEW_ORDER_REJECTED',
  '-2011': 'CANCEL_REJECTED',
  '-1003': 'Too many requests; current limit is %s requests per minute',
  '-1015': 'Too many new orders; current limit is %s orders per %s'
};
```

## 🗄️ Supabase Configuration

### 1. Project Setup
```bash
# Environment Variables
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional: Custom domain
NEXT_PUBLIC_SUPABASE_URL=https://db.your-domain.com
```

### 2. Database Configuration
```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Configure timezone
SET timezone = 'UTC';

-- Performance settings
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET track_activity_query_size = 2048;
ALTER SYSTEM SET pg_stat_statements.track = 'all';
```

### 3. Connection Pooling
```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey, {
  db: {
    schema: 'public',
  },
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  global: {
    headers: {
      'x-application-name': 'ccxt-trading-app'
    }
  }
});
```

### 4. Row Level Security Policies
```sql
-- Enable RLS on all tables
ALTER TABLE enhanced_trailing_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_alerts ENABLE ROW LEVEL SECURITY;

-- User-specific access policies
CREATE POLICY "Users can access own data" ON enhanced_trailing_positions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can access own analytics" ON performance_analytics
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can access own alerts" ON market_alerts
  FOR ALL USING (auth.uid() = user_id);
```

## 🔔 Notification Services

### 1. WebSocket Configuration
```bash
# WebSocket Server Settings
WEBSOCKET_ENABLED=true
WEBSOCKET_PORT=3001
WEBSOCKET_HOST=0.0.0.0
WEBSOCKET_MAX_CONNECTIONS=1000
WEBSOCKET_HEARTBEAT_INTERVAL=30000
```

### 2. Browser Notifications
```typescript
// Request notification permission
const requestNotificationPermission = async () => {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
};

// Send browser notification
const sendBrowserNotification = (title: string, options: NotificationOptions) => {
  if (Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/favicon.ico',
      badge: '/badge-icon.png',
      ...options
    });
  }
};
```

### 3. Email Notifications (Optional)
```bash
# SendGrid Configuration
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@your-domain.com
SENDGRID_FROM_NAME="Trading App Notifications"

# SMTP Configuration (Alternative)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## 📊 Monitoring & Analytics

### 1. Sentry Error Tracking
```bash
# Sentry Configuration
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
SENTRY_ENVIRONMENT=production
SENTRY_RELEASE=1.0.0
SENTRY_SAMPLE_RATE=1.0
SENTRY_TRACES_SAMPLE_RATE=0.1
```

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.SENTRY_ENVIRONMENT,
  tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
  beforeSend(event) {
    // Filter out sensitive data
    if (event.request?.headers) {
      delete event.request.headers['authorization'];
      delete event.request.headers['x-api-key'];
    }
    return event;
  }
});
```

### 2. New Relic APM
```bash
# New Relic Configuration
NEW_RELIC_LICENSE_KEY=your_license_key
NEW_RELIC_APP_NAME="CCXT Trading App"
NEW_RELIC_LOG_LEVEL=info
NEW_RELIC_ENABLED=true
```

### 3. Custom Health Check Endpoint
```typescript
// app/api/health/route.ts
export async function GET() {
  const healthCheck = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    services: {
      database: await checkDatabaseHealth(),
      binance: await checkBinanceHealth(),
      websocket: await checkWebSocketHealth(),
      cache: await checkCacheHealth()
    }
  };

  const isHealthy = Object.values(healthCheck.services)
    .every(service => service.status === 'healthy');

  return Response.json(healthCheck, {
    status: isHealthy ? 200 : 503
  });
}
```

## 🔒 Security Best Practices

### 1. Environment Variables Security
```bash
# Use secrets management
# AWS Secrets Manager
aws secretsmanager create-secret \
  --name "prod/ccxt-app/binance-api" \
  --description "Binance API credentials" \
  --secret-string '{"api_key":"xxx","api_secret":"xxx"}'

# Azure Key Vault
az keyvault secret set \
  --vault-name "ccxt-app-vault" \
  --name "binance-api-key" \
  --value "your-api-key"

# Google Secret Manager
gcloud secrets create binance-api-key --data-file=api-key.txt
```

### 2. API Key Rotation
```typescript
// Implement API key rotation
const rotateApiKeys = async () => {
  // 1. Generate new API key pair
  // 2. Update environment variables
  // 3. Test new keys
  // 4. Deactivate old keys
  // 5. Update monitoring alerts
};

// Schedule rotation every 90 days
const scheduleKeyRotation = () => {
  setInterval(rotateApiKeys, 90 * 24 * 60 * 60 * 1000);
};
```

### 3. Rate Limiting & DDoS Protection
```typescript
// Implement rate limiting
import rateLimit from 'express-rate-limit';

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
});

const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // limit each IP to 5 requests per windowMs
  skipSuccessfulRequests: true,
});
```

## 🚨 Emergency Procedures

### 1. API Key Compromise
```bash
# Immediate actions
1. Disable compromised API keys in Binance
2. Generate new API key pair
3. Update production environment variables
4. Restart application services
5. Monitor for suspicious activity
6. Review access logs
7. Update security incident log
```

### 2. Service Outage Response
```bash
# Binance API outage
1. Switch to backup exchange (if configured)
2. Enable maintenance mode
3. Notify users via status page
4. Monitor Binance status page
5. Resume normal operations when stable

# Database outage
1. Enable read-only mode
2. Use cached data where possible
3. Queue write operations
4. Restore from backup if needed
5. Verify data integrity after recovery
```

### 3. Security Incident Response
```bash
# Security breach detection
1. Immediately disable all API access
2. Isolate affected systems
3. Preserve logs and evidence
4. Notify stakeholders
5. Conduct forensic analysis
6. Implement additional security measures
7. Document lessons learned
```

---

**⚠️ CRITICAL SECURITY REMINDERS:**
- Never store API keys in code or version control
- Use different API keys for development/staging/production
- Regularly rotate API keys và passwords
- Monitor API usage và unusual activity
- Implement proper logging without exposing sensitive data
- Use HTTPS for all external communications
- Enable 2FA on all service accounts
