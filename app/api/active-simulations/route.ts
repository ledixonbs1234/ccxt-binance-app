import { NextResponse } from 'next/server';
import { getActiveSimulationsForClient } from '@/lib/trailingStopState';

export async function GET(req: Request) {
    try {
        // Add logging to debug
        const activeSimulations = await getActiveSimulationsForClient();
        console.log('[API] Active simulations:', activeSimulations);
        return NextResponse.json(activeSimulations, { status: 200 });
    } catch (error: any) {
        console.error("[API] Error fetching active simulations:", error);
        return NextResponse.json({ message: 'Failed to fetch active simulations' }, { status: 500 });
    }
}