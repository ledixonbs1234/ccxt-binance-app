// Import các module và thư viện cần thiết.
import { NextRequest, NextResponse } from 'next/server'; // Next.js server-side utilities cho API Routes (NextRequest thay thế Request trong app router).
import ccxt, { Ticker } from 'ccxt';                     // Thư viện CCXT để giao tiếp với các sàn giao dịch crypto, import kiểu Ticker của CCXT.
import { apiErrorHandler } from '@/lib/apiErrorHandler';   // Dịch vụ xử lý lỗi API tập trung (circuit breaker, retry).

// =========================================================================
// CẤU HÌNH RATE LIMITING (HẠN CHẾ SỐ LƯỢNG YÊU CẦU) CHO API `ticker` ĐƠN LẺ
// =========================================================================

// `RATE_LIMIT_WINDOW`: Thời gian cửa sổ để tính giới hạn (1 phút = 60000 ms).
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 phút.

// `MAX_REQUESTS_PER_WINDOW`: Số lượng yêu cầu tối đa cho phép trong cửa sổ thời gian.
const MAX_REQUESTS_PER_WINDOW = 100; // 100 yêu cầu mỗi phút cho mỗi client (IP).

// `requestCounts`: Một Map để lưu trữ số lượng yêu cầu của mỗi client trong cửa sổ thời gian.
// Key là `clientId` (thường là IP của client), Value là một object chứa `count` (số request) và `resetTime` (thời gian reset counter).
const requestCounts = new Map<string, { count: number; resetTime: number }>();

/**
 * `checkRateLimit`
 * Chức năng: Kiểm tra xem một client có vượt quá giới hạn số yêu cầu cho phép trong một phút hay không.
 * @param clientId : string - Định danh của client (thường là IP address được lấy từ `x-forwarded-for` header).
 * @returns boolean - `true` nếu yêu cầu được phép (chưa vượt giới hạn), `false` nếu đã vượt giới hạn.
 */
