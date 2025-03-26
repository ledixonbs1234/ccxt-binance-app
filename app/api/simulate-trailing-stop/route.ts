// pages/api/simulate-trailing-stop.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import ccxt, { Exchange, Ticker, Order } from 'ccxt';
import { NextResponse } from 'next/server';
import { activeTrailingStops, updateTrailingStopState, removeTrailingStopState, TrailingStopState } from '../lib/trailingStopState'; // Điều chỉnh đường dẫn nếu cần

const REMOVAL_DELAY = 20000; // Xóa state khỏi bộ nhớ sau 20 giây kể từ khi trigger

// Lưu ý: Lưu state trong bộ nhớ như thế này KHÔNG phù hợp cho production
// vì nó sẽ mất khi server khởi động lại hoặc scale.
// Cần dùng DB hoặc Cache.
// --- Kết thúc phần state ---
// Hàm chính xử lý request
// --- Hàm xử lý phương thức POST ---
export async function POST(req: Request) { // Đổi tên thành POST, nhận Request
    try {
        // Lấy body từ request
        const body = await req.json();
        const { symbol, quantity, trailingPercent, entryPrice } = body;

        // --- Validate input (Giữ nguyên hoặc cải thiện) ---
        if (!symbol || typeof quantity !== 'number' || quantity <= 0 || typeof trailingPercent !== 'number' || trailingPercent <= 0 || trailingPercent >= 100 || typeof entryPrice !== 'number' || entryPrice <= 0) {
            // Trả về lỗi bằng NextResponse
            return NextResponse.json({ message: 'Missing or invalid parameters' }, { status: 400 });
        }
        // --- Kết thúc validate ---

        const exchange = new ccxt.binance({
            apiKey: process.env.BINANCE_API_KEY,
            secret: process.env.BINANCE_SECRET_KEY,
            options: { adjustForTimeDifference: true }
        });
        exchange.setSandboxMode(true);
        const stateKey = `${symbol}-${Date.now()}`;

        // --- Khởi tạo State bằng hàm update ---
        const initialState: TrailingStopState = {
            stateKey, // Lưu lại stateKey
            isActive: true,
            status: 'active', // Thêm status ban đầu
            symbol,
            entryPrice,
            highestPrice: entryPrice,
            trailingPercent,
            quantity,
            checkInterval: undefined, // Sẽ gán sau
        };
        updateTrailingStopState(stateKey, initialState); // Thêm vào Map
        console.log(`[${stateKey}] Starting trailing stop simulation for ${symbol}`);

        // --- Bắt đầu vòng lặp theo dõi (Giữ nguyên logic bên trong) ---
        // !!! Cảnh báo: setInterval vẫn không lý tưởng cho production !!!
        const intervalId = setInterval(async () => {
            const state = activeTrailingStops.get(stateKey);
            // console.log(state)

            // Nếu state không còn (do đã bị xóa bởi timeout) thì dừng interval này lại
            if (!state) {
                console.log(`[${stateKey}] State removed, stopping interval.`);
                // Trước mỗi lần gọi clearInterval
                console.log(`[${stateKey}] Attempting to clear interval ID: ${intervalId} (Source: Trigger/Error/!state check)`);
                clearInterval(intervalId);
                return;
            }
            // Chỉ kiểm tra isActive nếu state tồn tại
            if (!state.isActive) {
                console.log(`[${stateKey}] State is no longer active (status: ${state.status}), interval doing nothing.`);
                // Không cần clear interval ở đây nữa vì nó đã được clear khi trigger/error
                return;
            }


            try {
                // console.log(`[${stateKey}] Checking price for ${state.symbol}...`); // Bỏ bớt log nếu quá nhiều
                const ticker: Ticker = await exchange.fetchTicker(state.symbol);
                const currentPrice = ticker.last;

                if (!currentPrice) {
                    console.error(`[${stateKey}] Could not fetch current price for ${state.symbol}.`);
                    return; // Bỏ qua lần kiểm tra này
                }

                let updatedHighestPrice = state.highestPrice;
                if (currentPrice > state.highestPrice) {
                    updatedHighestPrice = currentPrice;
                    console.log(`[${stateKey}] New highest price: ${updatedHighestPrice}`);
                }

                // Tính toán giá stop loss động
                const stopPrice = state.highestPrice * (1 - state.trailingPercent / 100);
                // console.log(`[${stateKey}] Current: ${currentPrice}, Stop: ${stopPrice.toFixed(4)}`); // Bỏ bớt log
                // *** QUAN TRỌNG: Cập nhật lại state trong Map ***

                // *** Cập nhật state với highestPrice mới (quan trọng) ***
                updateTrailingStopState(stateKey, { ...state, highestPrice: updatedHighestPrice }); // <-- SỬA Ở ĐÂY

                // Kiểm tra điều kiện kích hoạt bán
                console.log(currentPrice, stopPrice);
                if (currentPrice && currentPrice <= stopPrice) {
                    console.log(`[${stateKey}] TRIGGERED! Current ${currentPrice} <= Stop ${stopPrice}. Placing market sell...`);

                    // *** Đánh dấu state là không active ngay lập tức ***
                    updateTrailingStopState(stateKey, {
                        ...state,
                        isActive: false, // Ngừng xử lý tiếp trong các vòng lặp sau
                        status: 'triggered', // Đánh dấu là đã kích hoạt
                        triggerPrice: currentPrice, // Lưu giá kích hoạt
                        triggeredAt: Date.now(), // Lưu thời điểm kích hoạt
                        //    checkInterval: undefined, // Xóa interval ID khỏi state (nhưng chưa clear interval)
                    });
                    clearInterval(intervalId); // Dừng việc check giá ngay lập tức

                    // *** Thực hiện lệnh Market Sell ***
                    try {
                        const sellOrder: Order = await exchange.createMarketSellOrder(state.symbol, state.quantity);
                        console.log(`[${stateKey}] Market sell order placed successfully: ID ${sellOrder.id}`);

                        // *** Cập nhật state với ID lệnh bán và đánh dấu thành công ***
                        // Lưu ý: lấy lại state mới nhất từ Map phòng trường hợp có cập nhật khác
                        const currentState = activeTrailingStops.get(stateKey);
                        if (currentState) { // Kiểm tra state còn tồn tại không
                            updateTrailingStopState(stateKey, {
                                ...currentState,
                                sellOrderId: sellOrder.id, // Lưu ID lệnh bán
                                // status có thể để là 'triggered' hoặc đổi thành 'sold' nếu muốn
                            });
                        }

                        // *** Lên lịch xóa state khỏi bộ nhớ sau một khoảng trễ ***
                        setTimeout(() => {
                            removeTrailingStopState(stateKey);
                            console.log(`[${stateKey}] State removed after delay.`);
                        }, REMOVAL_DELAY);


                    } catch (sellError: any) {
                        const errorMessage = sellError.message || sellError;
                        console.error(`[${stateKey}] FAILED to place market sell order:`, errorMessage);

                        // *** Cập nhật state với thông báo lỗi ***
                        const currentState = activeTrailingStops.get(stateKey);
                        if (currentState) {
                            updateTrailingStopState(stateKey, {
                                ...currentState,
                                status: 'error', // Đánh dấu lỗi
                                errorMessage: errorMessage,
                            });
                            // Có thể cũng lên lịch xóa state lỗi sau một khoảng trễ
                            setTimeout(() => removeTrailingStopState(stateKey), REMOVAL_DELAY * 2); // Xóa lỗi sau khoảng tgian dài hơn?
                        }
                    }
                }

            } catch (fetchError: any) {
                console.error(`[${stateKey}] Error in interval for ${state.symbol}:`, fetchError.message || fetchError);
                // Cân nhắc dừng nếu lỗi nghiêm trọng (ví dụ: symbol không hợp lệ)
                // if (isSevereError(fetchError)) {
                //     clearInterval(intervalId);
                //     state.isActive = false;
                //     delete activeTrailingStops[stateKey];
                // }
            }
        }, 10000); // Vẫn kiểm tra mỗi 10 giây (Cân nhắc tần suất)

        // *** Cập nhật intervalId vào state trong Map ***
        updateTrailingStopState(stateKey, { ...initialState, checkInterval: intervalId });

        // Phản hồi thành công cho client biết việc theo dõi đã bắt đầu
        // Sử dụng NextResponse.json
        return NextResponse.json({ message: `Trailing stop simulation started for ${symbol}`, stateKey }, { status: 200 });

    } catch (error: any) {
        // Xử lý lỗi chung (ví dụ: lỗi parse JSON body, lỗi không mong muốn)
        console.error("Error processing POST /api/simulate-trailing-stop:", error);
        let errorMessage = 'Internal Server Error';
        let statusCode = 500;

        if (error instanceof SyntaxError) { // Lỗi parse JSON
            errorMessage = 'Invalid JSON body provided.';
            statusCode = 400;
        } else if (error.message) {
            errorMessage = error.message;
        }

        return NextResponse.json({ message: errorMessage }, { status: statusCode });
    }
}