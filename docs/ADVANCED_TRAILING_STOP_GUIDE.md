# 📈 Hướng Dẫn Chi Tiết - Advanced Trailing Stop

## 🎯 Tổng Quan

Trang **Advanced Trailing Stop** là công cụ trading nâng cao cho phép bạn tạo và quản lý các vị thế trailing stop với nhiều chiến lược khác nhau. Đây là hệ thống tự động giúp bảo vệ lợi nhuận và giảm thiểu rủi ro trong giao dịch cryptocurrency.

**URL Truy Cập**: http://localhost:3000/advanced-trailing-stop

---

## 🚀 1. Hướng Dẫn Sử Dụng Giao Diện

### 1.1 Truy Cập và Điều Hướng

1. **Khởi động server**:
   ```bash
   npm run dev
   ```

2. **Truy cập trang**:
   - Mở trình duyệt và vào: http://localhost:3000/advanced-trailing-stop
   - Trang sẽ tự động load với giao diện trading nâng cao

3. **Kiểm tra kết nối**:
   - Đảm bảo có kết nối internet để lấy dữ liệu giá real-time
   - Kiểm tra database connection (Supabase)

### 1.2 Các Thành Phần UI Chính

#### A. **Header Panel - Thông Tin Tổng Quan**
- **Trailing Stop Nâng Cao**: Tiêu đề chính
- **Badge "Đang Hoạt Động"**: Hiển thị số lượng positions đang active
- **Total P&L**: Tổng lợi nhuận/lỗ của tất cả positions

#### B. **Strategy Configuration Panel** (Bên trái)
- **Symbol Selector**: Chọn cặp trading (BTC/USDT, ETH/USDT, PEPE/USDT)
- **Strategy Selector**: Dropdown chọn chiến lược trailing stop
- **Strategy Config Panel**: Cấu hình chi tiết cho từng strategy
- **Action Buttons**:
  - `Create Position`: Tạo position thực tế
  - `Demo Position`: Tạo position demo để test
  - `Stop Demo`: Dừng position demo

#### C. **Real-time Alerts Panel** (Bên phải)
- **Alert Counter**: Badge hiển thị số lượng alerts
- **Alert List**: Danh sách thông báo real-time
- **Alert Types**:
  - 🟢 Success (activation, profit taking)
  - 🟡 Warning (price movements)
  - 🔴 Error (system issues)

#### D. **Positions Panel** (Giữa trang)
- **Active Positions**: Danh sách positions đang hoạt động
- **Position Details**: Thông tin chi tiết từng position
- **Performance Metrics**: Các chỉ số hiệu suất

#### E. **Price Chart Panel** (Dưới cùng)
- **Candlestick Chart**: Biểu đồ nến với trailing stops
- **Entry/Stop/Profit Zones**: Các vùng giá quan trọng
- **Real-time Updates**: Cập nhật theo thời gian thực

### 1.3 Cách Tạo Trailing Stop Position Mới

#### **Bước 1: Cấu Hình Cơ Bản**
1. **Chọn Symbol**:
   - Click dropdown "Symbol"
   - Chọn cặp trading (ví dụ: BTC/USDT)

2. **Chọn Strategy**:
   - Click dropdown "Strategy"
   - Chọn một trong 11 strategies có sẵn
   - Xem chi tiết strategy trong phần mô tả

3. **Cấu Hình Strategy**:
   - Điều chỉnh các tham số trong "Strategy Config Panel"
   - Mỗi strategy có các tham số riêng

#### **Bước 2: Tạo Position**
1. **Demo Position** (Khuyến nghị cho người mới):
   ```
   Click "Demo Position" → Hệ thống tạo position demo
   → Theo dõi kết quả trong Alerts Panel
   → Kiểm tra performance trong Positions Panel
   ```

2. **Real Position** (Cho người có kinh nghiệm):
   ```
   Click "Create Position" → Hệ thống tạo position thực tế
   → Position được lưu vào database
   → Bắt đầu monitoring tự động
   ```

