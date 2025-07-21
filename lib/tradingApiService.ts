// Định nghĩa dịch vụ API giao dịch - Một tiện ích để lấy dữ liệu thị trường thực tế.
// Mục đích chính là tập trung logic gọi API, xử lý lỗi và caching tại một nơi.

import { apiErrorHandler } from './apiErrorHandler'; // Import dịch vụ xử lý lỗi API tùy chỉnh.
                                                  // Nó cung cấp các tính năng như Circuit Breaker, Retry, và Fallback.

// =========================================================================
// INTERFACE - ĐỊNH NGHĨA CẤU TRÚC DỮ LIỆU
// =========================================================================

/**
 * Interface `TickerData`
 * Mô tả: Cấu trúc dữ liệu cho thông tin ticker của một cặp tiền tệ (ví dụ: BTC/USDT).
 * Dữ liệu này thường bao gồm giá hiện tại, giá cao nhất/thấp nhất trong 24h, khối lượng, v.v.
 */
export interface TickerData {
  symbol: string;        // Biểu tượng cặp tiền tệ (ví dụ: "BTC/USDT").
  last: number;          // Giá cuối cùng / giá hiện tại.
  bid: number;           // Giá mua tốt nhất.
  ask: number;           // Giá bán tốt nhất.
  high: number;          // Giá cao nhất trong 24 giờ.
  low: number;           // Giá thấp nhất trong 24 giờ.
  volume: number;        // Khối lượng giao dịch của tài sản cơ sở (base asset) trong 24 giờ.
  quoteVolume: number;   // Khối lượng giao dịch của tài sản định giá (quote asset) trong 24 giờ.
  percentage: number;    // Phần trăm thay đổi giá trong 24 giờ.
  timestamp: number;     // Thời gian dữ liệu được ghi nhận (Unix timestamp, milliseconds).
}

/**
 * Interface `CandleData`
 * Mô tả: Cấu trúc dữ liệu cho một nến (OHLCV - Open, High, Low, Close, Volume).
 * Dữ liệu nến được dùng để vẽ biểu đồ và phân tích kỹ thuật.
 */
export interface CandleData {
  timestamp: number;     // Thời gian mở nến (Unix timestamp, milliseconds).
  open: number;          // Giá mở cửa của nến.
  high: number;          // Giá cao nhất trong khoảng thời gian nến.
  low: number;           // Giá thấp nhất trong khoảng thời gian nến.
  close: number;         // Giá đóng cửa của nến.
  volume: number;        // Khối lượng giao dịch trong khoảng thời gian nến.
}

/**
 * Interface `MarketVolatilityData`
 * Mô tả: Cấu trúc dữ liệu cho các thông số biến động thị trường.
 */
export interface MarketVolatilityData {
  symbol: string;        // Biểu tượng cặp tiền tệ.
  atr: number;           // Average True Range (ATR) - chỉ báo đo lường biến động.
  volatilityPercent: number; // Phần trăm biến động.
  trend: 'bullish' | 'bearish' | 'sideways'; // Xu hướng thị trường.
  strength: number;      // Độ mạnh của xu hướng (từ 0 đến 100).
  supportLevel?: number; // Mức hỗ trợ (tùy chọn).
  resistanceLevel?: number; // Mức kháng cự (tùy chọn).
}

// =========================================================================
// CLASS `TradingApiService` - DỊCH VỤ API GIAO DỊCH CHÍNH
// =========================================================================

/**
 * `TradingApiService`
 * Mô tả: Là một dịch vụ Singleton (chỉ có một instance duy nhất trong toàn bộ ứng dụng)
 * chịu trách nhiệm giao tiếp với các API bên ngoài (thông qua các API route của Next.js)
 * để lấy dữ liệu thị trường. Nó tích hợp caching và cơ chế xử lý lỗi nâng cao.
 */
export class TradingApiService {
  private static instance: TradingApiService; // Biến tĩnh để lưu trữ instance duy nhất của class.

  // `priceCache`: Cache trong bộ nhớ cho dữ liệu giá ticker.
  // Map<symbol, { price: number, timestamp: number }>.
  private priceCache: Map<string, { price: number; timestamp: number }> = new Map();

  // `volatilityCache`: Cache trong bộ nhớ cho dữ liệu biến động thị trường.
  // Map<symbol, { data: MarketVolatilityData, timestamp: number }>.
  private volatilityCache: Map<string, { data: MarketVolatilityData; timestamp: number }> = new Map();

  // Hằng số cho thời gian sống (Time To Live - TTL) của các mục trong cache (đơn vị: milliseconds).
  private readonly CACHE_DURATION = 5000;         // 5 giây cho dữ liệu giá (ticker).
  private readonly VOLATILITY_CACHE_DURATION = 30000; // 30 giây cho dữ liệu biến động.

  /**
   * Constructor private để đảm bảo class chỉ có thể được tạo thông qua `getInstance()`.
   */
  private constructor() {}

  /**
   * `getInstance()`
   * Chức năng: Phương thức tĩnh để truy cập instance duy nhất của `TradingApiService` (Singleton Pattern).
   * Đảm bảo rằng chỉ có một đối tượng `TradingApiService` tồn tại trong ứng dụng, giúp quản lý trạng thái và tài nguyên hiệu quả.
   * @returns TradingApiService - Instance duy nhất của dịch vụ.
   */
  static getInstance(): TradingApiService {
    if (!TradingApiService.instance) {
      TradingApiService.instance = new TradingApiService();
    }
    return TradingApiService.instance;
  }

  // =========================================================================
  // PHƯƠNG THỨC LẤY DỮ LIỆU GIÁ HIỆN TẠI
  // =========================================================================

