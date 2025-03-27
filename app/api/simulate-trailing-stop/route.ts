// pages/api/simulate-trailing-stop.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import ccxt, { Exchange, Ticker, Order } from 'ccxt';
import { NextResponse } from 'next/server';
import { activeTrailingStops, updateTrailingStopState, removeTrailingStopState, TrailingStopState } from '@/lib/trailingStopState'; // Sử dụng alias @
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
        const { symbol, quantity, trailingPercent, entryPrice, useActivationPrice, activationPrice } = body;

        // --- Validate input (Thêm validate activationPrice) ---
        if (!symbol || typeof quantity !== 'number' || quantity <= 0 || /* ... */ typeof entryPrice !== 'number' || entryPrice <= 0) {
            return NextResponse.json({ message: 'Missing or invalid parameters' }, { status: 400 });
        }
        if (useActivationPrice && (typeof activationPrice !== 'number' || activationPrice <= 0)) {
            return NextResponse.json({ message: 'Invalid activation price' }, { status: 400 });
        }

        const exchange = new ccxt.binance({
            apiKey: process.env.BINANCE_API_KEY,
            secret: process.env.BINANCE_SECRET_KEY,
            options: { adjustForTimeDifference: true }
        });
        exchange.setSandboxMode(true);
        const stateKey = `${symbol}-${Date.now()}`;
        const needsActivation = useActivationPrice && activationPrice > 0;
        // --- Khởi tạo State bằng hàm update ---
        const initialState: TrailingStopState = {
            stateKey,
            isActive: true, // Luôn active ban đầu để interval chạy
            status: needsActivation ? 'pending_activation' : 'active', // Status dựa vào activation
            activationPrice: needsActivation ? activationPrice : undefined,
            symbol,
            entryPrice,
            highestPrice: entryPrice, // Bắt đầu từ entryPrice
            trailingPercent,
            quantity,
            checkInterval: undefined,
        };
        updateTrailingStopState(stateKey, initialState); // Thêm vào Map
        console.log(`[${stateKey}] Starting simulation for ${symbol}. Status: ${initialState.status}${needsActivation ? ` (Activation @ ${activationPrice})` : ''}`);

        // --- Bắt đầu vòng lặp theo dõi (Giữ nguyên logic bên trong) ---
        // !!! Cảnh báo: setInterval vẫn không lý tưởng cho production !!!
        const intervalId = setInterval(async () => {
            const state = activeTrailingStops.get(stateKey);
            if (!state) {
                clearInterval(intervalId); return;
            }
            // Nếu không active nữa (do trigger/error/manual stop) thì dừng
            if (!state.isActive) {
                 // Đã được clear ở nơi khác, ko cần clear lại
                return;
            }

            try {
                const ticker: Ticker = await exchange.fetchTicker(state.symbol);
                const currentPrice = ticker.last;
                if (!currentPrice) {
                     console.error(`[${stateKey}] Could not fetch current price.`);
                     return;
                }

                // --- Logic chính dựa trên Status ---
                let currentStatus = state.status; // Lấy status hiện tại

                // 1. Kiểm tra kích hoạt nếu đang chờ
                if (currentStatus === 'pending_activation' && state.activationPrice) {
                    console.log(`[${stateKey}] Pending activation. Current: ${currentPrice}, Activation: ${state.activationPrice}`);
                    if (currentPrice >= state.activationPrice) {
                        console.log(`[${stateKey}] *** ACTIVATED *** at price ${currentPrice}`);
                        // Cập nhật state: chuyển status, đặt lại highestPrice từ giá hiện tại
                        updateTrailingStopState(stateKey, {
                            ...state,
                            status: 'active',
                            highestPrice: currentPrice, // Bắt đầu theo dõi từ giá kích hoạt
                        });
                        currentStatus = 'active'; // Chuyển sang xử lý active ngay trong lần lặp này
                    } else {
                        return; // Chưa đạt giá kích hoạt, đợi lần sau
                    }
                }

                // 2. Xử lý khi đã active (hoặc vừa được kích hoạt)
                if (currentStatus === 'active') {
                    // Lấy lại state mới nhất sau khi có thể đã kích hoạt
                    const activeState = activeTrailingStops.get(stateKey);
                    if (!activeState || !activeState.isActive) return; // Kiểm tra lại phòng trường hợp state bị thay đổi

                    let updatedHighestPrice = activeState.highestPrice;
                    if (currentPrice > activeState.highestPrice) {
                        updatedHighestPrice = currentPrice;
                        console.log(`[${stateKey}] New highest price: ${updatedHighestPrice}`);
                    }

                    // Tính stop price dựa trên highestPrice MỚI NHẤT
                    const stopPrice = updatedHighestPrice * (1 - activeState.trailingPercent / 100);

                    // Cập nhật state với highestPrice mới nhất (luôn cập nhật)
                    updateTrailingStopState(stateKey, { ...activeState, highestPrice: updatedHighestPrice });

                    // Kiểm tra trigger
                     console.log(`[${stateKey}] Active. Current: ${currentPrice}, Highest: ${updatedHighestPrice}, Stop: ${stopPrice.toFixed(4)}`);
                    if (currentPrice <= stopPrice) {
                        console.log(`[${stateKey}] TRIGGERED! Current ${currentPrice} <= Stop ${stopPrice}.`);
                         // --- Logic Trigger (giữ nguyên từ trước) ---
                         updateTrailingStopState(stateKey, {
                            ...activeState, // Dùng activeState lấy được ở trên
                            highestPrice: updatedHighestPrice, // Lưu lại highest price cuối cùng
                            isActive: false,
                            status: 'triggered',
                            triggerPrice: currentPrice,
                            triggeredAt: Date.now(),
                         });
                        clearInterval(intervalId); // Dừng interval ngay

                        // Thực hiện bán
                        try {
                            const sellOrder: Order = await exchange.createMarketSellOrder(activeState.symbol, activeState.quantity);
                            console.log(`[${stateKey}] Market sell order placed: ID ${sellOrder.id}`);
                            // Cập nhật state với sellOrderId
                             const finalState = activeTrailingStops.get(stateKey);
                             if(finalState) updateTrailingStopState(stateKey, { ...finalState, sellOrderId: sellOrder.id });
                             // Lên lịch xóa
                             setTimeout(() => removeTrailingStopState(stateKey), REMOVAL_DELAY);
                        } catch (sellError: any) {
                             console.error(`[${stateKey}] FAILED sell order:`, sellError.message || sellError);
                             // Cập nhật state lỗi
                             const finalState = activeTrailingStops.get(stateKey);
                              if(finalState) updateTrailingStopState(stateKey, { ...finalState, status: 'error', errorMessage: sellError.message || sellError });
                              // Lên lịch xóa lỗi
                              setTimeout(() => removeTrailingStopState(stateKey), REMOVAL_DELAY * 2);
                        }
                        // --- Kết thúc Logic Trigger ---
                    }
                }
                // Các status khác ('triggered', 'error') không cần xử lý thêm trong interval

            } catch (fetchError: any) {
                 console.error(`[${stateKey}] Error in interval:`, fetchError.message || fetchError);
                 // Xử lý lỗi fetch (có thể dừng nếu lỗi nghiêm trọng)
            }
        }, 10000); // Interval

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