import { NextResponse } from 'next/server';
import ccxt from 'ccxt';

export async function GET() {
    const binance = new ccxt.binance({
        apiKey: process.env.BINANCE_API_KEY!,
        secret: process.env.BINANCE_SECRET_KEY!,
        options: { adjustForTimeDifference: true },
    });
    binance.setSandboxMode(true);

    try {
        // Lấy lịch sử lệnh của cặp BTC/USDT (bạn có thể thay đổi theo nhu cầu)
        const orders = await binance.fetchOrders('BTC/USDT');

        // Lọc ra những thông tin cần thiết cho mỗi lệnh
        const necessaryOrders = orders.map((order: any) => ({
            id: order.id,
            datetime: order.datetime,
            symbol: order.symbol,
            type: order.type,
            side: order.side,
            price: order.price,
            amount: order.amount,
            cost: order.cost,
            filled: order.filled,
            status: order.status,
            fee: order.fee,
        }));

        return NextResponse.json(necessaryOrders);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
