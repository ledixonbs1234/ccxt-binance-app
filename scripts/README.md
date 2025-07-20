# Scripts Directory

Thư mục này chứa tất cả các script test và utility cho ứng dụng trading.

## 📁 Cấu trúc File

### 🧪 Test Scripts
- `test-api-error-handling.js` - Test comprehensive API error handling với circuit breaker và retry logic
- `test-api-integration.js` - Test tích hợp API thực tế với trading services
- `test-bullmq-system.js` - Test hệ thống BullMQ cho trailing stop management
- `test-percentage-fix.js` - Test phần trăm thay đổi giá đã được sửa
- `final-percentage-test.js` - Test cuối cùng xác nhận lỗi percentage đã được sửa hoàn toàn
- `test-pepe-formatting.js` - Test formatting functions cho PEPE và micro-cap tokens
- `test-pepe-comprehensive.js` - Test comprehensive cho PEPE precision và formatting
- `test-microcap-utils.js` - Test utilities cho micro-cap token handling
- `test-unique-ids.js` - Test unique ID generation functions

### 🔧 Utility Scripts
- `setup-database.js` - Script setup database schema và health checking
- `test-historical-data.js` - Test historical data service
- `test-historical-data-large.js` - Test với large dataset
- `test-redis-connection.js` - Test Redis connection cho BullMQ
- `test-backtesting-engine.js` - Test backtesting engine functionality

## 🚀 Cách sử dụng

### Chạy Test Scripts
```bash
# Test API error handling
node scripts/test-api-error-handling.js

# Test percentage fix
node scripts/test-percentage-fix.js

# Test PEPE formatting
node scripts/test-pepe-formatting.js

# Test database setup
node scripts/setup-database.js --setup
```

### Chạy Database Setup
```bash
# Setup database schema
node scripts/setup-database.js --setup

# Check database health
node scripts/setup-database.js --health
```

## 📋 Yêu cầu

- Node.js 18+ (để sử dụng built-in fetch)
- Server chạy trên localhost:3000 (cho API tests)
- Redis server (cho BullMQ tests)
- Supabase connection (cho database tests)

## 🔍 Test Categories

### API Tests
- Error handling và retry mechanisms
- Circuit breaker patterns
- Rate limiting protection
- Real-time data integration

### Database Tests
- Performance optimization
- Query efficiency
- Connection pooling
- Cache strategies

### Trading Logic Tests
- Price formatting cho micro-cap tokens
- Percentage change calculations
- Trailing stop functionality
- Position management

### System Tests
- BullMQ queue system
- Redis connectivity
- Historical data processing
- Backtesting engine

## 📝 Notes

- Tất cả test scripts sử dụng built-in fetch của Node.js 18+
- Import paths đã được cập nhật để phù hợp với cấu trúc thư mục mới
- Scripts có thể chạy độc lập hoặc trong CI/CD pipeline
- Kết quả test được format với emoji và màu sắc để dễ đọc
