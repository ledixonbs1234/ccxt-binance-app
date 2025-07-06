import { NextResponse } from "next/server";
import ccxt, { Order as CCXTOrder } from "ccxt";

type OrderRequest = {
    type: 'market' | 'limit' | 'trailing-stop';
    side: 'buy' | 'sell';
    amount: number;
    price?: number;
    callback?: number;
}

// Define a custom order type that extends ccxt.Order
interface ExtendedOrder extends CCXTOrder {
    originalType?: string;
    triggerPrice?: number;
    callbackRate?: number;
    description?: string;
    note?: string;
    isSimulatedTrailingStop?: boolean;
}

export async function POST(request: Request) {
    const { type, side, amount, price, callback } = await request.json() as OrderRequest;
    const binance = new ccxt.binance({
        apiKey: process.env.BINANCE_API_KEY,
        secret: process.env.BINANCE_SECRET_KEY,
        options: { adjustForTimeDifference: true }
    });
    binance.setSandboxMode(true);

    binance.fees = binance.fees || {};
    binance.fees.trading = {
        tierBased: false,
        percentage: true,
        taker: 0.001, // 0.1%
        maker: 0.001, // 0.1%
    };
    binance.fees.funding = {
        tierBased: false,
        percentage: false,
        withdraw: {},
        deposit: {},
    };
    
    try {
        let order: ExtendedOrder | null = null;
        
        if (type === 'market') {
            if (side === 'buy') {
                order = await binance.createMarketBuyOrder('BTC/USDT', amount) as ExtendedOrder;
            } else {
                order = await binance.createMarketSellOrder('BTC/USDT', amount) as ExtendedOrder;
            }
        } else if (type === 'limit') {
            if (price === undefined) {
                return NextResponse.json({ error: 'Giá là bắt buộc với lệnh limit' }, { status: 400 });
            }
            if (side === 'buy') {
                order = await binance.createLimitBuyOrder('BTC/USDT', amount, price) as ExtendedOrder;
            } else {
                order = await binance.createLimitSellOrder('BTC/USDT', amount, price) as ExtendedOrder;
            }
        } else if (type === 'trailing-stop') {
            if (price === undefined) {
                return NextResponse.json({ error: 'Giá kích hoạt là bắt buộc với lệnh trailing stop' }, { status: 400 });
            }
            if (callback === undefined || callback < 0.1 || callback > 5) {
                return NextResponse.json({ error: 'Callback phải từ 0.1% đến 5%' }, { status: 400 });
            }

            try {
                // Get current market price
                const ticker = await binance.fetchTicker('BTC/USDT');
                const currentPrice = ticker.last
                
                
                // Since Binance sandbox doesn't support trailing stops directly,
                // we'll implement a better simulation using limit orders
                if (side === 'buy') {
                    // For buy trailing stop, set a limit buy order at callback% below current price
                    const effectivePrice = Math.min(price, currentPrice! * (1 - callback/100));
                    order = await binance.createLimitBuyOrder('BTC/USDT', amount, effectivePrice) as ExtendedOrder;
                    
                    // Add trailing stop metadata
                    order.originalType = 'trailing-stop';
                    order.triggerPrice = price;
                    order.callbackRate = callback;
                    order.description = `Simulated Buy Trailing Stop: Will buy ${amount} BTC at ${effectivePrice} USDT (${callback}% below trigger price ${price})`;
                } else {
                    // For sell trailing stop, set a limit sell order at callback% below trigger price
                    const effectivePrice = price * (1 - callback/100);
                    order = await binance.createLimitSellOrder('BTC/USDT', amount, effectivePrice) as ExtendedOrder;
                    
                    // Add trailing stop metadata
                    order.originalType = 'trailing-stop';
                    order.triggerPrice = price;
                    order.callbackRate = callback;
                    order.description = `Simulated Sell Trailing Stop: Will sell ${amount} BTC at ${effectivePrice} USDT (${callback}% below trigger price ${price})`;
                }
            } catch (error: any) {
                console.error("Failed to create simulated trailing stop:", error.message);
                
                // Fall back to a simple limit order if trailing stop simulation fails
                if (side === 'buy') {
                    order = await binance.createLimitBuyOrder('BTC/USDT', amount, price) as ExtendedOrder;
                } else {
                    order = await binance.createLimitSellOrder('BTC/USDT', amount, price) as ExtendedOrder;
                }
                
                // Add note about fallback
                order.note = "Trailing stop not supported; placed as limit order";
            }
        }
        
        if (!order) {
            throw new Error("Order creation failed");
        }

        console.log("Order info:", order);
        return NextResponse.json(order);
    } catch (error: any) {
        console.error("Order error:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
