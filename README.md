# Crypto Trading Dashboard

Một ứng dụng trading cryptocurrency với biểu đồ hình nến theo thời gian thực, hỗ trợ trade BTC, ETH, và PEPE trong môi trường test.

## Tính năng chính

### 🪙 Multi-Coin Trading
- Hỗ trợ trading 3 loại coin: Bitcoin (BTC), Ethereum (ETH), và Pepe (PEPE)
- Chuyển đổi dễ dàng giữa các coin
- Hiển thị giá cả và thống kê thời gian thực

### 📊 Biểu đồ hình nến
- Biểu đồ candlestick tương tác với thư viện LightWeight Charts
- Cập nhật theo thời gian thực mỗi 10 giây
- Có thể chuyển đổi giữa biểu đồ nâng cao và đơn giản
- Hiển thị giá Open, High, Low, Close và Volume

### 💼 Giao dịch đa dạng
- **Market Order**: Mua/bán ngay lập tức theo giá thị trường
- **Limit Order**: Đặt lệnh mua/bán với giá cụ thể
- **Trailing Stop**: Lệnh cắt lỗ tự động theo dõi giá

### 📈 Thống kê thị trường
- Hiển thị giá hiện tại, thay đổi 24h, volume
- Thống kê High/Low trong ngày
- Cập nhật giá mỗi 2 giây

### 💰 Quản lý tài khoản
- Hiển thị số dư tài khoản
- Lịch sử giao dịch chi tiết
- Theo dõi P&L (Profit & Loss)

## Cài đặt

1. **Clone repository**
   ```bash
   git clone <repository-url>
   cd ccxt-binance-app
   ```

2. **Cài đặt dependencies**
   ```bash
   npm install
   ```

3. **Cấu hình môi trường**
   Tạo file `.env.local` và thêm:
   ```
   BINANCE_API_KEY=your_binance_testnet_api_key
   BINANCE_API_SECRET=your_binance_testnet_secret
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Chạy ứng dụng**
   ```bash
   npm run dev
   ```

5. **Truy cập ứng dụng**
   Mở trình duyệt và truy cập: `http://localhost:3000`

## Hướng dẫn sử dụng

### 1. Chọn coin để trade
- Sử dụng Coin Selector ở đầu trang
- Click vào BTC, ETH, hoặc PEPE để chuyển đổi
- Biểu đồ và thông tin sẽ tự động cập nhật

### 2. Xem biểu đồ
- Biểu đồ candlestick hiển thị xu hướng giá
- Click nút "Simple Chart" / "Advanced Chart" để chuyển đổi
- Biểu đồ tự động cập nhật theo thời gian thực

### 3. Đặt lệnh giao dịch
- **Market Order**: Nhập số lượng, chọn Buy/Sell, click "Place Order"
- **Limit Order**: Nhập số lượng và giá mong muốn
- **Trailing Stop**: Đặt lệnh cắt lỗ tự động với % trailing

### 4. Theo dõi giao dịch
- Xem lịch sử giao dịch trong bảng Order History
- Theo dõi Trailing Stop đang active
- Kiểm tra số dư tài khoản

## Công nghệ sử dụng

- **Framework**: Next.js 15 với App Router
- **Styling**: Tailwind CSS
- **Charts**: LightWeight Charts
- **Trading**: CCXT library (Binance)
- **Database**: Supabase
- **TypeScript**: Type safety
- **Real-time**: WebSocket connections

## Lưu ý quan trọng

⚠️ **Môi trường Test**: Ứng dụng này được cấu hình để sử dụng Binance Testnet, không phải mainnet thực tế.

⚠️ **Mục đích học tập**: Đây là ứng dụng demo cho mục đích học tập và thử nghiệm.

⚠️ **Không sử dụng tiền thật**: Tất cả giao dịch đều được thực hiện trên testnet với virtual money.

## Cấu trúc thư mục

```
├── app/
│   ├── api/          # API routes
│   ├── globals.css   # Global styles
│   ├── layout.tsx    # Root layout
│   └── page.tsx      # Main page
├── components/       # React components
├── contexts/         # React contexts
├── lib/             # Utilities
└── public/          # Static files
```

## Troubleshooting

### Lỗi kết nối API
- Kiểm tra API keys trong `.env.local`
- Đảm bảo sử dụng Binance Testnet keys
- Kiểm tra kết nối internet

### Advance Chart không hoạt động
- Thử chuyển sang Simple Chart bằng nút toggle
- Kiểm tra console cho lỗi JavaScript
- Reload trang và đợi một chút để chart khởi tạo
- Nếu vẫn lỗi, sử dụng Simple Chart mode
- Clear browser cache và thử lại

