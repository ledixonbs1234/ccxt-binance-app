import { NextResponse } from 'next/server';
import { getQueueStats } from '@/lib/trailingStopQueue';
import { supabase } from '@/lib/supabase';
import { isQueueSystemInitialized, initializeQueueSystem } from '@/lib/queueInitializer';

export async function GET() {
  try {
    // Initialize queue system if not already initialized
    if (!isQueueSystemInitialized()) {
      await initializeQueueSystem();
    }

    // Get queue statistics
    const queueStats = await getQueueStats();
    
    // Get database statistics
    const { data: dbStats, error: dbError } = await supabase
      .from('trailing_stops')
      .select('status')
      .then(async (result) => {
        if (result.error) return { data: null, error: result.error };
        
        const statusCounts = result.data.reduce((acc: Record<string, number>, item) => {
          acc[item.status] = (acc[item.status] || 0) + 1;
          return acc;
        }, {});
        
        return { data: statusCounts, error: null };
      });

    if (dbError) {
      console.error('[QueueStatus] Database error:', dbError);
    }

    // Get system health
    const systemHealth = {
      queueInitialized: isQueueSystemInitialized(),
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
    };

    return NextResponse.json({
      success: true,
      queueStats,
      databaseStats: dbStats || {},
      systemHealth,
      message: 'Queue system is operational'
    });

  } catch (error) {
    console.error('[QueueStatus] Error getting queue status:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      queueStats: null,
      databaseStats: {},
      systemHealth: {
        queueInitialized: false,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
      }
    }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'reinitialize') {
      const { reinitializeQueueSystem } = await import('@/lib/queueInitializer');
      await reinitializeQueueSystem();
      
      return NextResponse.json({
        success: true,
        message: 'Queue system reinitialized successfully'
      });
    }

    return NextResponse.json({
      success: false,
      message: 'Invalid action. Supported actions: reinitialize'
    }, { status: 400 });

  } catch (error) {
    console.error('[QueueStatus] Error processing action:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