  /**
   * `getCurrentPrice`
   * Chức năng: Lấy giá hiện tại của một cặp tiền tệ.
   * Nó sử dụng cơ chế caching nội bộ và tích hợp `apiErrorHandler` để xử lý các vấn đề mạng, lỗi server, v.v.
   * @param symbol : string - Biểu tượng cặp tiền tệ (ví dụ: "BTC/USDT").
   * @returns Promise<number> - Giá hiện tại của cặp tiền tệ.
   */
  async getCurrentPrice(symbol: string): Promise<number> {
    // 1. KIỂM TRA CACHE TRƯỚC
    const cached = this.priceCache.get(symbol); // Thử lấy giá từ cache nội bộ của dịch vụ.
    // Nếu có trong cache và chưa hết hạn (dựa trên `CACHE_DURATION`).
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.price; // Trả về giá từ cache ngay lập tức.
    }

    /**
     * `operation` (Hàm thực hiện tác vụ chính - Gọi API thật)
     * Đây là hàm sẽ được `apiErrorHandler` gọi. Nó chứa logic gọi API thực tế.
     * @returns Promise<number> - Giá hiện tại được lấy từ API.
     */
    const operation = async (): Promise<number> => {
      // Xác định `baseUrl`: Nếu đang chạy trên trình duyệt (client-side), thì `baseUrl` là rỗng (cùng origin).
      // Nếu đang chạy trên server (ví dụ: trong API route khác), thì `baseUrl` là `http://localhost:3000`.
      const baseUrl = typeof window !== 'undefined' ? '' : 'http://localhost:3000';

      // Gọi API route nội bộ của Next.js `/api/ticker`.
      // Route này sẽ tự chịu trách nhiệm sử dụng CCXT để giao tiếp với sàn Binance.
      const response = await fetch(`${baseUrl}/api/ticker?symbol=${encodeURIComponent(symbol)}`);

      // Kiểm tra trạng thái HTTP của phản hồi.
      if (!response.ok) {
        // Nếu phản hồi không thành công (ví dụ: 4xx, 5xx), tạo một lỗi tùy chỉnh để `apiErrorHandler` xử lý.
        const error = new Error(`API ticker error: ${response.status} ${response.statusText}`);
        (error as any).status = response.status; // Gắn mã trạng thái HTTP vào đối tượng lỗi.
        throw error; // Ném lỗi để `apiErrorHandler` bắt.
      }

      const tickerData: TickerData = await response.json(); // Phân tích JSON từ phản hồi.

      // Xác thực dữ liệu giá trả về.
      if (!tickerData.last || isNaN(tickerData.last)) {
        throw new Error(`Invalid price data for ${symbol}`); // Ném lỗi nếu dữ liệu không hợp lệ.
      }

      // 2. LƯU VÀO CACHE SAU KHI GỌI API THÀNH CÔNG
      // Lưu giá vào cache nội bộ của dịch vụ (`this.priceCache`).
      this.priceCache.set(symbol, {
        price: tickerData.last,
        timestamp: Date.now() // Ghi lại thời gian cache.
      });

      // Lưu giá thành công vào `apiErrorHandler` cache.
      // `apiErrorHandler` sẽ sử dụng giá này làm fallback nếu có lỗi API trong tương lai.
      apiErrorHandler.cacheSuccessfulPrice(symbol, tickerData.last);

      return tickerData.last; // Trả về giá cuối cùng.
    };

    /**
     * `fallback` (Hàm cung cấp dữ liệu dự phòng)
     * Chức năng: Được `apiErrorHandler` gọi khi `operation` thất bại (ví dụ: lỗi mạng, server down, rate limit).
     * @returns number - Giá dự phòng.
     */
    const fallback = (): number => {
      // 1. ƯU TIÊN SỬ DỤNG GIÁ CUỐI CÙNG THÀNH CÔNG TỪ `apiErrorHandler`.
      const lastSuccessfulPrice = apiErrorHandler.getLastSuccessfulPrice(symbol);
      if (lastSuccessfulPrice !== null) {
        console.info(`[Fallback] Using last successful price for ${symbol}: ${lastSuccessfulPrice}`);
        return lastSuccessfulPrice; // Trả về giá đã được lưu gần đây nhất.
      }

      // 2. NẾU KHÔNG CÓ GIÁ THÀNH CÔNG GẦN ĐÂY, DÙNG GIÁ MẶC ĐỊNH DỰ PHÒNG.
      console.warn(`[Fallback] Using default price for ${symbol}`);
      return this.getFallbackPrice(symbol); // Trả về một giá dự phòng an toàn (đã định nghĩa trước).
    };