### 1.4 Theo Dõi và Quản Lý Positions

#### **A. Monitoring Real-time**
- **Alerts Panel**: Theo dõi thông báo liên tục
- **Position Status**: Kiểm tra trạng thái positions
- **P&L Updates**: Xem lợi nhuận/lỗ real-time

#### **B. Position Management**
- **View Details**: Click vào position để xem chi tiết
- **Stop Position**: Sử dụng nút "Stop Demo" hoặc remove position
- **Performance Analysis**: Xem metrics trong Performance tab

---

## 📊 2. Chi Tiết Các Chiến Lược Trailing Stop

### 2.1 **Percentage-based Strategy**
**Độ phức tạp**: Beginner | **Risk**: Low

**Mô tả**: Chiến lược cơ bản sử dụng phần trăm cố định để trailing stop.

**Cách hoạt động**:
- Đặt stop loss ở khoảng cách % cố định từ giá cao nhất
- Khi giá tăng, stop loss tự động điều chỉnh theo
- Khi giá giảm về mức stop loss → Trigger bán

**Tham số cấu hình**:
- `trailingPercent`: 2-10% (khuyến nghị: 5%)
- `maxLossPercent`: 3-15% (khuyến nghị: 10%)

**Ví dụ thực tế**:
```
Entry Price: $50,000 (BTC)
Trailing Percent: 5%
→ Stop Loss ban đầu: $47,500

Giá tăng lên $55,000
→ Stop Loss điều chỉnh: $52,250

Giá giảm về $52,250 → Trigger bán
```

**Phù hợp**: Người mới bắt đầu, thị trường ít biến động

### 2.2 **ATR (Average True Range) Strategy**
**Độ phức tạp**: Intermediate | **Risk**: Medium

**Mô tả**: Sử dụng ATR để tính toán khoảng cách stop loss dựa trên volatility.

**Cách hoạt động**:
- Tính ATR trong N periods (thường 14)
- Stop loss = Current Price - (ATR × Multiplier)
- Tự động điều chỉnh theo volatility thị trường

**Tham số cấu hình**:
- `atrPeriod`: 10-20 (khuyến nghị: 14)
- `atrMultiplier`: 1.5-3.0 (khuyến nghị: 2.0)
- `maxLossPercent`: 5-20%

**Ví dụ thực tế**:
```
BTC Price: $50,000
ATR(14): $2,000
Multiplier: 2.0
→ Stop Loss: $50,000 - ($2,000 × 2) = $46,000

Khi volatility tăng → ATR tăng → Stop loss xa hơn
Khi volatility giảm → ATR giảm → Stop loss gần hơn
```

**Phù hợp**: Thị trường có volatility cao, traders có kinh nghiệm

### 2.3 **Fibonacci Retracement Strategy**
**Độ phức tạp**: Advanced | **Risk**: Medium

**Mô tả**: Sử dụng các mức Fibonacci để đặt stop loss và take profit.

**Cách hoạt động**:
- Xác định swing high và swing low
- Tính các mức Fibonacci: 23.6%, 38.2%, 50%, 61.8%, 78.6%
- Đặt stop loss tại các mức support/resistance Fibonacci

**Tham số cấu hình**:
- `fibLevel`: 0.236, 0.382, 0.5, 0.618, 0.786
- `lookbackPeriods`: 20-50 (khuyến nghị: 30)
- `sensitivity`: 0.5-2.0

**Ví dụ thực tế**:
```
Swing Low: $45,000
Swing High: $55,000
Range: $10,000

Fibonacci Levels:
- 23.6%: $52,640
- 38.2%: $51,180  ← Stop Loss Level
- 50.0%: $50,000
- 61.8%: $48,820
```

**Phù hợp**: Technical analysis traders, thị trường trending

### 2.4 **Bollinger Bands Strategy**
**Độ phức tạp**: Intermediate | **Risk**: Medium

