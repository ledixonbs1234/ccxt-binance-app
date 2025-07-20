# 🚀 Quick Start Guide - Advanced Trailing Stop

## ⚡ Khởi Động Nhanh

### 1. Chạy Server
```bash
npm run dev
# Server sẽ chạy tại: http://localhost:3000
```

### 2. Truy Cập Trang Demo
```
URL: http://localhost:3000/advanced-trailing-stop
```

### 3. Test Nhanh
```bash
# Kiểm tra hệ thống
node test-advanced-trailing-stop.js

# Kết quả mong đợi:
✅ All tests passed
✅ Database working
✅ API endpoints functional
```

---

## 🎯 Test Cases Cơ Bản

### Test Case 1: Mua Ngay Lập Tức
1. **Chọn**: Symbol = `BTC/USDT`, Strategy = `Percentage`
2. **Click**: `Demo Position`
3. **Kết quả**: Position với status `Active`, bắt đầu trailing ngay

### Test Case 2: Activation Price  
1. **Chọn**: Symbol = `ETH/USDT`, Strategy = `ATR`
2. **Set**: Activation price cao hơn giá hiện tại 5%
3. **Click**: `Create Position`
4. **Kết quả**: Position với status `Pending Activation`

---

## 📊 11 Strategies Có Sẵn

| Strategy | Độ Khó | Risk | Mô Tả |
|----------|--------|------|-------|
| **Percentage** | Beginner | Low | Trailing % cố định |
| **ATR** | Intermediate | Medium | Dựa trên volatility |
| **Fibonacci** | Advanced | Medium | Fibonacci retracement |
| **Bollinger** | Intermediate | Medium | Bollinger Bands |
| **Volume Profile** | Expert | High | Volume analysis |
| **Smart Money** | Expert | High | ICT concepts |
| **Ichimoku** | Advanced | Medium | Japanese system |
| **Pivot Points** | Intermediate | Medium | Support/Resistance |
| **Support/Resistance** | Intermediate | Medium | Key levels |
| **Dynamic** | Advanced | High | Multi-indicator |
| **Hybrid** | Expert | High | AI-optimized |

---

## 🔧 Troubleshooting Nhanh

### Lỗi Database
```bash
# Fix database schema
node apply-database-fix.js
```

### Lỗi Server
```bash
# Kiểm tra port 3000
netstat -ano | findstr :3000
# Kill process nếu cần
taskkill /PID [PID_NUMBER] /F
```

### Lỗi API
```bash
# Test endpoints
node test-web-interface.js
```

---

## 📱 Giao Diện Chính

```
┌─────────────────────────────────────────────────────────────┐
│ 📈 Trailing Stop Nâng Cao    🟢 Active: 2    💰 P&L: +$125 │
├─────────────────────────────────────────────────────────────┤
│ Configuration Panel        │  Real-time Alerts              │
│ • Symbol: BTC/USDT         │  🔔 Position created           │
│ • Strategy: Percentage     │  ⚠️  Price movement            │
│ • Trailing %: 5.0          │  ✅ Profit target hit          │
│ [Create] [Demo] [Stop]     │                                │
├─────────────────────────────────────────────────────────────┤
│ Active Positions                                            │
│ 🟢 BTC/USDT • +5.0% • $52,500 → Stop: $49,875            │
│ 🟡 ETH/USDT • Pending • Waiting for $3,150               │
├─────────────────────────────────────────────────────────────┤
│ 📊 Price Chart with Trailing Stops                         │
│ [Candlestick chart with entry/stop/profit zones]           │
└─────────────────────────────────────────────────────────────┘
```

---

## 💡 Best Practices

### Cho Người Mới
- ✅ Bắt đầu với `Demo Position`
- ✅ Sử dụng `Percentage` strategy
- ✅ Trailing %: 3-7%, Max Loss: 5-10%
- ✅ Quan sát ít nhất 1 giờ trước khi dùng real

### Cho Trader Có Kinh Nghiệm  
- ✅ Thử `ATR` hoặc `Fibonacci` strategies
- ✅ Combine multiple strategies
- ✅ Monitor performance metrics
- ✅ Adjust parameters theo market conditions

---

## 📞 Hỗ Trợ

### Tài Liệu Chi Tiết
📖 **Full Guide**: `docs/ADVANCED_TRAILING_STOP_GUIDE.md`

### Test Scripts
🧪 **Comprehensive Test**: `node test-advanced-trailing-stop.js`
🔧 **Database Fix**: `node apply-database-fix.js`
🌐 **Web Interface Test**: `node test-web-interface.js`

### URLs Quan Trọng
- 🏠 **Main**: http://localhost:3000
- 📈 **Advanced Demo**: http://localhost:3000/advanced-trailing-stop
- 🚀 **Enhanced Demo**: http://localhost:3000/enhanced-trailing-stop
- 📊 **Strategy Chart**: http://localhost:3000/strategy-chart-demo

---

**🎉 Happy Trading! 🚀**
