# 🤖 AI Trading Backtesting System

## Tổng quan

Hệ thống AI Trading Backtesting là một công cụ toàn diện để test và đánh giá hiệu suất của các chiến lược giao dịch cryptocurrency sử dụng dữ liệu lịch sử từ năm 2020 đến hiện tại.

## Tính năng chính

### 1. **Backtesting Engine**
- Test các strategy với dữ liệu lịch sử thực tế
- Hỗ trợ multiple timeframes (1m, 5m, 15m, 1h, 4h, 1d)
- Tính toán performance metrics chi tiết
- Simulation môi trường giao dịch thực tế

### 2. **Performance Analytics**
- **Win Rate**: Tỷ lệ giao dịch có lãi
- **Profit/Loss**: Tổng lợi nhuận/lỗ
- **Sharpe Ratio**: Tỷ lệ lợi nhuận điều chỉnh theo rủi ro
- **Max Drawdown**: Sụt giảm tối đa từ đỉnh
- **Sortino Ratio**: Tỷ lệ lợi nhuận điều chỉnh theo downside risk
- **Calmar Ratio**: Tỷ lệ lợi nhuận hàng năm / Max Drawdown

### 3. **Visual Charts**
- Đường cong equity theo thời gian
- Biểu đồ drawdown
- So sánh performance giữa các strategies
- Risk vs Return scatter plot

### 4. **Strategy Comparison**
- So sánh nhiều strategies cùng lúc
- Ranking theo performance metrics
- Correlation analysis giữa các strategies
- Risk-adjusted returns comparison

### 5. **Time Range Selection**
- Chọn khoảng thời gian test từ 2020-2024
- Flexible date range picker
- Historical data validation

### 6. **Risk Management**
- Position sizing configuration
- Stop loss và take profit settings
- Maximum positions limit
- Commission và slippage simulation

### 7. **Export Results**
- Xuất báo cáo PDF
- Export dữ liệu CSV
- JSON format cho integration
- Detailed performance reports

## Cấu trúc hệ thống

### API Endpoints

#### `/api/historical-data`
```typescript
GET /api/historical-data?symbol=BTC/USDT&timeframe=1h&startDate=2020-01-01&endDate=2024-12-31&limit=5000
```
- Lấy dữ liệu lịch sử từ Binance
- Hỗ trợ caching để tối ưu performance
- Rate limiting để tránh spam

### Core Components

#### 1. **BacktestingEngine** (`lib/backtestingEngine.ts`)
```typescript
class BacktestingEngine {
  async runBacktest(strategyId?: string): Promise<BacktestResult[]>
  private runSingleStrategy(strategy: BacktestStrategy): Promise<BacktestResult>
  private calculatePerformanceMetrics(trades: Trade[], equity: EquityPoint[]): PerformanceMetrics
}
```

#### 2. **AIBacktestingService** (`lib/aiBacktestingService.ts`)
```typescript
class AIBacktestingService {
  async fetchHistoricalData(): Promise<number[][]>
  async runBacktest(config: BacktestConfig): Promise<BacktestResult[]>
  async runComparison(configs: BacktestConfig[]): Promise<BacktestComparison>
  async exportResults(resultIds: string[], format: 'pdf' | 'csv' | 'json'): Promise<Blob>
}
```

#### 3. **UI Components**
- `AIBacktestingPanel`: Main interface component
- `StrategyComparisonTable`: Results comparison table
- `BacktestResultsChart`: Performance visualization
- `PerformanceMetricsCard`: Metrics display

### Predefined Strategies

#### 1. **SMA Crossover**
- **Mô tả**: Chiến lược cắt đường trung bình động đơn giản
- **Tham số**: Fast SMA (10), Slow SMA (30)
- **Logic**: Mua khi SMA nhanh cắt lên SMA chậm, bán khi ngược lại

#### 2. **RSI Oversold/Overbought**
- **Mô tả**: Chiến lược hồi quy trung bình RSI
- **Tham số**: RSI Period (14), Oversold (30), Overbought (70)
- **Logic**: Mua khi RSI < 30, bán khi RSI > 70

#### 3. **Bollinger Bands**
- **Mô tả**: Chiến lược đột phá dải Bollinger
- **Tham số**: Period (20), Standard Deviation (2)
- **Logic**: Mua khi giá chạm dải dưới, bán khi chạm dải trên

#### 4. **MACD Signal**
- **Mô tả**: Chiến lược tín hiệu MACD
- **Tham số**: Fast (12), Slow (26), Signal (9)
- **Logic**: Mua khi MACD cắt lên Signal line

#### 5. **Stochastic Oscillator**
- **Mô tả**: Chiến lược dao động Stochastic
- **Tham số**: K Period (14), D Period (3)
- **Logic**: Mua khi %K cắt lên %D trong vùng oversold

## Cách sử dụng