**Mô tả**: Sử dụng Bollinger Bands để xác định volatility và đặt stop loss.

**Cách hoạt động**:
- Tính Moving Average và Standard Deviation
- Upper Band = MA + (2 × StdDev)
- Lower Band = MA - (2 × StdDev)
- Stop loss điều chỉnh theo width của bands

**Tham số cấu hình**:
- `period`: 15-25 (khuyến nghị: 20)
- `stdDev`: 1.5-2.5 (khuyến nghị: 2.0)
- `bandPosition`: 0.1-0.9 (vị trí trong band)

**Ví dụ thực tế**:
```
MA(20): $50,000
StdDev: $1,500
Upper Band: $53,000
Lower Band: $47,000

Stop Loss = Lower Band + (Band Width × 0.3)
= $47,000 + ($6,000 × 0.3) = $48,800
```

**Phù hợp**: Range trading, thị trường sideway

### 2.5 **Volume Profile Strategy**
**Độ phức tạp**: Expert | **Risk**: High

**Mô tả**: Sử dụng volume profile để xác định các mức giá quan trọng.

**Cách hoạt động**:
- Phân tích volume tại các mức giá khác nhau
- Xác định Point of Control (POC) - mức giá có volume cao nhất
- Đặt stop loss tại các mức low volume (weak support)

**Tham số cấu hình**:
- `volumeLookback`: 50-200 periods
- `pocSensitivity`: 0.1-1.0
- `volumeThreshold`: 0.5-2.0

**Ví dụ thực tế**:
```
POC Level: $51,000 (High Volume)
Low Volume Area: $48,500-$49,000
→ Stop Loss: $48,500 (dưới low volume area)

Khi giá về vùng low volume → Khả năng cao sẽ break through
```

**Phù hợp**: Professional traders, thị trường có volume data chính xác

### 2.6 **Smart Money Concepts Strategy**
**Độ phức tạp**: Expert | **Risk**: High

**Mô tả**: Dựa trên lý thuyết Smart Money để xác định liquidity zones và stop loss.

**Cách hoạt động**:
- Xác định Order Blocks (OB) và Fair Value Gaps (FVG)
- Tìm Break of Structure (BOS) và Change of Character (CHoCH)
- Đặt stop loss tại các liquidity zones

**Tham số cấu hình**:
- `orderBlockLookback`: 20-50
- `fvgSensitivity`: 0.1-0.5
- `liquidityThreshold`: 1.0-3.0

**Phù hợp**: ICT traders, institutional trading style

### 2.7 **Ichimoku Strategy**
**Độ phức tạp**: Advanced | **Risk**: Medium

**Mô tả**: Sử dụng Ichimoku Cloud để xác định trend và support/resistance.

**Cách hoạt động**:
- Tính Tenkan-sen, Kijun-sen, Senkou Span A/B
- Stop loss dựa trên cloud support/resistance
- Điều chỉnh theo cloud thickness

**Tham số cấu hình**:
- `tenkanPeriod`: 9
- `kijunPeriod`: 26
- `senkouPeriod`: 52

**Phù hợp**: Trend following, Japanese trading style

### 2.8 **Pivot Points Strategy**
**Độ phức tạp**: Intermediate | **Risk**: Medium

**Mô tả**: Sử dụng pivot points để xác định support/resistance levels.

**Cách hoạt động**:
- Tính Pivot Point = (High + Low + Close) / 3
- Support/Resistance levels: S1, S2, R1, R2
- Stop loss tại các pivot levels

**Tham số cấu hình**:
- `pivotType`: 'standard', 'fibonacci', 'camarilla'
- `timeframe`: 'daily', 'weekly', 'monthly'

**Phù hợp**: Day trading, scalping

### 2.9 **Support/Resistance Strategy**
**Độ phức tạp**: Intermediate | **Risk**: Medium

**Mô tả**: Xác định các mức support/resistance quan trọng để đặt stop loss.