function checkRateLimit(clientId: string): boolean {
  const now = Date.now(); // Lấy thời gian hiện tại (milliseconds từ epoch).
  const clientData = requestCounts.get(clientId); // Lấy dữ liệu về client từ Map.

  // Kiểm tra nếu client chưa có dữ liệu HOẶC đã quá thời gian reset (1 phút).
  if (!clientData || now > clientData.resetTime) {
    // Nếu vậy, reset lại counter cho client: đặt số lượng yêu cầu là 1 và thời gian reset là 1 phút kể từ bây giờ.
    requestCounts.set(clientId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true; // Cho phép yêu cầu.
  }

  // Nếu client đã có dữ liệu và chưa quá thời gian reset, kiểm tra xem đã đạt giới hạn chưa.
  if (clientData.count >= MAX_REQUESTS_PER_WINDOW) {
    return false; // Đã vượt quá giới hạn, không cho phép yêu cầu.
  }

  // Nếu chưa đạt giới hạn, tăng số lượng yêu cầu của client lên 1.
  clientData.count++;
  return true; // Cho phép yêu cầu.
}

// =========================================================================
// HÀM XỬ LÝ YÊU CẦU GET CHO API `ticker`
// =========================================================================

/**
 * `GET`
 * Chức năng: Xử lý yêu cầu HTTP GET đến API route `/api/ticker`.
 * Hàm này lấy dữ liệu ticker cho một cặp tiền tệ cụ thể, có tích hợp rate limiting,
 * xử lý lỗi nâng cao (circuit breaker, retry) và cơ chế fallback.
 * @param request : Request - Đối tượng yêu cầu HTTP từ Next.js (trong App Router, đây là kiểu `Request`).
 * @returns NextResponse - Đối tượng phản hồi Next.js, chứa dữ liệu ticker hoặc thông báo lỗi.
 */
export async function GET(request: Request) {
  const startTime = Date.now(); // Ghi lại thời gian bắt đầu xử lý yêu cầu để tính toán thời gian phản hồi.

  // 1. PHÂN TÍCH THAM SỐ `symbol` TỪ URL
  const { searchParams } = new URL(request.url); // Lấy các tham số truy vấn từ URL của yêu cầu.
  const symbol = searchParams.get('symbol') || 'BTC/USDT'; // Lấy giá trị của tham số 'symbol', mặc định là 'BTC/USDT'.

  // 2. KIỂM TRA RATE LIMITING
  // Lấy `clientId` từ header `x-forwarded-for` (thường chứa IP của client khi chạy sau proxy/load balancer).
  // Nếu không có, dùng 'unknown'.
  const clientId = request.headers.get('x-forwarded-for') || 'unknown';

  // Gọi hàm `checkRateLimit` để kiểm tra xem client có vượt quá giới hạn hay không.
  if (!checkRateLimit(clientId)) {
    // Nếu đã vượt giới hạn, trả về lỗi HTTP 429 (Too Many Requests).
    return NextResponse.json({
      error: 'Rate limit exceeded', // Thông báo lỗi chính.
      retryAfter: 60,               // Thời gian (giây) client nên đợi trước khi thử lại.
      message: `Too many requests. Maximum ${MAX_REQUESTS_PER_WINDOW} requests per minute allowed.` // Mô tả chi tiết lỗi.
    }, {
      status: 429, // Mã trạng thái HTTP: Too Many Requests.
      headers: {
        'Retry-After': '60', // Header HTTP khuyến nghị client thử lại sau 60 giây.
        'X-RateLimit-Limit': MAX_REQUESTS_PER_WINDOW.toString(), // Thông tin về giới hạn cho client.
        'X-RateLimit-Remaining': '0',                           // Số yêu cầu còn lại (0 vì đã vượt).
        'X-RateLimit-Reset': Math.ceil((Date.now() + RATE_LIMIT_WINDOW) / 1000).toString() // Thời gian (Unix timestamp) giới hạn sẽ được reset.
      }
    });
  }

  /**
   * `operation` (Hàm thực hiện tác vụ chính - Gọi API thật của sàn giao dịch)
   * Đây là hàm sẽ được `apiErrorHandler` gọi. Nó chứa logic để lấy dữ liệu ticker từ sàn Binance.
   * @returns Promise<Ticker> - Đối tượng Ticker từ CCXT.
   */
  const operation = async (): Promise<Ticker> => {
    // Khởi tạo đối tượng Binance exchange từ thư viện CCXT.
    const binance = new ccxt.binance({
      // `apiKey` và `secret` bị comment lại (thường không cần cho public data như ticker).
      // Nếu API này cần xác thực, bạn sẽ cần bật chúng lên và đảm bảo chúng được lấy từ biến môi trường.
      // apiKey: process.env.BINANCE_API_KEY!,
      // secret: process.env.BINANCE_SECRET_KEY!,
      options: { adjustForTimeDifference: true }, // Tùy chọn để điều chỉnh độ lệch thời gian (quan trọng cho API Binance).
      enableRateLimit: true,                     // Bật tính năng giới hạn tốc độ tích hợp của CCXT.
    });

    // Tải thông tin thị trường (symbols, min/max amount, precision, v.v.) từ sàn.
    // Điều này là cần thiết để xác thực symbol và đảm bảo dữ liệu đúng cấu trúc.
    await binance.loadMarkets();

    // Kiểm tra xem cặp tiền tệ `symbol` có tồn tại trên sàn hay không.
    if (!binance.markets[symbol]) {
      // Nếu symbol không tồn tại, tạo một lỗi và gắn trạng thái HTTP 400 (Bad Request).
      const error = new Error(`Symbol ${symbol} not found`);
      (error as any).status = 400; // Gắn trạng thái HTTP vào đối tượng lỗi.
      // Thêm danh sách các symbol khả dụng để debug hoặc gợi ý cho client.
      (error as any).availableSymbols = Object.keys(binance.markets)
                                              .filter(s => s.includes('USDT')) // Lọc các cặp USDT.
                                              .slice(0, 10);                   // Chỉ lấy 10 cặp đầu tiên.
      throw error; // Ném lỗi để `apiErrorHandler` bắt và xử lý.
    }

    // Gọi phương thức `fetchTicker` của CCXT để lấy dữ liệu ticker cho `symbol` đã cho.
    const ticker = await binance.fetchTicker(symbol);
    return ticker; // Trả về đối tượng ticker thô từ CCXT.
  };

  /**
   * `fallback` (Hàm cung cấp dữ liệu dự phòng)
   * Chức năng: Được `apiErrorHandler` gọi khi `operation` thất bại (ví dụ: lỗi mạng, server down, rate limit).
   * Nó cung cấp một đối tượng `Ticker` giả định để ứng dụng vẫn có thể hiển thị dữ liệu mà không bị lỗi hoàn toàn.
   * @returns Ticker - Đối tượng Ticker giả định.
   */
  const fallback = (): Ticker => {
    console.warn(`[Ticker API] Using fallback data for ${symbol}`); // Log cảnh báo khi dùng dữ liệu dự phòng.

    // 1. ƯU TIÊN SỬ DỤNG GIÁ CUỐI CÙNG THÀNH CÔNG TỪ `apiErrorHandler`.
    // `apiErrorHandler.getLastSuccessfulPrice(symbol)`: Hàm này lấy giá mà API đã trả về thành công gần đây nhất (nếu còn trong thời gian hiệu lực).
    const lastPrice = apiErrorHandler.getLastSuccessfulPrice(symbol);
    // 2. NẾU KHÔNG CÓ GIÁ THÀNH CÔNG GẦN ĐÂY, DÙNG GIÁ MẶC ĐỊNH DỰ PHÒNG.
    // `getFallbackPrice(symbol)`: Hàm này cung cấp một giá dự phòng mặc định cho các đồng coin phổ biến.
    const basePrice = lastPrice || getFallbackPrice(symbol);

    // Trả về một đối tượng `Ticker` giả định với các giá trị được ước tính dựa trên `basePrice`.
    return {
      info: {},                   // Thông tin thô từ sàn (để trống).
      symbol,                     // Symbol của cặp tiền tệ.
      timestamp: Date.now(),      // Thời gian hiện tại.
      datetime: new Date().toISOString(), // Thời gian hiện tại ở định dạng ISO.
      high: basePrice * 1.05,     // Giá cao nhất giả định (5% trên giá cơ sở).
      low: basePrice * 0.95,      // Giá thấp nhất giả định (5% dưới giá cơ sở).
      bid: basePrice * 0.999,     // Giá mua giả định (0.1% dưới giá cơ sở).
      bidVolume: undefined,       // Khối lượng mua không xác định.
      ask: basePrice * 1.001,     // Giá bán giả định (0.1% trên giá cơ sở).
      askVolume: undefined,       // Khối lượng bán không xác định.
      vwap: undefined,            // Volume-Weighted Average Price không xác định.
      open: basePrice,            // Giá mở cửa giả định bằng giá cơ sở.
      close: basePrice,           // Giá đóng cửa giả định bằng giá cơ sở.
      last: basePrice,            // Giá cuối cùng giả định bằng giá cơ sở.
      previousClose: undefined,   // Giá đóng cửa trước đó không xác định.
      change: 0,                  // Thay đổi giá 0.
      percentage: 0,              // Phần trăm thay đổi 0%.
      average: basePrice,         // Giá trung bình giả định bằng giá cơ sở.
      baseVolume: 1000000,        // Khối lượng base asset giả định (1 triệu).
      quoteVolume: 1000000 * basePrice, // Khối lượng quote asset giả định.
      indexPrice: undefined,      // Giá chỉ số không xác định.
      markPrice: undefined        // Giá đánh dấu không xác định.
    };
  };

  // 3. THỰC THI `operation` VỚI `apiErrorHandler.executeWithCircuitBreaker`
  try {
    // `apiErrorHandler.executeWithCircuitBreaker` là trái tim của việc xử lý lỗi nâng cao.
    // Nó sẽ cố gắng chạy `operation` nhiều lần (retry) nếu có lỗi tạm thời,
    // sử dụng mẫu Circuit Breaker để "mở mạch" và ngăn các yêu cầu mới nếu có quá nhiều lỗi liên tiếp,
    // và gọi hàm `fallback` khi `operation` cuối cùng thất bại.
    const result = await apiErrorHandler.executeWithCircuitBreaker(
      `ticker_api_${symbol}`, // Key định danh duy nhất cho tác vụ này (ví dụ: `ticker_api_BTC/USDT`).
                               // Key này được `apiErrorHandler` sử dụng để quản lý trạng thái của mạch ngắt và metrics.
      operation,                 // Hàm `operation` chứa logic gọi API thật.
      fallback,                  // Hàm `fallback` cung cấp dữ liệu dự phòng.
      {                            // Tùy chọn cấu hình cho cơ chế retry và circuit breaker:
        maxRetries: 2,           // Tối đa 2 lần thử lại nếu thất bại.
        baseDelay: 500,          // Độ trễ cơ bản là 500ms giữa các lần thử lại.
        retryableStatuses: [429, 500, 502, 503, 504] // Các mã trạng thái HTTP có thể thử lại.
      }
    );

    // 4. CACHE DỮ LIỆU VÀ TRẢ VỀ PHẢN HỒI THÀNH CÔNG

    // Lưu trữ giá cuối cùng thành công vào cache của `apiErrorHandler`.
    // Giá này sẽ được sử dụng làm dữ liệu dự phòng trong tương lai nếu có lỗi API.
    if (result.last && !isNaN(result.last)) {
      apiErrorHandler.cacheSuccessfulPrice(symbol, result.last);
    }

    const responseTime = Date.now() - startTime; // Tính toán thời gian phản hồi của API.

    // Trả về phản hồi JSON cho client với dữ liệu ticker và thông tin metadata.
    return NextResponse.json({
      ...result, // Dữ liệu ticker đã nhận được (hoặc từ fallback).
      _metadata: {
        responseTime,                  // Thời gian phản hồi.
        timestamp: new Date().toISOString(), // Thời gian phản hồi.
        cached: false                  // Đánh dấu là không phải từ cache nội bộ của API route này (mặc dù `tradingApiService` có thể dùng cache).
      }
    }, {
      status: 200, // Mã trạng thái HTTP 200 (OK).
      headers: {
        'X-Response-Time': responseTime.toString(), // Header tùy chỉnh về thời gian phản hồi.
        'Cache-Control': 'public, max-age=5'       // Chỉ thị cache cho trình duyệt (cache dữ liệu này 5 giây).
      }
    });

  } catch (error: any) {
    // 5. XỬ LÝ LỖI CUỐI CÙNG (SAU KHI CÁC CƠ CHẾ KHÁC ĐÃ THẤT BẠI)
    console.error('Ticker API error:', error); // Log lỗi chi tiết ra console server.

    const responseTime = Date.now() - startTime; // Tính thời gian phản hồi cho lỗi.
    const statusCode = error.status || 500;     // Lấy mã trạng thái HTTP từ lỗi (nếu có) hoặc mặc định là 500 (Internal Server Error).

    // Xây dựng đối tượng phản hồi lỗi.
    const errorResponse = {
      success: false,                                          // Đánh dấu yêu cầu thất bại.
      error: error.message || 'Internal server error',         // Thông báo lỗi cho client.
      symbol,                                                  // Symbol mà yêu cầu thất bại.
      _metadata: {
        responseTime,                                          // Thời gian phản hồi.
        timestamp: new Date().toISOString(),                   // Thời gian lỗi xảy ra.
        errorType: error.constructor.name                      // Loại lỗi (ví dụ: "Error", "TypeError").
      }
    };

    // Nếu lỗi có mã 400 (Bad Request) và có danh sách các symbol khả dụng, thêm vào phản hồi.
    if (statusCode === 400 && error.availableSymbols) {
      (errorResponse as any).availableSymbols = error.availableSymbols;
    }

    // Trả về phản hồi lỗi JSON cho client.
    return NextResponse.json(errorResponse, {
      status: statusCode, // Mã trạng thái HTTP của lỗi.
      headers: {
        'X-Response-Time': responseTime.toString() // Header tùy chỉnh về thời gian phản hồi.
      }
    });
  }
}

// =========================================================================
// HÀM TRỢ GIÚP `getFallbackPrice`
// =========================================================================

/**
 * `getFallbackPrice`
 * Chức năng: Cung cấp một giá dự phòng mặc định cho các cặp tiền tệ khi không thể lấy được giá thật
 * và không có giá nào được cache thành công gần đây.
 * @param symbol : string - Biểu tượng cặp tiền tệ.
 * @returns number - Giá dự phòng mặc định.
 */
function getFallbackPrice(symbol: string): number {
  const baseCurrency = symbol.split('/')[0]; // Tách symbol để lấy phần tài sản cơ sở (ví dụ: "BTC" từ "BTC/USDT").

  // Định nghĩa một Map chứa các giá dự phòng cho các đồng tiền phổ biến.
  const fallbackPrices: Record<string, number> = {
    'BTC': 109000,   // Giá dự phòng cho Bitcoin.
    'ETH': 3800,     // Giá dự phòng cho Ethereum.
    'PEPE': 0.00002, // Giá dự phòng cho Pepe (token micro-cap).
    'DOGE': 0.08,    // Giá dự phòng cho Dogecoin.
    'SHIB': 0.000012, // Giá dự phòng cho Shiba Inu.
    'ADA': 0.45,     // Giá dự phòng cho Cardano.
    'SOL': 100,      // Giá dự phòng cho Solana.
    'MATIC': 1.0     // Giá dự phòng cho Polygon.
  };

  // Trả về giá dự phòng tương ứng với `baseCurrency` nếu tìm thấy,
  // nếu không, trả về giá mặc định là 100.
  return fallbackPrices[baseCurrency] || 100;
}