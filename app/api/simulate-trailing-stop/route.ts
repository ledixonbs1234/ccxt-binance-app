import type { NextApiRequest, NextApiResponse } from 'next';
import ccxt, { Exchange, Ticker, Order } from 'ccxt';
import { NextResponse } from 'next/server';
import { updateTrailingStopState, TrailingStopState } from '@/lib/trailingStopState';
import { generateUniqueStringId } from '@/lib/utils';
import { initializeQueueSystem, isQueueSystemInitialized } from '@/lib/queueInitializer';
export async function POST(req: Request) {
    try {
        // Initialize queue system if not already initialized
        if (!isQueueSystemInitialized()) {
            await initializeQueueSystem();
        }

        // Lấy body từ request
        const body = await req.json();
        const { symbol, quantity, trailingPercent, entryPrice, useActivationPrice, activationPrice, side = 'sell' } = body;

        // --- Validate input (Thêm validate activationPrice) ---
        if (!symbol || typeof quantity !== 'number' || quantity <= 0 || typeof trailingPercent !== 'number' || trailingPercent <= 0 || typeof entryPrice !== 'number' || entryPrice <= 0) {
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
        const stateKey = `${symbol}-${generateUniqueStringId()}`;
        const needsActivation = useActivationPrice && activationPrice > 0;

        // *** THỰC HIỆN LỆNH MUA BAN ĐẦU ***
        let buyOrderId: string | undefined;
        let actualEntryPrice = entryPrice;

        try {
            // Chỉ thực hiện lệnh mua thực tế nếu không cần activation price
            if (!needsActivation) {
                console.log(`[${stateKey}] Placing initial BUY order for ${quantity} ${symbol}`);
                const buyOrder: Order = await exchange.createMarketBuyOrder(symbol, quantity);
                buyOrderId = buyOrder.id;
                actualEntryPrice = buyOrder.average || buyOrder.price || entryPrice;
                console.log(`[${stateKey}] BUY order placed successfully: ID ${buyOrderId}, Entry Price: ${actualEntryPrice}`);
            } else {
                console.log(`[${stateKey}] Waiting for activation price ${activationPrice} before placing BUY order`);
            }
        } catch (buyError: any) {
            console.error(`[${stateKey}] FAILED to place initial BUY order:`, buyError.message || buyError);
            return NextResponse.json({
                message: `Failed to place initial buy order: ${buyError.message}`,
                error: 'BUY_ORDER_FAILED'
            }, { status: 500 });
        }
        // --- Khởi tạo State với BullMQ integration ---
        const initialState: TrailingStopState = {
            stateKey,
            isActive: true,
            status: needsActivation ? 'pending_activation' : 'active',
            activationPrice: needsActivation ? activationPrice : undefined,
            symbol,
            entryPrice: actualEntryPrice,
            highestPrice: actualEntryPrice,
            trailingPercent,
            quantity,
            side, // Add side parameter
            buyOrderId,
            triggerPrice: side === 'sell'
                ? actualEntryPrice * (1 - trailingPercent / 100)
                : actualEntryPrice * (1 + trailingPercent / 100)
        };

        // Update state and add to BullMQ queue
        await updateTrailingStopState(stateKey, initialState);
        console.log(`[${stateKey}] Starting BullMQ-based simulation for ${symbol}. Status: ${initialState.status}${needsActivation ? ` (Activation @ ${activationPrice})` : ''}`);

        // Return success response - monitoring is now handled by BullMQ
        return NextResponse.json({
            message: `Trailing stop simulation started for ${symbol}`,
            stateKey,
            status: initialState.status,
            entryPrice: actualEntryPrice,
            triggerPrice: initialState.triggerPrice,
            system: 'BullMQ'
        }, { status: 200 });

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