**Cách hoạt động**:
- Tìm các mức giá được test nhiều lần
- Đặt stop loss dưới support hoặc trên resistance
- Điều chỉnh theo strength của level

**Tham số cấu hình**:
- `lookbackPeriods`: 50-200
- `minTouches`: 2-5
- `strengthThreshold`: 0.5-2.0

**Phù hợp**: Swing trading, position trading

### 2.10 **Dynamic Strategy**
**Độ phức tạp**: Advanced | **Risk**: High

**Mô tả**: Kết hợp nhiều indicators để tạo stop loss động.

**Cách hoạt động**:
- Sử dụng RSI, MACD, Stochastic
- Điều chỉnh stop loss theo momentum
- Adaptive theo market conditions

**Tham số cấu hình**:
- `rsiPeriod`: 14
- `macdFast`: 12, `macdSlow`: 26
- `adaptiveMultiplier`: 0.5-2.0

**Phù hợp**: Algorithmic trading, experienced traders

### 2.11 **Hybrid Multi-Strategy**
**Độ phức tạp**: Expert | **Risk**: High

**Mô tả**: Kết hợp nhiều strategies để tối ưu hóa performance.

**Cách hoạt động**:
- Chạy song song nhiều strategies
- Weighted average của các signals
- Machine learning optimization

**Tham số cấu hình**:
- `strategies`: Array of strategies
- `weights`: Trọng số cho từng strategy
- `optimizationPeriod`: 100-500

**Phù hợp**: Institutional trading, AI-driven systems

---

## 🧪 3. Hướng Dẫn Thực Hành

### 3.1 Test Case 1: Mua Ngay Lập Tức (Immediate Buy)

#### **Mục tiêu**: Tạo position mua ngay lập tức không cần activation price

#### **Các bước thực hiện**:

1. **Chuẩn bị**:
   ```bash
   # Đảm bảo server đang chạy
   npm run dev
   # Truy cập: http://localhost:3000/advanced-trailing-stop
   ```

2. **Cấu hình Position**:
   - **Symbol**: Chọn `BTC/USDT`
   - **Strategy**: Chọn `Percentage-based` (dễ nhất cho người mới)
   - **Trailing Percent**: Để mặc định `5%`

3. **Tạo Demo Position**:
   ```
   Click "Demo Position" button
   → Hệ thống tự động:
     - Lấy giá BTC hiện tại
     - Tạo position với entry price = current price
     - Không có activation price (mua ngay)
     - Bắt đầu trailing stop monitoring
   ```

4. **Kiểm tra kết quả**:
   - **Alerts Panel**: Sẽ hiện thông báo "New percentage position created for BTC"
   - **Positions Panel**: Hiển thị position mới với status "Active"
   - **Chart**: Hiển thị entry point và trailing stop line

#### **Kết quả mong đợi**:
```
✅ Position được tạo thành công
✅ Status: "Active" (không phải "Pending Activation")
✅ Entry Price = Current Market Price
✅ Trailing Stop bắt đầu hoạt động ngay lập tức
✅ Real-time updates trong Alerts Panel
```

### 3.2 Test Case 2: Position với Activation Price

#### **Mục tiêu**: Tạo position chờ activation khi giá đạt mức nhất định

#### **Các bước thực hiện**:

1. **Cấu hình Advanced Position**:
   - **Symbol**: Chọn `ETH/USDT`
   - **Strategy**: Chọn `ATR Strategy` (phức tạp hơn)
   - **ATR Period**: `14`
   - **ATR Multiplier**: `2.0`

2. **Tạo Position với Activation Price**:
   ```javascript
   // Trong Strategy Config Panel, set:
   activationPrice: currentPrice * 1.05  // 5% cao hơn giá hiện tại
   ```

3. **Tạo Real Position**:
   ```
   Click "Create Position" button
   → Hệ thống:
     - Tạo position với status "Pending Activation"
     - Lưu vào database với activation price
     - Bắt đầu monitoring giá để trigger activation
   ```

