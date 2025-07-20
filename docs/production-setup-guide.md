# 🚀 Production Setup Guide - CCXT Binance Trading App

## 📋 Tổng quan hệ thống

### Kiến trúc ứng dụng
- **Framework**: Next.js 15.2.4 với App Router
- **Runtime**: Node.js ^18.18.0 || ^19.8.0 || >= 20.0.0
- **UI Framework**: Ant Design 5.26.3 + Tailwind CSS 4
- **Database**: Supabase (PostgreSQL)
- **Trading API**: CCXT 4.4.69 (Binance integration)
- **Charts**: LightWeight Charts 5.0.8
- **Real-time**: WebSocket connections
- **Language**: TypeScript 5

### Core Services
- **TradingApiService**: Binance API integration với caching
- **NotificationService**: Real-time notifications với WebSocket
- **EnhancedTrailingStopService**: Advanced trading strategies
- **MarketAnalysisService**: Technical analysis và market alerts
- **RiskManagementService**: Position sizing và risk controls

## 🖥️ Server Requirements

### Minimum Requirements
- **CPU**: 2 cores, 2.4GHz
- **RAM**: 4GB (8GB recommended)
- **Storage**: 20GB SSD
- **Network**: Stable internet với low latency đến Binance API
- **OS**: Ubuntu 20.04+ / CentOS 8+ / Windows Server 2019+

### Recommended Production Requirements
- **CPU**: 4+ cores, 3.0GHz+
- **RAM**: 8GB+ (16GB for high-frequency trading)
- **Storage**: 50GB+ SSD với backup
- **Network**: Dedicated connection, <50ms latency đến Binance
- **Load Balancer**: Nginx hoặc similar
- **Monitoring**: PM2, New Relic, hoặc DataDog

## 🔧 Installation Steps

### 1. System Preparation
```bash
# Ubuntu/Debian
sudo apt update && sudo apt upgrade -y
sudo apt install -y nodejs npm git nginx certbot python3-certbot-nginx

# CentOS/RHEL
sudo yum update -y
sudo yum install -y nodejs npm git nginx certbot python3-certbot-nginx

# Verify Node.js version
node --version  # Should be >= 20.0.0
npm --version
```

### 2. Application Deployment
```bash
# Clone repository
git clone https://github.com/your-repo/ccxt-binance-app.git
cd ccxt-binance-app

# Install dependencies
npm ci --production

# Build application
npm run build

# Test build
npm run start
```

### 3. Process Management với PM2
```bash
# Install PM2 globally
npm install -g pm2

# Create ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'ccxt-trading-app',
    script: 'npm',
    args: 'start',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=4096'
  }]
}
EOF

# Start application
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## 🔐 Environment Variables

### Required Environment Variables
```bash
# Create production .env file
cat > .env.production << EOF
# Application
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Binance API (PRODUCTION - USE WITH CAUTION)
BINANCE_API_KEY=your_production_binance_api_key
BINANCE_API_SECRET=your_production_binance_secret
BINANCE_TESTNET=false  # Set to false for production

# Supabase Database
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Security
NEXTAUTH_SECRET=your_nextauth_secret_key
NEXTAUTH_URL=https://your-domain.com

# Monitoring & Logging
LOG_LEVEL=info
SENTRY_DSN=your_sentry_dsn
NEW_RELIC_LICENSE_KEY=your_newrelic_key

# WebSocket
WEBSOCKET_PORT=3001
WEBSOCKET_ENABLED=true

# Rate Limiting
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=60000

# Cache Configuration
REDIS_URL=redis://localhost:6379
CACHE_TTL=300
EOF
```

### Security Best Practices
```bash
# Set proper file permissions
chmod 600 .env.production
chown app:app .env.production

# Use environment-specific configs
ln -sf .env.production .env.local
```

## 🗄️ Database Configuration

### Supabase Setup
1. **Create Supabase Project**
   - Go to https://supabase.com
   - Create new project
   - Note down URL và anon key

2. **Database Schema**
```sql
-- Enhanced Trailing Stop Positions
CREATE TABLE enhanced_trailing_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  symbol VARCHAR(20) NOT NULL,
  side VARCHAR(4) NOT NULL CHECK (side IN ('buy', 'sell')),
  quantity DECIMAL(20, 8) NOT NULL,
  entry_price DECIMAL(20, 8) NOT NULL,
  current_price DECIMAL(20, 8) NOT NULL,
  stop_price DECIMAL(20, 8) NOT NULL,
  
  -- Strategy Configuration
  strategy VARCHAR(20) NOT NULL DEFAULT 'percentage',
  strategy_params JSONB NOT NULL DEFAULT '{}',
  
  -- Risk Management
  max_loss_percent DECIMAL(5, 2) NOT NULL DEFAULT 5.0,
  position_size_method VARCHAR(20) DEFAULT 'fixed',
  
  -- Status & Timestamps
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Performance Tracking
  unrealized_pnl DECIMAL(20, 8) DEFAULT 0,
  max_profit DECIMAL(20, 8) DEFAULT 0,
  max_drawdown DECIMAL(20, 8) DEFAULT 0
);