### Dữ liệu bị nhấp nháy/flickering
- Ứng dụng đã được tối ưu với debouncing (delay 500ms)
- Dữ liệu được cập nhật mỗi 5 giây để giảm nhấp nháy
- Biểu đồ cập nhật mỗi 20 giây
- Loading overlay có delay để tránh nhấp nháy cho tác vụ nhanh
- Nếu vẫn nhấp nháy, thử refresh trang

### Trailing Stop Monitor lỗi
- Lỗi "fetch failed" là do Supabase connection
- Ứng dụng sẽ fallback về in-memory storage
- Trailing stops vẫn hoạt động bình thường trong session hiện tại
- Để fix hoàn toàn: thêm Supabase credentials vào `.env.local`
- Kiểm tra network connection nếu thấy thông báo "chế độ offline"

### Environment Variables cho Supabase (Optional)
Thêm vào `.env.local` nếu muốn sử dụng Supabase:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```
Nếu không có, ứng dụng vẫn hoạt động với memory storage.

### Dữ liệu không cập nhật
- Kiểm tra network tab trong DevTools
- Đảm bảo API endpoints hoạt động
- Kiểm tra Supabase connection

## Phát triển thêm

Có thể mở rộng ứng dụng bằng cách:
- Thêm nhiều coin khác
- Tích hợp thêm exchange
- Thêm indicators technical analysis
- Tạo bot trading tự động
- Thêm alerts và notifications

## Liên hệ

Nếu gặp vấn đề hoặc có câu hỏi, vui lòng tạo issue hoặc liên hệ trực tiếp.

## Fixed Issues

### Duplicate React Key Warning
**Problem**: React warning "Encountered two children with the same key" was occurring when multiple notifications were created rapidly.

**Root Cause**: All components were using `Date.now()` for generating IDs, which could create duplicate keys when multiple notifications were generated within the same millisecond.

**Solution**: 
- Created a unique ID generation system in `lib/utils.ts`
- `generateUniqueId()`: Uses timestamp + counter for guaranteed uniqueness
- `generateUniqueStringId()`: Uses timestamp + random string for extra uniqueness
- Updated all notification systems to use the new ID generators

**Updated Components**:
- `OrderForm.tsx`: Notification IDs
- `TrailingStopMonitor.tsx`: Notification IDs  
- `OrderHistory.tsx`: Notification IDs
- `app/page.tsx`: Component re-render keys
- `simulate-trailing-stop/route.ts`: State keys

### CandlestickChart addCandlestickSeries Error (FIXED)
**Problem**: JavaScript error `chart.addCandlestickSeries is not a function` was occurring when trying to create chart series.

**Root Cause**: The lightweight-charts library API changed in version 5.0. The old API `chart.addCandlestickSeries()` was replaced with the new API `chart.addSeries(CandlestickSeries, options)`.

**Solution**: 
- Updated to latest lightweight-charts version (5.0+)
- Updated API calls to use the new `chart.addSeries(CandlestickSeries, options)` method
- Imported `CandlestickSeries` from the library 
- Added `fitContent()` call for better chart display
- Used official TradingView documentation patterns

**Changes Made**:
- Updated import to include `CandlestickSeries`
- Changed `chart.addCandlestickSeries()` to `chart.addSeries(CandlestickSeries, options)`
- Updated color scheme to match TradingView standards
- Added `chartInstance.timeScale().fitContent()` for better UX
- Improved error handling for the new API

**New API Pattern**:
```typescript
import { createChart, ColorType, CandlestickSeries } from 'lightweight-charts';

const chart = createChart(container, options);
const series = chart.addSeries(CandlestickSeries, {
  upColor: '#26a69a',
  downColor: '#ef5350',
  // ...other options
});
series.setData(data);
chart.timeScale().fitContent();
```

## Lightweight Charts™ Integration

This project uses [TradingView's Lightweight Charts™](https://tradingview.github.io/lightweight-charts/) version 5.0+ for advanced candlestick charting.

### Installation
```bash
npm install --save lightweight-charts@latest
```

### Key Features
- **Interactive candlestick charts** with real-time updates
- **Professional trading interface** matching TradingView standards
- **Responsive design** with automatic resizing
- **High performance** with optimized rendering
- **TypeScript support** built-in

### Usage Example
```typescript
import { createChart, ColorType, CandlestickSeries } from 'lightweight-charts';

const chart = createChart(container, {
  layout: {
    background: { type: ColorType.Solid, color: 'transparent' },
    textColor: '#333',
  }
});

const candlestickSeries = chart.addSeries(CandlestickSeries, {
  upColor: '#26a69a',
  downColor: '#ef5350',
  borderVisible: false,
  wickUpColor: '#26a69a',
  wickDownColor: '#ef5350',
});

candlestickSeries.setData(candleData);
chart.timeScale().fitContent();
```

### License Attribution
As required by the Lightweight Charts™ license, this application includes the TradingView attribution:
- **Creator**: TradingView
- **Product**: Lightweight Charts™
- **Website**: https://www.tradingview.com/
