// File: app/api/active-simulations/route.ts
import { NextResponse } from 'next/server';
import { getActiveSimulationsForClient } from '../../../lib/trailingStopState'; // Import hàm lấy dữ liệu

export async function GET(req: Request) {
    try {
        const activeSimulations = getActiveSimulationsForClient();
        return NextResponse.json(activeSimulations, { status: 200 });
    } catch (error: any) {
        console.error("Error fetching active simulations:", error);
        return NextResponse.json({ message: 'Failed to fetch active simulations' }, { status: 500 });
    }
}