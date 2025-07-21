// Import các module và thư viện cần thiết.
import { NextRequest, NextResponse } from 'next/server'; // Next.js server-side utilities cho API Routes.
import { tradingApiService } from '@/lib/tradingApiService'; // Dịch vụ giao dịch API tùy chỉnh, xử lý giao tiếp với sàn.
import { priceCache, CacheKeys } from '@/lib/cacheService'; // Dịch vụ caching cho dữ liệu giá, giúp tối ưu hiệu suất.
import { apiErrorHandler } from '@/lib/apiErrorHandler';     // Dịch vụ xử lý lỗi API tập trung (circuit breaker, retry).

// =========================================================================
// CẤU HÌNH RATE LIMITING (HẠN CHẾ SỐ LƯỢNG YÊU CẦU) CHO API batch-ticker
// =========================================================================

// `BATCH_RATE_LIMIT`: Hằng số định nghĩa số lượng yêu cầu tối đa cho phép trong một phút.
// API này được thiết kế để phục vụ nhiều symbols cùng lúc, nên có thể có giới hạn cao hơn API `ticker` đơn lẻ.
const BATCH_RATE_LIMIT = 30; // 30 yêu cầu mỗi phút.

// `batchRequestCounts`: Một Map để lưu trữ số lượng yêu cầu của mỗi client trong cửa sổ thời gian (1 phút).
// Key là `clientId` (thường là IP của client), Value là một object chứa `count` (số request) và `resetTime` (thời gian reset counter).
const batchRequestCounts = new Map<string, { count: number; resetTime: number }>();

/**
 * `checkBatchRateLimit`
 * Chức năng: Kiểm tra xem một client có vượt quá giới hạn số yêu cầu cho phép trong một phút hay không.
 * @param clientId : string - Định danh của client (thường là IP address).
 * @returns boolean - `true` nếu yêu cầu được phép (chưa vượt giới hạn), `false` nếu đã vượt giới hạn.
 */
function checkBatchRateLimit(clientId: string): boolean {
  const now = Date.now(); // Lấy thời gian hiện tại (milliseconds từ epoch).
  const clientData = batchRequestCounts.get(clientId); // Lấy dữ liệu về client từ Map.

  // Kiểm tra nếu client chưa có dữ liệu HOẶC đã quá thời gian reset (1 phút).
  if (!clientData || now > clientData.resetTime) {
    // Nếu vậy, reset lại counter cho client: đặt số lượng yêu cầu là 1 và thời gian reset là 1 phút kể từ bây giờ.
    batchRequestCounts.set(clientId, { count: 1, resetTime: now + 60000 }); // 60000 ms = 1 phút.
    return true; // Cho phép yêu cầu.
  }

  // Nếu client đã có dữ liệu và chưa quá thời gian reset, kiểm tra xem đã đạt giới hạn chưa.
  if (clientData.count >= BATCH_RATE_LIMIT) {
    return false; // Đã vượt quá giới hạn, không cho phép yêu cầu.
  }

  // Nếu chưa đạt giới hạn, tăng số lượng yêu cầu của client lên 1.
  clientData.count++;
  return true; // Cho phép yêu cầu.
}

// =========================================================================
// HÀM XỬ LÝ YÊU CẦU GET CHO API batch-ticker
// =========================================================================