4. **Monitoring Process**:
   - Position ở trạng thái "Pending Activation"
   - Hệ thống liên tục check giá ETH
   - Khi giá >= activation price → Chuyển sang "Active"

#### **Kết quả mong đợi**:
```
✅ Position tạo với status "Pending Activation"
✅ Activation Price được set đúng
✅ Hệ thống monitoring giá real-time
✅ Khi giá đạt activation → Status chuyển "Active"
✅ Trailing stop bắt đầu hoạt động sau activation
```

### 3.3 Kiểm Tra Kết Quả trong TrailingStopMonitor

#### **Truy cập Monitor**:
1. **Trang chính**: http://localhost:3000
2. **Click tab "Trading"**
3. **Tìm section "Trailing Stop Monitor"**

#### **Thông tin hiển thị**:
- **Active Positions**: Danh sách positions đang hoạt động
- **Position Details**:
  - Symbol, Entry Price, Current Price
  - Trailing Percent, Stop Price
  - P&L (Profit/Loss) real-time
  - Status và thời gian tạo

#### **Real-time Updates**:
- Giá cập nhật mỗi 5 giây
- Stop price tự động điều chỉnh
- P&L thay đổi theo giá thị trường
- Alerts khi có thay đổi quan trọng

### 3.4 Đọc và Hiểu Console Logs

#### **Các loại logs quan trọng**:

1. **Database Operations**:
   ```
   [TrailingStopState] Successfully loaded 2 simulations from Supabase
   [TrailingStopState] Error upserting state for BTC_TRAILING_123: ...
   ```

2. **Price Updates**:
   ```
   [TrailingStop] Price update for BTC/USDT: $50,000 → $50,500
   [TrailingStop] Stop price adjusted: $47,500 → $47,975
   ```

3. **Position Triggers**:
   ```
   [TrailingStop] Position BTC_TRAILING_123 triggered at $47,975
   [TrailingStop] Executing sell order for 0.001 BTC
   ```

4. **Errors**:
   ```
   [TrailingStop] API Error: Rate limit exceeded
   [TrailingStop] Database Error: Connection timeout
   ```

#### **Cách debug**:
- Mở Developer Tools (F12)
- Vào tab "Console"
- Filter logs theo keyword: "TrailingStop", "Error", "Success"
- Theo dõi real-time để hiểu flow hoạt động

---

## 🔧 4. Troubleshooting

### 4.1 Các Lỗi Thường Gặp và Cách Khắc Phục

#### **A. Lỗi Database Schema**

**Triệu chứng**:
```
Error: Could not find the 'activationPrice' column of 'trailing_stops'
PGRST204: The result contains 0 rows
```

**Nguyên nhân**: Database schema chưa được cập nhật đúng

**Cách khắc phục**:
1. **Kiểm tra database schema**:
   ```bash
   node test-database-schema.js
   ```

2. **Nếu lỗi, chạy fix script**:
   ```bash
   node apply-database-fix.js
   ```

3. **Verify sau khi fix**:
   ```bash
   node test-with-lowercase.js
   ```

#### **B. Lỗi API Connection**

**Triệu chứng**:
```
Failed to fetch price data
Network error: fetch failed
```

**Nguyên nhân**:
- Không có kết nối internet
- API rate limit exceeded
- Server không chạy

**Cách khắc phục**:
1. **Kiểm tra server**:
   ```bash
   # Kiểm tra server có chạy không
   curl http://localhost:3000/api/ticker
   ```

2. **Restart server**:
   ```bash
   # Dừng server (Ctrl+C)
   # Chạy lại
   npm run dev
   ```

3. **Kiểm tra network**:
   ```bash
   # Test API endpoint
   node test-web-interface.js
   ```

#### **C. Lỗi Position Creation**

**Triệu chứng**:
```
Failed to create position
Strategy configuration invalid
```

**Nguyên nhân**:
- Tham số strategy không hợp lệ
- Insufficient balance
- Symbol không được hỗ trợ