    // 3. THỰC THI `operation` VỚI `apiErrorHandler.executeWithCircuitBreaker`
    try {
      // `executeWithCircuitBreaker` sẽ tự động quản lý việc gọi `operation`,
      // thử lại nếu thất bại (retry), mở mạch ngắt (circuit breaker) nếu nhiều lỗi liên tiếp,
      // và gọi `fallback` khi cần thiết.
      return await apiErrorHandler.executeWithCircuitBreaker(
        `getCurrentPrice_${symbol}`, // Key định danh cho mạch ngắt (đảm bảo duy nhất cho mỗi symbol).
        operation,                   // Hàm chính để thực hiện.
        fallback                     // Hàm dự phòng.
      );
    } catch (error) {
      // Bắt lỗi nếu `executeWithCircuitBreaker` cuối cùng vẫn thất bại sau tất cả các lần thử lại và cơ chế mạch ngắt.
      console.error(`Error fetching current price for ${symbol}:`, error);
      return fallback(); // Trong trường hợp này, vẫn trả về giá dự phòng như một biện pháp cuối cùng.
    }
  }

  // =========================================================================
  // PHƯƠNG THỨC LẤY DỮ LIỆU TICKER ĐẦY ĐỦ
  // =========================================================================

  /**
   * `getTickerData`
   * Chức năng: Lấy toàn bộ dữ liệu ticker (giá cuối, bid, ask, high, low, volume, v.v.) cho một cặp tiền tệ.
   * Tương tự `getCurrentPrice`, nó cũng tích hợp xử lý lỗi và cơ chế fallback.
   * @param symbol : string - Biểu tượng cặp tiền tệ (ví dụ: "BTC/USDT").
   * @returns Promise<TickerData> - Dữ liệu ticker đầy đủ.
   */
  async getTickerData(symbol: string): Promise<TickerData> {
    /**
     * `operation` (Hàm thực hiện tác vụ chính - Gọi API thật)
     * @returns Promise<TickerData> - Dữ liệu ticker đầy đủ được lấy từ API.
     */
    const operation = async (): Promise<TickerData> => {
      // Xác định `baseUrl` tương tự như `getCurrentPrice`.
      const baseUrl = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000');
      // Gọi API route nội bộ của Next.js `/api/ticker`.
      const response = await fetch(`${baseUrl}/api/ticker?symbol=${encodeURIComponent(symbol)}`);

      // Kiểm tra trạng thái HTTP của phản hồi.
      if (!response.ok) {
        const error = new Error(`API ticker error: ${response.status} ${response.statusText}`);
        (error as any).status = response.status;
        throw error;
      }

      const rawTickerData = await response.json(); // Phân tích JSON từ phản hồi (dữ liệu thô từ CCXT).

      // Ánh xạ (Map) dữ liệu ticker thô từ CCXT (qua API route) sang interface `TickerData` của chúng ta.
      // Đảm bảo các trường có giá trị mặc định nếu không có trong dữ liệu thô.
      const tickerData: TickerData = {
        symbol: rawTickerData.symbol,
        last: rawTickerData.last || rawTickerData.close, // Giá cuối cùng hoặc giá đóng cửa.
        bid: rawTickerData.bid || 0,
        ask: rawTickerData.ask || 0,
        high: rawTickerData.high || 0,
        low: rawTickerData.low || 0,
        volume: rawTickerData.baseVolume || 0, // Khối lượng base asset.
        quoteVolume: rawTickerData.quoteVolume || 0, // Khối lượng quote asset.
        percentage: rawTickerData.percentage || 0, // Phần trăm thay đổi.
        timestamp: rawTickerData.timestamp || Date.now() // Timestamp.
      };

      // Lưu giá thành công vào `apiErrorHandler` cache để dùng cho fallback thông minh.
      if (tickerData.last && !isNaN(tickerData.last)) {
        apiErrorHandler.cacheSuccessfulPrice(symbol, tickerData.last);
      }

      return tickerData; // Trả về dữ liệu ticker đã được định dạng.
    };

    /**
     * `fallback` (Hàm cung cấp dữ liệu dự phòng)
     * @returns TickerData - Dữ liệu ticker dự phòng.
     */
    const fallback = (): TickerData => {
      // Ưu tiên sử dụng giá cuối cùng thành công từ `apiErrorHandler`.
      const lastSuccessfulPrice = apiErrorHandler.getLastSuccessfulPrice(symbol);
      // Nếu không có, dùng giá dự phòng mặc định.
      const fallbackPrice = lastSuccessfulPrice || this.getFallbackPrice(symbol);

      console.warn(`[Fallback] Using fallback ticker data for ${symbol} with price: ${fallbackPrice}`);

      // Trả về một đối tượng `TickerData` với dữ liệu dự phòng.
      // Các giá trị khác được giả định dựa trên `fallbackPrice`.
      return {
        symbol,
        last: fallbackPrice,
        bid: fallbackPrice * 0.999,  // Bid thấp hơn giá 0.1%.
        ask: fallbackPrice * 1.001,  // Ask cao hơn giá 0.1%.
        high: fallbackPrice * 1.05,  // Giá cao nhất giả định 5% trên giá.
        low: fallbackPrice * 0.95,   // Giá thấp nhất giả định 5% dưới giá.
        volume: 1000000,             // Khối lượng giao dịch giả định.
        quoteVolume: 1000000 * fallbackPrice, // Khối lượng quote giả định.
        percentage: 0,               // Phần trăm thay đổi 0%.
        timestamp: Date.now()        // Timestamp hiện tại.
      };
    };

    // Thực thi `operation` với `apiErrorHandler.executeWithCircuitBreaker` để có xử lý lỗi và fallback.
    try {
      return await apiErrorHandler.executeWithCircuitBreaker(
        `getTickerData_${symbol}`, // Key định danh cho mạch ngắt.
        operation,                  // Hàm chính.
        fallback                    // Hàm dự phòng.
      );
    } catch (error) {
      console.error(`Error fetching ticker data for ${symbol}:`, error);
      return fallback(); // Trả về dữ liệu dự phòng cuối cùng nếu tất cả thất bại.
    }
  }

  // =========================================================================
  // PHƯƠNG THỨC LẤY DỮ LIỆU NẾN (OHLCV)
  // =========================================================================

  /**
   * `getCandleData`
   * Chức năng: Lấy dữ liệu nến (Open, High, Low, Close, Volume) cho một cặp tiền tệ trong một khung thời gian cụ thể.
   * Tích hợp xử lý lỗi, caching và tạo dữ liệu tổng hợp (synthetic) khi API không khả dụng.
   * @param symbol : string - Biểu tượng cặp tiền tệ.
   * @param timeframe : string - Khung thời gian nến (ví dụ: "1h", "1d"). Mặc định là "1h".
   * @param limit : number - Số lượng nến tối đa muốn lấy. Mặc định là 100.
   * @returns Promise<CandleData[]> - Mảng các đối tượng `CandleData`.
   */
  async getCandleData(symbol: string, timeframe: string = '1h', limit: number = 100): Promise<CandleData[]> {
    /**
     * `operation` (Hàm thực hiện tác vụ chính - Gọi API thật)
     * @returns Promise<CandleData[]> - Dữ liệu nến được lấy từ API.
     */
    const operation = async (): Promise<CandleData[]> => {
      // Xác định `baseUrl` tương tự như các hàm trước.
      const baseUrl = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000');
      // Gọi API route nội bộ của Next.js `/api/candles`.
      const response = await fetch(
        `${baseUrl}/api/candles?symbol=${encodeURIComponent(symbol)}&timeframe=${timeframe}&limit=${limit}`
      );

      // Kiểm tra trạng thái HTTP của phản hồi.
      if (!response.ok) {
        const error = new Error(`API candles error: ${response.status} ${response.statusText}`);
        (error as any).status = response.status;
        throw error;
      }

      const responseData = await response.json(); // Phân tích JSON từ phản hồi.

      // Xử lý định dạng phản hồi API: Dữ liệu nến có thể nằm trong trường `data` hoặc trực tiếp là một mảng.
      let rawData: number[][];
      if (responseData.data && Array.isArray(responseData.data)) {
        rawData = responseData.data; // Dữ liệu nằm trong `responseData.data`.
      } else if (Array.isArray(responseData)) {
        rawData = responseData; // Dữ liệu trực tiếp là `responseData` (fallback).
      } else {
        throw new Error(`Invalid candle data format received for ${symbol}`); // Định dạng không hợp lệ.
      }

      // Xác thực rằng `rawData` là một mảng.
      if (!Array.isArray(rawData)) {
        throw new Error(`Expected array of candles for ${symbol}, got ${typeof rawData}`);
      }

      // Chuyển đổi dữ liệu nến từ định dạng thô của CCXT (`number[][]`)
      // sang định dạng `CandleData` của chúng ta.
      const candleData: CandleData[] = rawData.map((candle, index) => {
        // Kiểm tra tính hợp lệ của mỗi nến (phải là mảng có ít nhất 6 phần tử).
        if (!Array.isArray(candle) || candle.length < 6) {
          throw new Error(`Invalid candle data at index ${index} for ${symbol}: expected array with 6 elements, got ${candle}`);
        }

        return {
          timestamp: candle[0], // Thời gian.
          open: candle[1],      // Giá mở cửa.
          high: candle[2],      // Giá cao nhất.
          low: candle[3],       // Giá thấp nhất.
          close: candle[4],     // Giá đóng cửa.
          volume: candle[5]     // Khối lượng.
        };
      });

      return candleData; // Trả về mảng dữ liệu nến đã định dạng.
    };

    /**
     * `fallback` (Hàm cung cấp dữ liệu dự phòng)
     * Chức năng: Tạo dữ liệu nến tổng hợp (synthetic) khi không thể lấy dữ liệu thật từ API.
     * @returns CandleData[] - Mảng các đối tượng `CandleData` tổng hợp.
     */
    const fallback = (): CandleData[] => {
      console.warn(`[Fallback] Generating synthetic candle data for ${symbol}`);

      // Lấy giá cuối cùng thành công hoặc giá dự phòng làm giá cơ sở.
      const lastSuccessfulPrice = apiErrorHandler.getLastSuccessfulPrice(symbol);
      const basePrice = lastSuccessfulPrice || this.getFallbackPrice(symbol);
      const now = Date.now(); // Thời gian hiện tại.
      // Tính toán khoảng thời gian của một nến theo milliseconds.
      const timeframeMs = this.getTimeframeMs(timeframe);

      // Tạo dữ liệu nến tổng hợp.
      const candles: CandleData[] = [];
      for (let i = limit - 1; i >= 0; i--) { // Lặp ngược để tạo nến từ quá khứ đến hiện tại.
        const timestamp = now - (i * timeframeMs); // Thời gian của nến.
        const volatility = 0.02; // Giả định biến động 2%.
        const randomFactor = (Math.random() - 0.5) * volatility; // Yếu tố ngẫu nhiên cho giá.

        const open = basePrice * (1 + randomFactor);                               // Giá mở cửa ngẫu nhiên.
        const close = open * (1 + (Math.random() - 0.5) * volatility);            // Giá đóng cửa ngẫu nhiên.
        const high = Math.max(open, close) * (1 + Math.random() * volatility * 0.5); // Giá cao nhất ngẫu nhiên.
        const low = Math.min(open, close) * (1 - Math.random() * volatility * 0.5); // Giá thấp nhất ngẫu nhiên.
        const volume = 1000 + Math.random() * 9000;                                 // Khối lượng ngẫu nhiên.

        candles.push({
          timestamp, open, high, low, close, volume // Thêm nến vào mảng.
        });
      }

      return candles; // Trả về mảng nến tổng hợp.
    };

    // Thực thi `operation` với `apiErrorHandler.executeWithCircuitBreaker`.
    try {
      return await apiErrorHandler.executeWithCircuitBreaker(
        `getCandleData_${symbol}_${timeframe}`, // Key định danh mạch ngắt.
        operation,                               // Hàm chính.
        fallback                                 // Hàm dự phòng.
      );
    } catch (error) {
      console.error(`Error fetching candle data for ${symbol}:`, error);
      return fallback(); // Trả về dữ liệu dự phòng cuối cùng.
    }
  }

  /**
   * `getTimeframeMs`
   * Chức năng: Chuyển đổi chuỗi khung thời gian (ví dụ: "1h", "5m") thành giá trị milliseconds.
   * @param timeframe : string - Chuỗi khung thời gian.
   * @returns number - Giá trị milliseconds tương ứng.
   */
  private getTimeframeMs(timeframe: string): number {
    const timeframes: Record<string, number> = {
      '1m': 60 * 1000,        // 1 phút.
      '5m': 5 * 60 * 1000,    // 5 phút.
      '15m': 15 * 60 * 1000,  // 15 phút.
      '30m': 30 * 60 * 1000,  // 30 phút.
      '1h': 60 * 60 * 1000,   // 1 giờ.
      '4h': 4 * 60 * 60 * 1000, // 4 giờ.
      '1d': 24 * 60 * 60 * 1000 // 1 ngày.
    };

    return timeframes[timeframe] || timeframes['1h']; // Trả về milliseconds hoặc mặc định 1 giờ nếu không khớp.
  }

  // =========================================================================
  // PHƯƠNG THỨC TÍNH TOÁN BIẾN ĐỘNG THỊ TRƯỜNG
  // =========================================================================

  /**
   * `calculateVolatility`
   * Chức năng: Tính toán các chỉ số biến động thị trường như ATR, phần trăm biến động, xu hướng, và các mức hỗ trợ/kháng cự.
   * Dữ liệu được tính toán từ nến thật và cũng có cơ chế caching và fallback.
   * @param symbol : string - Biểu tượng cặp tiền tệ.
   * @returns Promise<MarketVolatilityData> - Dữ liệu biến động thị trường.
   */
  async calculateVolatility(symbol: string): Promise<MarketVolatilityData> {
    // 1. KIỂM TRA CACHE TRƯỚC
    const cached = this.volatilityCache.get(symbol); // Thử lấy dữ liệu biến động từ cache nội bộ.
    // Nếu có trong cache và chưa hết hạn (`VOLATILITY_CACHE_DURATION`).
    if (cached && Date.now() - cached.timestamp < this.VOLATILITY_CACHE_DURATION) {
      return cached.data; // Trả về dữ liệu từ cache ngay lập tức.
    }

    /**
     * `operation` (Hàm thực hiện tác vụ chính - Tính toán từ dữ liệu thật)
     * @returns Promise<MarketVolatilityData> - Dữ liệu biến động được tính toán.
     */
    const operation = async (): Promise<MarketVolatilityData> => {
      // Lấy dữ liệu nến 1 giờ cho 100 periods gần nhất.
      // Hàm `getCandleData` đã bao gồm xử lý lỗi và fallback cho việc lấy nến.
      const candles = await this.getCandleData(symbol, '1h', 100);

      // Xác thực dữ liệu nến đủ để tính toán.
      if (candles.length < 14) { // Cần ít nhất 14 nến cho ATR.
        throw new Error(`Insufficient candle data for ${symbol}: got ${candles.length}, need at least 14`);
      }

      // 2. TÍNH TOÁN CÁC CHỈ SỐ BIẾN ĐỘNG
      // ATR (Average True Range) - đo lường mức độ biến động trung bình.
      const atr = this.calculateATR(candles);

      // Phần trăm biến động - tính từ độ lệch chuẩn của lợi nhuận.
      const volatilityPercent = this.calculateVolatilityPercent(candles);

      // Phân tích xu hướng và độ mạnh của xu hướng.
      const { trend, strength } = this.analyzeTrend(candles);

      // Tính toán các mức hỗ trợ và kháng cự.
      const { supportLevel, resistanceLevel } = this.calculateSupportResistance(candles);

      // Tạo đối tượng `MarketVolatilityData`.
      const volatilityData: MarketVolatilityData = {
        symbol, atr, volatilityPercent, trend, strength, supportLevel, resistanceLevel
      };

      // 3. LƯU VÀO CACHE SAU KHI TÍNH TOÁN THÀNH CÔNG
      // Lưu dữ liệu biến động vào cache nội bộ của dịch vụ.
      this.volatilityCache.set(symbol, {
        data: volatilityData,
        timestamp: Date.now()
      });

      return volatilityData; // Trả về dữ liệu biến động.
    };

    /**
     * `fallback` (Hàm cung cấp dữ liệu dự phòng)
     * Chức năng: Được gọi khi `operation` thất bại. Cung cấp dữ liệu biến động dự phòng hợp lý.
     * @returns MarketVolatilityData - Dữ liệu biến động dự phòng.
     */
    const fallback = (): MarketVolatilityData => {
      console.warn(`[Fallback] Using fallback volatility data for ${symbol}`);
      return this.getFallbackVolatility(symbol); // Trả về dữ liệu biến động dự phòng đã định nghĩa.
    };

    // 4. THỰC THI `operation` VỚI `apiErrorHandler.executeWithCircuitBreaker`
    try {
      return await apiErrorHandler.executeWithCircuitBreaker(
        `calculateVolatility_${symbol}`, // Key định danh mạch ngắt cho tác vụ tính toán biến động này.
        operation,
        fallback
      );
    } catch (error) {
      console.error(`Error calculating volatility for ${symbol}:`, error);
      return fallback(); // Trả về dữ liệu dự phòng cuối cùng.
    }
  }

  /**
   * `calculateATR`
   * Chức năng: Tính toán chỉ báo ATR (Average True Range) từ một mảng các nến.
   * ATR đo lường mức độ biến động trong một khoảng thời gian nhất định (period).
   * @param candles : CandleData[] - Mảng dữ liệu nến.
   * @param period : number - Chu kỳ tính ATR (mặc định là 14).
   * @returns number - Giá trị ATR.
   */
  private calculateATR(candles: CandleData[], period: number = 14): number {
    // Yêu cầu đủ dữ liệu để tính ATR.
    if (candles.length < period + 1) {
      throw new Error('Insufficient data for ATR calculation');
    }

    const trueRanges: number[] = []; // Mảng lưu trữ các True Range.

    // Tính True Range cho mỗi nến: TR = Max(High-Low, |High-PrevClose|, |Low-PrevClose|)
    for (let i = 1; i < candles.length; i++) {
      const current = candles[i];
      const previous = candles[i - 1];

      const tr1 = current.high - current.low;
      const tr2 = Math.abs(current.high - previous.close);
      const tr3 = Math.abs(current.low - previous.close);

      trueRanges.push(Math.max(tr1, tr2, tr3)); // Lấy giá trị lớn nhất trong 3 TR.
    }

    // Tính ATR bằng SMA (Simple Moving Average) của các True Range gần nhất.
    const recentTRs = trueRanges.slice(-period); // Lấy `period` True Range cuối cùng.
    return recentTRs.reduce((sum, tr) => sum + tr, 0) / period; // Tổng chia cho số lượng.
  }

  /**
   * `calculateVolatilityPercent`
   * Chức năng: Tính toán phần trăm biến động thị trường dựa trên độ lệch chuẩn (standard deviation) của lợi nhuận.
   * Đây là một cách đo lường mức độ rủi ro của tài sản.
   * @param candles : CandleData[] - Mảng dữ liệu nến.
   * @returns number - Phần trăm biến động.
   */
  private calculateVolatilityPercent(candles: CandleData[]): number {
    if (candles.length < 2) return 3.0; // Giá trị dự phòng mặc định nếu không đủ dữ liệu.

    const returns: number[] = []; // Mảng lưu trữ lợi nhuận hàng ngày.
    // Tính lợi nhuận (returns) giữa các nến: `(Giá_đóng_cửa_hiện_tại - Giá_đóng_cửa_trước_đó) / Giá_đóng_cửa_trước_đó`
    for (let i = 1; i < candles.length; i++) {
      const returnValue = (candles[i].close - candles[i - 1].close) / candles[i - 1].close;
      returns.push(returnValue);
    }

    // Tính trung bình (mean) của các lợi nhuận.
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    // Tính phương sai (variance) của các lợi nhuận.
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    // Tính độ lệch chuẩn (standard deviation).
    const stdDev = Math.sqrt(variance);

    // Chuyển đổi độ lệch chuẩn sang phần trăm và tính toán theo năm (annualize).
    // Giả sử có 24 khung thời gian mỗi ngày (nếu là nến 1h). `Math.sqrt(24)` là yếu tố quy đổi.
    return stdDev * Math.sqrt(24) * 100;
  }

  /**
   * `analyzeTrend`
   * Chức năng: Phân tích xu hướng thị trường (tăng, giảm, đi ngang) và độ mạnh của xu hướng.
   * Sử dụng các đường trung bình động đơn giản (SMA) để xác định.
   * @param candles : CandleData[] - Mảng dữ liệu nến.
   * @returns { trend: 'bullish' | 'bearish' | 'sideways', strength: number } - Xu hướng và độ mạnh.
   */
  private analyzeTrend(candles: CandleData[]): { trend: 'bullish' | 'bearish' | 'sideways'; strength: number } {
    if (candles.length < 20) { // Cần ít nhất 20 nến cho phân tích trend.
      return { trend: 'sideways', strength: 50 }; // Dự phòng mặc định.
    }

    const recent = candles.slice(-20); // Lấy 20 nến gần nhất để phân tích.
    const firstPrice = recent[0].close; // Giá đóng cửa của nến đầu tiên trong chuỗi.
    const lastPrice = recent[recent.length - 1].close; // Giá đóng cửa của nến cuối cùng.
    const priceChange = (lastPrice - firstPrice) / firstPrice; // Phần trăm thay đổi giá tổng thể.

    // Tính SMA 10 (đường trung bình động 10 kỳ) và SMA 20.
    const sma10 = recent.slice(-10).reduce((sum, c) => sum + c.close, 0) / 10;
    const sma20 = recent.reduce((sum, c) => sum + c.close, 0) / 20;

    let trend: 'bullish' | 'bearish' | 'sideways';
    let strength: number;

    // Logic xác định xu hướng:
    if (priceChange > 0.02 && sma10 > sma20) { // Tăng > 2% và SMA ngắn hạn trên SMA dài hạn.
      trend = 'bullish'; // Xu hướng tăng.
      strength = Math.min(100, 50 + Math.abs(priceChange) * 1000); // Độ mạnh tăng theo mức thay đổi giá.
    } else if (priceChange < -0.02 && sma10 < sma20) { // Giảm < 2% và SMA ngắn hạn dưới SMA dài hạn.
      trend = 'bearish'; // Xu hướng giảm.
      strength = Math.min(100, 50 + Math.abs(priceChange) * 1000);
    } else {
      trend = 'sideways'; // Đi ngang.
      strength = 50 - Math.abs(priceChange) * 500; // Độ mạnh giảm nếu giá ít thay đổi.
    }

    return { trend, strength: Math.max(0, Math.min(100, strength)) }; // Đảm bảo độ mạnh trong khoảng 0-100.
  }

  /**
   * `calculateSupportResistance`
   * Chức năng: Tính toán các mức hỗ trợ (support) và kháng cự (resistance) đơn giản từ dữ liệu nến.
   * Hỗ trợ là mức giá mà tài sản có xu hướng dừng giảm, kháng cự là mức giá mà tài sản có xu hướng dừng tăng.
   * @param candles : CandleData[] - Mảng dữ liệu nến.
   * @returns { supportLevel: number, resistanceLevel: number } - Các mức hỗ trợ và kháng cự.
   */
  private calculateSupportResistance(candles: CandleData[]): { supportLevel: number; resistanceLevel: number } {
    if (candles.length < 20) { // Cần ít nhất 20 nến.
      const currentPrice = candles[candles.length - 1].close; // Lấy giá đóng cửa cuối cùng.
      return {
        supportLevel: currentPrice * 0.95, // Mức hỗ trợ dự phòng (5% dưới giá hiện tại).
        resistanceLevel: currentPrice * 1.05 // Mức kháng cự dự phòng (5% trên giá hiện tại).
      };
    }

    const recent = candles.slice(-50); // Lấy 50 nến gần nhất để phân tích.
    const highs = recent.map(c => c.high).sort((a, b) => b - a); // Sắp xếp giá cao nhất giảm dần.
    const lows = recent.map(c => c.low).sort((a, b) => a - b);   // Sắp xếp giá thấp nhất tăng dần.

    // Mức hỗ trợ: Tính trung bình của 10% các giá thấp nhất trong chuỗi.
    const supportCount = Math.max(1, Math.floor(lows.length * 0.1));
    const supportLevel = lows.slice(0, supportCount).reduce((sum, low) => sum + low, 0) / supportCount;

    // Mức kháng cự: Tính trung bình của 10% các giá cao nhất trong chuỗi.
    const resistanceCount = Math.max(1, Math.floor(highs.length * 0.1));
    const resistanceLevel = highs.slice(0, resistanceCount).reduce((sum, high) => sum + high, 0) / resistanceCount;

    return { supportLevel, resistanceLevel }; // Trả về các mức hỗ trợ và kháng cự đã tính.
  }

  /**
   * `getFallbackPrice`
   * Chức năng: Cung cấp một giá dự phòng (default price) cho một cặp tiền tệ khi việc gọi API thất bại.
   * Đây là một biện pháp an toàn để đảm bảo ứng dụng vẫn có thể hiển thị dữ liệu.
   * @param symbol : string - Biểu tượng cặp tiền tệ.
   * @returns number - Giá dự phòng.
   */
  private getFallbackPrice(symbol: string): number {
    const baseCurrency = symbol.split('/')[0]; // Lấy phần tài sản cơ sở (ví dụ: "BTC" từ "BTC/USDT").

    // Định nghĩa các giá dự phòng cho các đồng tiền phổ biến.
    const fallbackPrices: Record<string, number> = {
      'BTC': 109000,   // Bitcoin.
      'ETH': 3800,     // Ethereum.
      'PEPE': 0.00002, // Pepe (token micro-cap).
      'DOGE': 0.08,    // Dogecoin.
      'SHIB': 0.000012, // Shiba Inu.
      'ADA': 0.45,     // Cardano.
      'SOL': 100,      // Solana.
      'MATIC': 1.0     // Polygon.
    };

    return fallbackPrices[baseCurrency] || 100; // Trả về giá dự phòng nếu có, hoặc 100 USD nếu không tìm thấy.
  }

  /**
   * `getFallbackVolatility`
   * Chức năng: Cung cấp dữ liệu biến động thị trường dự phòng thông minh hơn.
   * Nó cố gắng sử dụng giá cuối cùng thành công (từ cache) để tính toán ATR và phần trăm biến động.
   * @param symbol : string - Biểu tượng cặp tiền tệ.
   * @returns MarketVolatilityData - Dữ liệu biến động dự phòng.
   */
  private getFallbackVolatility(symbol: string): MarketVolatilityData {
    const baseCurrency = symbol.split('/')[0]; // Lấy tài sản cơ sở.

    // Cố gắng lấy giá cuối cùng thành công từ `apiErrorHandler` để làm giá cơ sở cho fallback.
    const lastSuccessfulPrice = apiErrorHandler.getLastSuccessfulPrice(symbol);
    const currentPrice = lastSuccessfulPrice || this.getFallbackPrice(symbol); // Nếu không có, dùng giá dự phòng mặc định.

    // Định nghĩa các profile biến động dự phòng cho các đồng tiền khác nhau.
    const fallbackProfiles: Record<string, { baseVolatility: number; atrMultiplier: number; strength: number }> = {
      'BTC': { baseVolatility: 2.5, atrMultiplier: 0.02, strength: 75 },
      'ETH': { baseVolatility: 3.0, atrMultiplier: 0.025, strength: 70 },
      'PEPE': { baseVolatility: 8.0, atrMultiplier: 0.15, strength: 45 },
      'DOGE': { baseVolatility: 6.0, atrMultiplier: 0.08, strength: 50 },
      'SHIB': { baseVolatility: 7.5, atrMultiplier: 0.12, strength: 40 },
      'ADA': { baseVolatility: 4.5, atrMultiplier: 0.06, strength: 65 },
      'SOL': { baseVolatility: 5.0, atrMultiplier: 0.07, strength: 70 },
      'MATIC': { baseVolatility: 5.5, atrMultiplier: 0.08, strength: 60 }
    };

    const profile = fallbackProfiles[baseCurrency] || { baseVolatility: 4.0, atrMultiplier: 0.05, strength: 60 }; // Profile dự phòng nếu không tìm thấy.

    // Trả về dữ liệu biến động dự phòng dựa trên profile đã chọn.
    return {
      symbol,
      atr: currentPrice * profile.atrMultiplier,          // ATR được ước tính từ giá hiện tại và multiplier.
      volatilityPercent: profile.baseVolatility,          // Phần trăm biến động cơ bản.
      trend: 'sideways' as const,                        // Xu hướng mặc định là đi ngang.
      strength: profile.strength,                         // Độ mạnh của xu hướng.
      supportLevel: currentPrice * 0.95,                  // Mức hỗ trợ ước tính.
      resistanceLevel: currentPrice * 1.05                // Mức kháng cự ước tính.
    };
  }

  /**
   * `clearCache`
   * Chức năng: Xóa tất cả các cache nội bộ (priceCache, volatilityCache) và cache của `apiErrorHandler`.
   * Hữu ích cho việc kiểm thử hoặc khi cần làm mới hoàn toàn dữ liệu.
   */
  clearCache(): void {
    this.priceCache.clear();       // Xóa cache giá.
    this.volatilityCache.clear();  // Xóa cache biến động.
    apiErrorHandler.clearCache();  // Xóa cache của `apiErrorHandler`.
    console.log('[TradingApiService] All caches cleared'); // Log thông báo.
  }

  /**
   * `getApiMetrics`
   * Chức năng: Lấy các chỉ số hiệu suất và lỗi từ `apiErrorHandler`.
   * Giúp theo dõi sức khỏe và hiệu suất của các lời gọi API.
   * @returns Record<string, any> - Đối tượng chứa tất cả các chỉ số.
   */
  getApiMetrics(): Record<string, any> {
    return apiErrorHandler.getAllMetrics(); // Trả về tất cả các chỉ số từ `apiErrorHandler`.
  }

  /**
   * `resetCircuitBreaker`
   * Chức năng: Đặt lại (reset) một mạch ngắt (circuit breaker) cụ thể trong `apiErrorHandler`.
   * Khi một mạch ngắt được reset, nó sẽ chuyển về trạng thái `CLOSED` và cho phép các yêu cầu đi qua trở lại.
   * Hữu ích cho việc debug hoặc phục hồi thủ công sau khi một vấn đề được khắc phục.
   * @param operation : string - Tên của tác vụ/API mà mạch ngắt đang giám sát (ví dụ: "getCurrentPrice_BTC/USDT").
   * @param symbol : string - (Tùy chọn) Biểu tượng cặp tiền tệ, nếu mạch ngắt liên quan đến một symbol cụ thể.
   */
  resetCircuitBreaker(operation: string, symbol?: string): void {
    // Xây dựng key đầy đủ cho mạch ngắt.
    const key = symbol ? `${operation}_${symbol}` : operation;
    apiErrorHandler.resetCircuitBreaker(key); // Gọi phương thức reset trong `apiErrorHandler`.
  }

  /**
   * `getHealthStatus`
   * Chức năng: Trả về trạng thái sức khỏe tổng thể của các hoạt động API.
   * Nó tổng hợp các chỉ số từ `apiErrorHandler` để đưa ra đánh giá chung.
   * @returns { overall: 'healthy' | 'degraded' | 'critical', details: Record<string, any> } - Trạng thái sức khỏe tổng thể và chi tiết.
   */
  getHealthStatus(): {
    overall: 'healthy' | 'degraded' | 'critical'; // Trạng thái tổng thể: khỏe mạnh, suy giảm, nguy cấp.
    details: Record<string, any>; // Chi tiết trạng thái của từng hoạt động API.
  } {
    const metrics = this.getApiMetrics(); // Lấy tất cả các chỉ số hiệu suất API.
    let healthyCount = 0; // Đếm số lượng hoạt động API khỏe mạnh.
    let totalCount = 0;   // Tổng số lượng hoạt động API được giám sát.
    const details: Record<string, any> = {}; // Đối tượng chứa chi tiết từng hoạt động.

    // Lặp qua từng chỉ số (key-value pair) trong `metrics`.
    Object.entries(metrics).forEach(([key, metric]) => {
      totalCount++; // Tăng tổng số lượng.
      // Tính toán tỷ lệ thành công của mỗi hoạt động.
      const successRate = metric.totalRequests > 0
        ? (metric.successfulRequests / metric.totalRequests) * 100
        : 100; // Nếu không có yêu cầu, coi là 100% thành công.

      // Lưu trữ chi tiết của hoạt động này vào đối tượng `details`.
      details[key] = {
        successRate: Math.round(successRate * 100) / 100, // Tỷ lệ thành công (làm tròn).
        totalRequests: metric.totalRequests,              // Tổng số yêu cầu.
        averageResponseTime: Math.round(metric.averageResponseTime), // Thời gian phản hồi trung bình (làm tròn).
        circuitBreakerTrips: metric.circuitBreakerTrips, // Số lần mạch ngắt đã được kích hoạt.
        lastError: metric.lastError                      // Lỗi gần nhất.
      };

      // Nếu tỷ lệ thành công của hoạt động này từ 90% trở lên, coi là "khỏe mạnh".
      if (successRate >= 90) healthyCount++;
    });

    let overall: 'healthy' | 'degraded' | 'critical' = 'healthy'; // Mặc định trạng thái tổng thể là khỏe mạnh.
    if (totalCount > 0) { // Nếu có bất kỳ hoạt động nào được giám sát.
      const healthPercentage = (healthyCount / totalCount) * 100; // Tính tỷ lệ các hoạt động khỏe mạnh.
      if (healthPercentage < 50) {
        overall = 'critical'; // Dưới 50% khỏe mạnh => Nguy cấp.
      } else if (healthPercentage < 80) {
        overall = 'degraded'; // Dưới 80% khỏe mạnh => Suy giảm.
      }
    }

    return { overall, details }; // Trả về trạng thái tổng thể và chi tiết.
  }
}

// =========================================================================
// EXPORT INSTANCE SINGLETON
// =========================================================================

// Export instance singleton của `TradingApiService`.
// Đảm bảo rằng chỉ có một instance của dịch vụ này được sử dụng trên toàn bộ ứng dụng.
export const tradingApiService = TradingApiService.getInstance();