### 1. **Cấu hình Backtest**
```typescript
const config: BacktestConfig = {
  symbol: 'BTC/USDT',
  timeframe: '1h',
  startDate: '2020-01-01',
  endDate: '2024-12-31',
  initialCapital: 10000,
  positionSize: 10, // 10% per trade
  maxPositions: 3,
  commission: 0.1, // 0.1%
  slippage: 0.05, // 0.05%
  strategies: [/* selected strategies */]
};
```

### 2. **Chạy Backtest**
```typescript
const results = await aiBacktestingService.runBacktest(config);
console.log('Backtest results:', results);
```

### 3. **So sánh Strategies**
```typescript
const comparison = await aiBacktestingService.runComparison([config1, config2]);
console.log('Strategy comparison:', comparison);
```

### 4. **Export Results**
```typescript
const csvBlob = await aiBacktestingService.exportResults(resultIds, 'csv');
// Download file logic
```

## Performance Metrics Giải thích

### **Sharpe Ratio**
- **Công thức**: (Return - Risk-free rate) / Standard Deviation
- **Ý nghĩa**: Đo lường lợi nhuận điều chỉnh theo rủi ro
- **Tốt**: > 1.0, Xuất sắc: > 2.0

### **Sortino Ratio**
- **Công thức**: (Return - Risk-free rate) / Downside Deviation
- **Ý nghĩa**: Tương tự Sharpe nhưng chỉ tính rủi ro downside
- **Tốt hơn Sharpe**: Khi có nhiều upside volatility

### **Maximum Drawdown**
- **Ý nghĩa**: Sụt giảm tối đa từ đỉnh cao nhất
- **Tốt**: < 10%, Chấp nhận được: < 20%
- **Quan trọng**: Đo lường rủi ro tâm lý

### **Win Rate**
- **Ý nghĩa**: Phần trăm giao dịch có lãi
- **Lưu ý**: Win rate cao không đảm bảo lợi nhuận cao
- **Cân bằng**: Với average win/loss ratio

## Tối ưu hóa Performance

### 1. **Caching Strategy**
- Cache historical data để giảm API calls
- Cache computation results
- Intelligent cache invalidation

### 2. **Batch Processing**
- Process multiple strategies parallel
- Optimize memory usage
- Progress tracking

### 3. **Data Management**
- Efficient data structures
- Memory-conscious algorithms
- Streaming for large datasets

## Roadmap

### Phase 1 ✅ (Completed)
- [x] Basic backtesting engine
- [x] Predefined strategies
- [x] Performance metrics calculation
- [x] Simple UI interface
- [x] Historical data API

### Phase 2 🚧 (In Progress)
- [ ] Advanced charting with Recharts
- [ ] Strategy parameter optimization
- [ ] Walk-forward analysis
- [ ] Monte Carlo simulation
- [ ] Advanced risk metrics

### Phase 3 📋 (Planned)
- [ ] Machine Learning strategies
- [ ] Portfolio backtesting
- [ ] Real-time strategy monitoring
- [ ] Advanced export formats
- [ ] Strategy marketplace

### Phase 4 🔮 (Future)
- [ ] AI-powered strategy generation
- [ ] Sentiment analysis integration
- [ ] Multi-exchange support
- [ ] Social trading features
- [ ] Mobile app

## Kỹ thuật Implementation

### **Framework & Libraries**
- **Frontend**: Next.js 15.2.4, React 18
- **UI**: Ant Design với Vietnamese localization
- **Charts**: Recharts cho visualization
- **Language**: TypeScript cho type safety
- **Styling**: CSS-in-JS với responsive design

### **Backend Services**
- **API**: Next.js API routes
- **Data**: Binance API integration
- **Caching**: In-memory cache với TTL
- **Error Handling**: Circuit breaker pattern

### **Performance Optimizations**
- **Lazy Loading**: Components và data
- **Memoization**: Expensive calculations
- **Virtualization**: Large datasets
- **Code Splitting**: Bundle optimization

## Testing & Quality

### **Testing Strategy**
- Unit tests cho core algorithms
- Integration tests cho API endpoints
- E2E tests cho user workflows
- Performance benchmarks

### **Code Quality**
- TypeScript strict mode
- ESLint + Prettier
- Husky pre-commit hooks
- Automated CI/CD pipeline

## Deployment

### **Production Setup**
- Vercel deployment
- Environment variables configuration
- CDN cho static assets
- Monitoring và logging

### **Scaling Considerations**
- Database cho persistent storage
- Redis cho advanced caching
- Queue system cho heavy computations
- Load balancing cho high traffic

---

## Liên hệ & Hỗ trợ

Để được hỗ trợ hoặc đóng góp cho dự án, vui lòng tạo issue trên GitHub repository hoặc liên hệ qua email.

**Phiên bản**: 1.0.0  
**Cập nhật cuối**: 2025-01-09  
**Tác giả**: AI Trading Team
