import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { testType } = body;

        if (testType === 'immediate_buy') {
            // Test tạo vị thế với lệnh mua ngay lập tức
            const testData = {
                symbol: 'BTCUSDT',
                quantity: 0.001,
                trailingPercent: 2.0,
                entryPrice: 45000,
                useActivationPrice: false
            };

            const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/simulate-trailing-stop`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(testData)
            });

            const result = await response.json();
            return NextResponse.json({
                message: 'Test immediate buy completed',
                testData,
                result,
                success: response.ok
            });

        } else if (testType === 'activation_price') {
            // Test tạo vị thế với activation price
            const testData = {
                symbol: 'ETHUSDT',
                quantity: 0.01,
                trailingPercent: 3.0,
                entryPrice: 3000,
                useActivationPrice: true,
                activationPrice: 3100
            };

            const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/simulate-trailing-stop`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(testData)
            });

            const result = await response.json();
            return NextResponse.json({
                message: 'Test activation price completed',
                testData,
                result,
                success: response.ok
            });

        } else {
            return NextResponse.json({ 
                message: 'Invalid test type. Use "immediate_buy" or "activation_price"' 
            }, { status: 400 });
        }

    } catch (error: any) {
        console.error('[Test API] Error:', error);
        return NextResponse.json({ 
            message: 'Test failed', 
            error: error.message 
        }, { status: 500 });
    }
}

export async function GET(req: Request) {
    return NextResponse.json({
        message: 'Trailing Stop Test API',
        availableTests: [
            {
                type: 'immediate_buy',
                description: 'Test tạo vị thế với lệnh mua ngay lập tức',
                method: 'POST',
                body: { testType: 'immediate_buy' }
            },
            {
                type: 'activation_price',
                description: 'Test tạo vị thế với activation price',
                method: 'POST',
                body: { testType: 'activation_price' }
            }
        ]
    });
}