**Cách khắc phục**:
1. **Kiểm tra strategy config**:
   - Đảm bảo tất cả required fields được điền
   - Kiểm tra range của các tham số

2. **Reset về default**:
   - Refresh trang
   - Chọn lại strategy từ đầu

3. **Sử dụng demo mode**:
   - Thử "Demo Position" trước
   - Sau khi demo thành công mới tạo real position

#### **D. Lỗi Real-time Updates**

**Triệu chứng**:
```
Price updates stopped
Positions not updating
Alerts not showing
```

**Nguyên nhân**:
- WebSocket connection lost
- Background monitoring stopped
- Browser tab inactive

**Cách khắc phục**:
1. **Refresh trang**:
   - F5 hoặc Ctrl+R
   - Kiểm tra console logs

2. **Kiểm tra background processes**:
   ```bash
   # Trong server logs, tìm:
   [TrailingStop] Monitoring started
   [TrailingStop] Price update for...
   ```

3. **Restart monitoring**:
   - Stop tất cả positions
   - Tạo lại positions mới

### 4.2 Cách Kiểm Tra Database Schema

#### **Script kiểm tra nhanh**:
```bash
# Chạy test toàn diện
node final-test.js

# Kết quả mong đợi:
✅ Database schema working correctly
✅ activationprice column functional
✅ All CRUD operations working
✅ Ready for production testing
```

#### **Kiểm tra manual trong Supabase**:
1. **Truy cập Supabase Dashboard**
2. **Vào Table Editor**
3. **Kiểm tra bảng `trailing_stops`**
4. **Verify các columns**:
   - `statekey` (TEXT)
   - `activationprice` (NUMERIC)
   - `entryprice` (NUMERIC)
   - `symbol` (TEXT)
   - `status` (TEXT)

#### **SQL query để kiểm tra**:
```sql
-- Kiểm tra structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'trailing_stops';

-- Test insert
INSERT INTO trailing_stops (statekey, symbol, entryprice, activationprice)
VALUES ('test-123', 'BTC/USDT', 50000, 51000);
```

### 4.3 Cách Verify Server Status

#### **Kiểm tra server health**:
```bash
# Test main endpoints
curl http://localhost:3000/api/ticker
curl http://localhost:3000/api/balance
curl http://localhost:3000/api/active-simulations
```

#### **Kiểm tra database connection**:
```bash
# Test database operations
node -e "
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
supabase.from('trailing_stops').select('count').then(({data, error}) => {
  console.log(error ? '❌ DB Error: ' + error.message : '✅ DB Connected');
});
"
```

#### **Monitoring server logs**:
```bash
# Trong terminal chạy server, tìm:
✓ Ready in 2.3s
✓ Local: http://localhost:3000
✓ Network: http://192.168.1.100:3000

# Không có errors:
❌ Error: EADDRINUSE (port đã được sử dụng)
❌ Database connection failed
❌ API rate limit exceeded
```

---

## 📸 5. Screenshots và Ví Dụ Minh Họa