-- Performance Analytics
CREATE TABLE performance_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  symbol VARCHAR(20) NOT NULL,
  strategy VARCHAR(20) NOT NULL,
  timeframe VARCHAR(10) NOT NULL,
  
  -- Performance Metrics
  total_trades INTEGER DEFAULT 0,
  winning_trades INTEGER DEFAULT 0,
  losing_trades INTEGER DEFAULT 0,
  win_rate DECIMAL(5, 2) DEFAULT 0,
  
  -- P&L Metrics
  total_pnl DECIMAL(20, 8) DEFAULT 0,
  avg_win DECIMAL(20, 8) DEFAULT 0,
  avg_loss DECIMAL(20, 8) DEFAULT 0,
  max_drawdown DECIMAL(20, 8) DEFAULT 0,
  
  -- Risk Metrics
  sharpe_ratio DECIMAL(10, 4) DEFAULT 0,
  sortino_ratio DECIMAL(10, 4) DEFAULT 0,
  calmar_ratio DECIMAL(10, 4) DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Market Alerts
CREATE TABLE market_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  symbol VARCHAR(20) NOT NULL,
  alert_type VARCHAR(50) NOT NULL,
  condition_type VARCHAR(20) NOT NULL,
  target_value DECIMAL(20, 8) NOT NULL,
  current_value DECIMAL(20, 8),
  
  -- Alert Configuration
  is_active BOOLEAN DEFAULT true,
  is_triggered BOOLEAN DEFAULT false,
  trigger_count INTEGER DEFAULT 0,
  max_triggers INTEGER DEFAULT 1,
  
  -- Notification Settings
  notification_methods JSONB DEFAULT '["browser", "email"]',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  triggered_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance
CREATE INDEX idx_positions_user_symbol ON enhanced_trailing_positions(user_id, symbol);
CREATE INDEX idx_positions_status ON enhanced_trailing_positions(status);
CREATE INDEX idx_analytics_user_strategy ON performance_analytics(user_id, strategy);
CREATE INDEX idx_alerts_user_active ON market_alerts(user_id, is_active);
```

3. **Row Level Security (RLS)**
```sql
-- Enable RLS
ALTER TABLE enhanced_trailing_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_alerts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own positions" ON enhanced_trailing_positions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own positions" ON enhanced_trailing_positions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own positions" ON enhanced_trailing_positions
  FOR UPDATE USING (auth.uid() = user_id);

-- Similar policies for other tables...
```

## 🔑 API Keys Configuration

### Binance API Setup
1. **Create Binance Account**
   - Go to https://www.binance.com
   - Complete KYC verification
   - Enable 2FA

2. **Generate API Keys**
   - Go to API Management
   - Create new API key
   - **IMPORTANT**: Enable only necessary permissions:
     - ✅ Read Info
     - ✅ Enable Spot & Margin Trading (if needed)
     - ❌ Enable Withdrawals (NEVER enable for trading bots)
     - ❌ Enable Internal Transfer

3. **IP Whitelist**
   - Add your production server IP
   - Use specific IPs, avoid 0.0.0.0/0

### Security Considerations
```bash
# Store API keys securely
# Use AWS Secrets Manager, Azure Key Vault, or similar
export BINANCE_API_KEY=$(aws secretsmanager get-secret-value --secret-id prod/binance/api-key --query SecretString --output text)
export BINANCE_API_SECRET=$(aws secretsmanager get-secret-value --secret-id prod/binance/api-secret --query SecretString --output text)
```

## 🌐 Nginx Configuration

### Basic Nginx Setup
```nginx
# /etc/nginx/sites-available/ccxt-trading-app
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;

    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=1r/s;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # WebSocket Support
    location /ws {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API Rate Limiting
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://localhost:3000;
        # ... other proxy settings
    }

    # Static Assets Caching
    location /_next/static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        proxy_pass http://localhost:3000;
    }
}
```

### Enable Site
```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/ccxt-trading-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Get SSL Certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

---

**⚠️ PRODUCTION WARNINGS:**
- Always use HTTPS in production
- Never commit API keys to version control
- Enable proper monitoring và alerting
- Regular backup database và configurations
- Test disaster recovery procedures
- Monitor API rate limits và costs
- Use proper logging và error tracking
