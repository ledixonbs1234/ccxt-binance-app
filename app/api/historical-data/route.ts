import { NextResponse } from 'next/server';
import { historicalDataService, HistoricalDataRequest, Timeframe } from '@/lib/historicalDataService';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'symbols':
        return NextResponse.json({
          symbols: historicalDataService.getPopularSymbols(),
          message: 'Popular cryptocurrency symbols for backtesting'
        });

      case 'timeframes':
        return NextResponse.json({
          timeframes: historicalDataService.getAvailableTimeframes(),
          message: 'Available timeframes for historical data'
        });

      case 'date-ranges':
        return NextResponse.json({
          ranges: historicalDataService.getRecommendedDateRanges(),
          message: 'Recommended date ranges for backtesting'
        });

      case 'cache-stats':
        return NextResponse.json({
          stats: historicalDataService.getCacheStats(),
          message: 'Historical data cache statistics'
        });

      default:
        return NextResponse.json({
          message: 'Historical Data Service API',
          availableActions: [
            'symbols - Get popular cryptocurrency symbols',
            'timeframes - Get available timeframes',
            'date-ranges - Get recommended date ranges',
            'cache-stats - Get cache statistics',
            'Use POST to fetch historical data'
          ]
        });
    }

  } catch (error: any) {
    console.error('[Historical Data API] GET Error:', error);
    return NextResponse.json({ 
      message: 'Failed to process request', 
      error: error.message 
    }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, ...params } = body;

    switch (action) {
      case 'fetch':
        return await handleFetchHistoricalData(params);
      
      case 'validate':
        return await handleValidateData(params);
      
      case 'clear-cache':
        historicalDataService.clearCache();
        return NextResponse.json({
          message: 'Cache cleared successfully'
        });

      default:
        return NextResponse.json({
          message: 'Invalid action',
          availableActions: ['fetch', 'validate', 'clear-cache']
        }, { status: 400 });
    }

  } catch (error: any) {
    console.error('[Historical Data API] POST Error:', error);
    return NextResponse.json({ 
      message: 'Failed to process request', 
      error: error.message 
    }, { status: 500 });
  }
}

async function handleFetchHistoricalData(params: any) {
  try {
    const { symbol, timeframe, startDate, endDate, limit } = params;

    // Validate required parameters
    if (!symbol || !timeframe || !startDate || !endDate) {
      return NextResponse.json({
        message: 'Missing required parameters',
        required: ['symbol', 'timeframe', 'startDate', 'endDate'],
        optional: ['limit']
      }, { status: 400 });
    }

    // Validate timeframe
    const validTimeframes: Timeframe[] = ['1m', '5m', '15m', '1h', '4h', '1d'];
    if (!validTimeframes.includes(timeframe)) {
      return NextResponse.json({
        message: 'Invalid timeframe',
        validTimeframes
      }, { status: 400 });
    }

    // Parse dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json({
        message: 'Invalid date format',
        example: '2023-01-01T00:00:00.000Z'
      }, { status: 400 });
    }

    if (start >= end) {
      return NextResponse.json({
        message: 'Start date must be before end date'
      }, { status: 400 });
    }

    // Check date range (max 2 years for performance)
    const maxRangeMs = 2 * 365 * 24 * 60 * 60 * 1000; // 2 years
    if (end.getTime() - start.getTime() > maxRangeMs) {
      return NextResponse.json({
        message: 'Date range too large. Maximum 2 years allowed.',
        maxRange: '2 years'
      }, { status: 400 });
    }

    const request: HistoricalDataRequest = {
      symbol,
      timeframe,
      startDate: start,
      endDate: end,
      limit: limit ? parseInt(limit) : undefined
    };

    console.log(`[Historical Data API] Fetching data:`, request);

    const startTime = Date.now();
    const data = await historicalDataService.fetchHistoricalData(request);
    const fetchTime = Date.now() - startTime;

    // Validate data quality
    const qualityReport = historicalDataService.validateDataQuality(data);

    return NextResponse.json({
      success: true,
      data: {
        candles: data,
        count: data.length,
        timeRange: {
          start: data.length > 0 ? data[0].date : null,
          end: data.length > 0 ? data[data.length - 1].date : null
        }
      },
      qualityReport,
      performance: {
        fetchTimeMs: fetchTime,
        candlesPerSecond: Math.round(data.length / (fetchTime / 1000))
      },
      cacheStats: historicalDataService.getCacheStats()
    });

  } catch (error: any) {
    console.error('[Historical Data API] Fetch Error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch historical data',
      error: error.message
    }, { status: 500 });
  }
}

async function handleValidateData(params: any) {
  try {
    const { data } = params;

    if (!data || !Array.isArray(data)) {
      return NextResponse.json({
        message: 'Invalid data format. Expected array of candle data.'
      }, { status: 400 });
    }

    // Validate data structure
    const requiredFields = ['timestamp', 'open', 'high', 'low', 'close', 'volume'];
    const sampleCandle = data[0];
    
    if (!sampleCandle) {
      return NextResponse.json({
        message: 'Empty data array'
      }, { status: 400 });
    }

    const missingFields = requiredFields.filter(field => !(field in sampleCandle));
    if (missingFields.length > 0) {
      return NextResponse.json({
        message: 'Invalid candle data structure',
        missingFields,
        requiredFields
      }, { status: 400 });
    }

    // Convert to proper format if needed
    const candleData = data.map((candle: any) => ({
      timestamp: candle.timestamp,
      open: parseFloat(candle.open),
      high: parseFloat(candle.high),
      low: parseFloat(candle.low),
      close: parseFloat(candle.close),
      volume: parseFloat(candle.volume),
      date: new Date(candle.timestamp)
    }));

    const qualityReport = historicalDataService.validateDataQuality(candleData);

    return NextResponse.json({
      success: true,
      qualityReport,
      recommendations: generateRecommendations(qualityReport)
    });

  } catch (error: any) {
    console.error('[Historical Data API] Validate Error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to validate data',
      error: error.message
    }, { status: 500 });
  }
}

function generateRecommendations(qualityReport: any): string[] {
  const recommendations: string[] = [];

  if (qualityReport.dataCompleteness < 95) {
    recommendations.push('Consider using data interpolation to fill missing candles');
  }

  if (qualityReport.anomalies.filter((a: any) => a.severity === 'high').length > 0) {
    recommendations.push('Review high-severity anomalies before using data for backtesting');
  }

  if (qualityReport.anomalies.filter((a: any) => a.type === 'price_spike').length > 5) {
    recommendations.push('Consider applying price spike filtering for more stable backtesting');
  }

  if (qualityReport.recommendation === 'poor') {
    recommendations.push('Data quality is poor. Consider using a different time period or symbol');
  }

  if (recommendations.length === 0) {
    recommendations.push('Data quality is good for backtesting');
  }

  return recommendations;
}

export async function DELETE(req: Request) {
  try {
    historicalDataService.clearCache();
    
    return NextResponse.json({
      message: 'Historical data cache cleared successfully'
    });

  } catch (error: any) {
    console.error('[Historical Data API] DELETE Error:', error);
    return NextResponse.json({ 
      message: 'Failed to clear cache', 
      error: error.message 
    }, { status: 500 });
  }
}