### 5.1 Giao Diện Chính
```
[Advanced Trailing Stop Interface]
┌─────────────────────────────────────────────────────────────┐
│ 📈 Trailing Stop Nâng Cao    🟢 2 Đang Hoạt Động  💰 $125.50│
├─────────────────────────────────────────────────────────────┤
│ Strategy Configuration     │  Real-time Alerts              │
│ ┌─────────────────────────┐ │ ┌─────────────────────────────┐│
│ │ Symbol: BTC/USDT ▼     │ │ │ 🔔 Alerts (3)              ││
│ │ Strategy: Percentage ▼  │ │ │ ✅ Position created for BTC ││
│ │ Trailing %: 5.0        │ │ │ ⚠️  Price movement detected ││
│ │ Max Loss %: 10.0       │ │ │ 🔴 Stop loss triggered     ││
│ │                        │ │ └─────────────────────────────┘│
│ │ [Create Position]      │ │                                │
│ │ [Demo Position]        │ │                                │
│ └─────────────────────────┘ │                                │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Position Panel
```
[Active Positions]
┌─────────────────────────────────────────────────────────────┐
│ 🟢 BTC/USDT - PERCENTAGE • 5% trailing                     │
│ Entry: $50,000  Current: $52,500  Stop: $49,875           │
│ P&L: +$2,500 (+5.0%) 📈                                   │
├─────────────────────────────────────────────────────────────┤
│ 🟡 ETH/USDT - ATR • Pending Activation                     │
│ Entry: $3,000  Activation: $3,150  Current: $3,050        │
│ Status: Waiting for activation price                        │
└─────────────────────────────────────────────────────────────┘
```

### 5.3 Strategy Selector
```
[Strategy Selection Dropdown]
┌─────────────────────────────────────────────────────────────┐
│ Percentage-based          [beginner] [low risk]            │
│ ATR Strategy             [intermediate] [medium risk]       │
│ Fibonacci Retracement    [advanced] [medium risk]          │
│ Bollinger Bands          [intermediate] [medium risk]      │
│ Volume Profile           [expert] [high risk]              │
│ Smart Money Concepts     [expert] [high risk]              │
│ Ichimoku Strategy        [advanced] [medium risk]          │
│ Pivot Points             [intermediate] [medium risk]      │
│ Support/Resistance       [intermediate] [medium risk]      │
│ Dynamic Strategy         [advanced] [high risk]            │
│ Hybrid Multi-Strategy    [expert] [high risk]              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 6. Best Practices và Tips

### 6.1 Cho Người Mới Bắt Đầu

1. **Bắt đầu với Demo**:
   - Luôn sử dụng "Demo Position" trước
   - Quan sát ít nhất 1-2 giờ để hiểu cách hoạt động
   - Chỉ chuyển sang real position khi đã hiểu rõ

2. **Chọn Strategy đơn giản**:
   - Bắt đầu với "Percentage-based"
   - Trailing percent: 3-7%
   - Max loss: 5-10%

3. **Risk Management**:
   - Không bao giờ risk quá 2% account mỗi position
   - Đặt max loss thấp hơn trailing percent
   - Luôn có exit plan

### 6.2 Cho Trader Có Kinh Nghiệm

1. **Multi-Strategy Approach**:
   - Sử dụng nhiều strategies khác nhau
   - Diversify across different timeframes
   - Combine với manual analysis

2. **Advanced Configurations**:
   - Fine-tune ATR parameters theo volatility
   - Sử dụng Fibonacci levels cho precision entries
   - Implement volume-based adjustments

3. **Performance Optimization**:
   - Monitor win rate và adjust accordingly
   - Backtest strategies trên historical data
   - Use hybrid approaches cho complex markets

### 6.3 Monitoring và Maintenance

1. **Daily Checks**:
   - Kiểm tra active positions mỗi sáng
   - Review alerts và performance metrics
   - Adjust parameters nếu cần

2. **Weekly Analysis**:
   - Analyze P&L và win rate
   - Review strategy performance
   - Optimize underperforming strategies

3. **System Maintenance**:
   - Backup database định kỳ
   - Update dependencies
   - Monitor server performance

---

## 📞 7. Hỗ Trợ và Liên Hệ

### 7.1 Tài Liệu Tham Khảo
- **Technical Documentation**: `/docs/` folder
- **API Reference**: `/api/` endpoints
- **Database Schema**: `schema.sql`

### 7.2 Debugging Tools
- **Test Scripts**: `test-*.js` files
- **Console Logs**: Browser Developer Tools
- **Database Tools**: Supabase Dashboard

### 7.3 Common Issues
- **Port conflicts**: Use `netstat -ano | findstr :3000`
- **Database errors**: Run `node test-database-schema.js`
- **API issues**: Check `node test-web-interface.js`

---

**🎉 Chúc bạn trading thành công với Advanced Trailing Stop System!**