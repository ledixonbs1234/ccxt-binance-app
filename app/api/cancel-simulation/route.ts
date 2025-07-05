// File: app/api/cancel-simulation/route.ts
import { NextResponse } from 'next/server';
import { removeTrailingStopState, activeTrailingStops } from '@/lib/trailingStopState'; // Import từ state chung
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { stateKey } = body;

        if (!stateKey || typeof stateKey !== 'string') {
            return NextResponse.json({ message: 'Missing or invalid stateKey' }, { status: 400 });
        }

        const stateExists = activeTrailingStops.has(stateKey);

        if (stateExists) {
            // Remove the simulation from memory and database
            await removeTrailingStopState(stateKey);
            console.log(`[API /cancel-simulation] Successfully removed simulation: ${stateKey}`);
        } else {
            console.log(`[API /cancel-simulation] Simulation not found in memory: ${stateKey}`);

            // Check if the simulation exists in the database
            const { data, error } = await supabase
                .from('trailing_stops')
                .select('id')
                .eq('stateKey', stateKey)
                .single();

            if (error || !data) {
                console.log(`[API /cancel-simulation] Simulation not found in database: ${stateKey}`);
                return NextResponse.json({ message: `Simulation ${stateKey} not found or already removed.` }, { status: 404 });
            }

            // Remove it from the database
            await supabase
                .from('trailing_stops')
                .delete()
                .eq('stateKey', stateKey);

            console.log(`[API /cancel-simulation] Removed simulation from database: ${stateKey}`);
        }

        return NextResponse.json({ message: `Simulation ${stateKey} cancelled successfully.` }, { status: 200 });
    } catch (error: any) {
        console.error(`[API /cancel-simulation] Error cancelling simulation: ${error.message}`);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}