/**
 * `GET`
 * Chức năng: Xử lý yêu cầu HTTP GET đến API route `/api/batch-ticker`.
 * Hàm này lấy dữ liệu ticker cho nhiều cặp tiền tệ cùng lúc, có tích hợp caching và rate limiting.
 * @param request : NextRequest - Đối tượng yêu cầu Next.js, chứa thông tin về yêu cầu HTTP.
 * @returns NextResponse - Đối tượng phản hồi Next.js, chứa dữ liệu hoặc thông báo lỗi.
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now(); // Ghi lại thời gian bắt đầu xử lý yêu cầu để tính toán thời gian phản hồi.

  try {
    // 1. PHÂN TÍCH VÀ XÁC THỰC THAM SỐ `symbols` TRÊN URL
    const { searchParams } = new URL(request.url); // Lấy các tham số truy vấn từ URL.
    const symbolsParam = searchParams.get('symbols'); // Lấy giá trị của tham số 'symbols'.

    // Kiểm tra nếu tham số 'symbols' không được cung cấp.
    if (!symbolsParam) {
      return NextResponse.json({
        success: false,
        error: 'Symbols parameter is required', // Lỗi: thiếu tham số.
        example: '/api/batch-ticker?symbols=BTC/USDT,ETH/USDT,PEPE/USDT' // Ví dụ sử dụng đúng.
      }, { status: 400 }); // Trả về lỗi Bad Request (400).
    }

    // Phân tích chuỗi symbols (ví dụ: "BTC/USDT,ETH/USDT") thành một mảng các symbol.
    const symbols = symbolsParam.split(',') // Tách chuỗi bằng dấu phẩy.
                                .map(s => s.trim()) // Xóa khoảng trắng thừa ở đầu/cuối mỗi symbol.
                                .filter(s => s.length > 0); // Lọc bỏ các chuỗi rỗng.

    // Kiểm tra nếu không có symbol hợp lệ nào được cung cấp.
    if (symbols.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'At least one valid symbol is required' // Lỗi: yêu cầu ít nhất một symbol.
      }, { status: 400 }); // Trả về lỗi Bad Request (400).
    }

    // Kiểm tra giới hạn số lượng symbols yêu cầu trong một lần.
    if (symbols.length > 20) {
      return NextResponse.json({
        success: false,
        error: 'Too many symbols requested', // Lỗi: quá nhiều symbol.
        maxSymbols: 20,                       // Giới hạn tối đa là 20.
        providedSymbols: symbols.length       // Số lượng symbol đã cung cấp.
      }, { status: 400 }); // Trả về lỗi Bad Request (400).
    }

    // 2. KIỂM TRA RATE LIMITING
    // Lấy `clientId` từ header `x-forwarded-for` (thường chứa IP của client, đặc biệt khi chạy sau proxy/load balancer).
    // Nếu không có, dùng 'unknown'.
    const clientId = request.headers.get('x-forwarded-for') || 'unknown';

    // Gọi hàm `checkBatchRateLimit` để kiểm tra giới hạn.
    if (!checkBatchRateLimit(clientId)) {
      // Nếu đã vượt giới hạn, trả về lỗi Too Many Requests (429).
      return NextResponse.json({
        success: false,
        error: 'Rate limit exceeded for batch ticker API', // Lỗi: vượt quá giới hạn yêu cầu.
        retryAfter: 60,                                    // Client nên thử lại sau 60 giây.
        maxRequestsPerMinute: BATCH_RATE_LIMIT             // Giới hạn là 30 request/phút.
      }, {
        status: 429, // Mã trạng thái HTTP 429.
        headers: { 'Retry-After': '60' } // Thêm header `Retry-After`.
      });
    }

    // 3. XỬ LÝ CACHING (Kiểm tra cache trước khi gọi API thật)
    console.log(`[BATCH-TICKER] Fetching data for symbols: ${symbols.join(', ')}`); // Log để debug.

    // Tạo cache key duy nhất cho tập hợp các symbols này (sắp xếp symbols để đảm bảo cache key nhất quán).
    const cacheKey = CacheKeys.batchTicker(symbols);
    const cachedResult = priceCache.get(cacheKey); // Thử lấy kết quả từ cache.

    // Nếu tìm thấy kết quả trong cache và chưa hết hạn.
    if (cachedResult) {
      console.log(`[BATCH-TICKER] Cache hit for ${symbols.join(', ')} (${Date.now() - startTime}ms)`); // Log: cache hit.
      // Trả về dữ liệu từ cache, đánh dấu `cached: true`.
      return NextResponse.json({
        ...cachedResult,
        cached: true,
        timestamp: new Date().toISOString()
      });
    }

    // 4. GỌI API THẬT (Nếu không có trong cache)
    // Tạo một mảng các Promise, mỗi Promise sẽ gọi `tradingApiService.getTickerData` cho một symbol.
    // Các lời gọi này sẽ chạy song song (concurrently) nhờ `Promise.all`.
    const promises = symbols.map(async (symbol) => {
      try {
        // Kiểm tra cache cho TỪNG symbol riêng lẻ trước (để tận dụng cache tối đa).
        const symbolCacheKey = CacheKeys.ticker(symbol);
        const cachedPrice = priceCache.get(symbolCacheKey);

        // Nếu dữ liệu của symbol này đã có trong cache riêng.
        if (cachedPrice) {
          return {
            symbol,
            success: true,
            data: cachedPrice,
            cached: true // Đánh dấu là từ cache riêng lẻ.
          };
        }

        // Nếu không có trong cache, gọi API thật thông qua `tradingApiService`.
        const data = await tradingApiService.getTickerData(symbol);

        // Lưu kết quả của từng symbol vào cache riêng lẻ với TTL 3 giây.
        priceCache.set(symbolCacheKey, data, 3000); // 3000 ms = 3 giây.

        return {
          symbol,
          success: true,
          data,
          cached: false // Đánh dấu là dữ liệu mới từ API.
        };
      } catch (error) {
        // Xử lý lỗi nếu không thể lấy dữ liệu cho một symbol cụ thể.
        console.error(`[BATCH-TICKER] Error fetching ${symbol}:`, error); // Log lỗi.
        return {
          symbol,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error' // Trả về thông tin lỗi.
        };
      }
    });

    // Chờ tất cả các Promise hoàn thành.
    const results = await Promise.all(promises);
    const endTime = Date.now(); // Ghi lại thời gian kết thúc xử lý.

    // Đếm số lượng cache hits và API calls thực tế.
    const cacheHits = results.filter(r => r.success && (r as any).cached).length;
    const apiCalls = results.filter(r => r.success && !(r as any).cached).length;

    console.log(`[BATCH-TICKER] Completed in ${endTime - startTime}ms (${cacheHits} cache hits, ${apiCalls} API calls)`); // Log thời gian hoàn thành.

    // 5. XÂY DỰNG VÀ CACHE PHẢN HỒI CUỐI CÙNG
    // Tách các kết quả thành công và thất bại.
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    // Xây dựng đối tượng phản hồi.
    const response = {
      success: true,                                    // Đánh dấu yêu cầu batch thành công (dù có thể có lỗi ở một vài symbol).
      timestamp: new Date().toISOString(),              // Thời gian phản hồi.
      duration: endTime - startTime,                    // Tổng thời gian xử lý.
      cacheHits,                                        // Số lượng cache hit.
      apiCalls,                                         // Số lượng API call thực tế.
      results: successful.map(r => ({                   // Kết quả thành công.
        symbol: r.symbol,
        data: r.data
      })),
      errors: failed.length > 0 ? failed.map(r => ({    // Thông tin lỗi nếu có symbol nào thất bại.
        symbol: r.symbol,
        error: r.error
      })) : undefined // Undefined nếu không có lỗi nào.
    };

    // Lưu trữ kết quả batch vào cache với TTL 2 giây.
    priceCache.set(cacheKey, response, 2000); // 2000 ms = 2 giây.

    // Trả về phản hồi JSON cho client.
    const responseTime = endTime - startTime; // Tính lại thời gian phản hồi để thêm vào header.
    return NextResponse.json(response, {
      headers: {
        'X-Response-Time': responseTime.toString(), // Thêm header tùy chỉnh về thời gian phản hồi.
        'Cache-Control': 'public, max-age=2'       // Chỉ thị cache cho trình duyệt (cache 2 giây).
      }
    });

  } catch (error) {
    // 6. XỬ LÝ LỖI KHÔNG MONG MUỐN (unexpected errors)
    console.error('[BATCH-TICKER] Unexpected error:', error); // Log lỗi không mong muốn.
    const responseTime = Date.now() - startTime;             // Tính thời gian phản hồi ngay cả khi có lỗi.

    // Trả về lỗi Internal Server Error (500) cho client.
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error', // Thông báo lỗi chung.
      timestamp: new Date().toISOString(),
      responseTime
    }, {
      status: 500, // Mã trạng thái HTTP 500.
      headers: {
        'X-Response-Time': responseTime.toString() // Thêm header tùy chỉnh về thời gian phản hồi.
      }
    });
  }
}