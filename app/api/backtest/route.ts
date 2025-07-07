import { NextResponse } from 'next/server';
import { BacktestingEngine, BacktestConfig } from '@/lib/backtestingEngine';
import { TrailingStopStrategy } from '@/types/trailingStop';
import { Timeframe } from '@/lib/historicalDataService';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'strategies':
        return NextResponse.json({
          strategies: [
            'percentage',
            'atr',
            'dynamic',
            'fibonacci',
            'bollinger_bands',
            'volume_profile',
            'smart_money',
            'ichimoku',
            'pivot_points',
            'hybrid'
          ],
          message: 'Available trailing stop strategies for backtesting'
        });

      case 'timeframes':
        return NextResponse.json({
          timeframes: ['1m', '5m', '15m', '1h', '4h', '1d'],
          message: 'Available timeframes for backtesting'
        });

      case 'entry-conditions':
        return NextResponse.json({
          entryConditions: [
            'always',
            'trend_up',
            'trend_down',
            'breakout',
            'pullback'
          ],
          message: 'Available entry conditions for backtesting'
        });

      case 'presets':
        return NextResponse.json({
          presets: [
            {
              name: 'Conservative',
              nameVi: 'Bảo thủ',
              config: {
                strategy: 'percentage',
                trailingPercent: 0.05,
                maxLossPercent: 0.02,
                positionSize: 0.1,
                maxPositions: 1,
                entryCondition: 'trend_up'
              }
            },
            {
              name: 'Aggressive',
              nameVi: 'Tích cực',
              config: {
                strategy: 'atr',
                atrMultiplier: 2,
                maxLossPercent: 0.05,
                positionSize: 0.2,
                maxPositions: 3,
                entryCondition: 'breakout'
              }
            },
            {
              name: 'Balanced',
              nameVi: 'Cân bằng',
              config: {
                strategy: 'dynamic',
                trailingPercent: 0.03,
                maxLossPercent: 0.03,
                positionSize: 0.15,
                maxPositions: 2,
                entryCondition: 'pullback'
              }
            }
          ],
          message: 'Preset configurations for backtesting'
        });

      default:
        return NextResponse.json({
          message: 'Backtesting Engine API',
          availableActions: [
            'strategies - Get available trailing stop strategies',
            'timeframes - Get available timeframes',
            'entry-conditions - Get available entry conditions',
            'presets - Get preset configurations',
            'Use POST to run backtest'
          ]
        });
    }

  } catch (error: any) {
    console.error('[Backtest API] GET Error:', error);
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
      case 'run':
        return await handleRunBacktest(params);
      
      case 'validate-config':
        return await handleValidateConfig(params);
      
      case 'estimate-time':
        return await handleEstimateTime(params);

      default:
        return NextResponse.json({
          message: 'Invalid action',
          availableActions: ['run', 'validate-config', 'estimate-time']
        }, { status: 400 });
    }

  } catch (error: any) {
    console.error('[Backtest API] POST Error:', error);
    return NextResponse.json({ 
      message: 'Failed to process request', 
      error: error.message 
    }, { status: 500 });
  }
}

async function handleRunBacktest(params: any) {
  try {
    // Validate required parameters
    const requiredFields = ['symbol', 'timeframe', 'startDate', 'endDate', 'strategy', 'initialCapital'];
    const missingFields = requiredFields.filter(field => !params[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json({
        message: 'Missing required parameters',
        missingFields,
        requiredFields
      }, { status: 400 });
    }

    // Parse and validate dates
    const startDate = new Date(params.startDate);
    const endDate = new Date(params.endDate);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json({
        message: 'Invalid date format',
        example: '2023-01-01T00:00:00.000Z'
      }, { status: 400 });
    }

    if (startDate >= endDate) {
      return NextResponse.json({
        message: 'Start date must be before end date'
      }, { status: 400 });
    }

    // Check date range (max 1 year for performance)
    const maxRangeMs = 365 * 24 * 60 * 60 * 1000; // 1 year
    if (endDate.getTime() - startDate.getTime() > maxRangeMs) {
      return NextResponse.json({
        message: 'Date range too large. Maximum 1 year allowed for backtesting.',
        maxRange: '1 year'
      }, { status: 400 });
    }

    // Build backtest configuration
    const config: BacktestConfig = {
      symbol: params.symbol,
      timeframe: params.timeframe as Timeframe,
      startDate,
      endDate,
      strategy: params.strategy as TrailingStopStrategy,
      initialCapital: parseFloat(params.initialCapital),
      positionSize: parseFloat(params.positionSize || '0.1'),
      maxPositions: parseInt(params.maxPositions || '1'),
      maxLossPercent: parseFloat(params.maxLossPercent || '0.02'),
      
      // Strategy parameters
      trailingPercent: params.trailingPercent ? parseFloat(params.trailingPercent) : undefined,
      atrMultiplier: params.atrMultiplier ? parseFloat(params.atrMultiplier) : undefined,
      atrPeriod: params.atrPeriod ? parseInt(params.atrPeriod) : undefined,
      volatilityLookback: params.volatilityLookback ? parseInt(params.volatilityLookback) : undefined,
      fibonacciLevel: params.fibonacciLevel ? parseFloat(params.fibonacciLevel) : undefined,
      bollingerPeriod: params.bollingerPeriod ? parseInt(params.bollingerPeriod) : undefined,
      bollingerStdDev: params.bollingerStdDev ? parseFloat(params.bollingerStdDev) : undefined,
      
      // Risk management
      stopLossPercent: params.stopLossPercent ? parseFloat(params.stopLossPercent) : undefined,
      takeProfitPercent: params.takeProfitPercent ? parseFloat(params.takeProfitPercent) : undefined,
      
      // Entry conditions
      entryCondition: params.entryCondition || 'always',
      minVolume: params.minVolume ? parseFloat(params.minVolume) : undefined,
      rsiOverbought: params.rsiOverbought ? parseFloat(params.rsiOverbought) : undefined,
      rsiOversold: params.rsiOversold ? parseFloat(params.rsiOversold) : undefined
    };

    console.log(`[Backtest API] Running backtest:`, {
      symbol: config.symbol,
      strategy: config.strategy,
      timeframe: config.timeframe,
      period: `${startDate.toISOString()} to ${endDate.toISOString()}`,
      capital: config.initialCapital
    });

    // Run backtest
    const backtestingEngine = BacktestingEngine.getInstance();
    const result = await backtestingEngine.runBacktest(config);

    return NextResponse.json({
      success: true,
      result,
      summary: {
        totalTrades: result.performance.totalTrades,
        winRate: `${(result.performance.winRate * 100).toFixed(2)}%`,
        totalReturn: `$${result.performance.totalReturn.toFixed(2)}`,
        totalReturnPercent: `${result.performance.totalReturnPercent.toFixed(2)}%`,
        maxDrawdown: `${result.performance.maxDrawdownPercent.toFixed(2)}%`,
        profitFactor: result.performance.profitFactor.toFixed(2),
        executionTime: `${result.executionTime}ms`,
        dataQuality: result.dataQuality
      }
    });

  } catch (error: any) {
    console.error('[Backtest API] Run Error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to run backtest',
      error: error.message
    }, { status: 500 });
  }
}

async function handleValidateConfig(params: any) {
  try {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate symbol
    if (!params.symbol) {
      errors.push('Symbol is required');
    }

    // Validate timeframe
    const validTimeframes = ['1m', '5m', '15m', '1h', '4h', '1d'];
    if (!params.timeframe || !validTimeframes.includes(params.timeframe)) {
      errors.push(`Invalid timeframe. Must be one of: ${validTimeframes.join(', ')}`);
    }

    // Validate strategy
    const validStrategies = ['percentage', 'atr', 'dynamic', 'fibonacci', 'bollinger_bands'];
    if (!params.strategy || !validStrategies.includes(params.strategy)) {
      errors.push(`Invalid strategy. Must be one of: ${validStrategies.join(', ')}`);
    }

    // Validate capital
    const capital = parseFloat(params.initialCapital);
    if (!capital || capital <= 0) {
      errors.push('Initial capital must be a positive number');
    } else if (capital < 1000) {
      warnings.push('Initial capital is quite low. Consider using at least $1000 for realistic results');
    }

    // Validate position size
    const positionSize = parseFloat(params.positionSize || '0.1');
    if (positionSize <= 0 || positionSize > 1) {
      errors.push('Position size must be between 0 and 1 (0.1 = 10%)');
    } else if (positionSize > 0.5) {
      warnings.push('Position size is quite high. Consider using less than 50% per trade');
    }

    // Validate risk parameters
    const maxLoss = parseFloat(params.maxLossPercent || '0.02');
    if (maxLoss <= 0 || maxLoss > 0.2) {
      errors.push('Max loss percent must be between 0 and 0.2 (20%)');
    }

    return NextResponse.json({
      valid: errors.length === 0,
      errors,
      warnings,
      recommendations: generateRecommendations(params)
    });

  } catch (error: any) {
    console.error('[Backtest API] Validate Error:', error);
    return NextResponse.json({
      valid: false,
      message: 'Failed to validate configuration',
      error: error.message
    }, { status: 500 });
  }
}

async function handleEstimateTime(params: any) {
  try {
    const startDate = new Date(params.startDate);
    const endDate = new Date(params.endDate);
    const timeframe = params.timeframe;

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json({
        message: 'Invalid date format'
      }, { status: 400 });
    }

    // Estimate number of candles
    const timeDiff = endDate.getTime() - startDate.getTime();
    const timeframeMs = getTimeframeMs(timeframe);
    const estimatedCandles = Math.floor(timeDiff / timeframeMs);

    // Estimate execution time (rough calculation)
    const baseTimePerCandle = 0.1; // ms per candle
    const estimatedTime = estimatedCandles * baseTimePerCandle;

    return NextResponse.json({
      estimatedCandles,
      estimatedTimeMs: Math.round(estimatedTime),
      estimatedTimeSeconds: Math.round(estimatedTime / 1000),
      recommendation: estimatedTime > 30000 ? 'Consider using a larger timeframe or shorter period' : 'Good to go'
    });

  } catch (error: any) {
    console.error('[Backtest API] Estimate Error:', error);
    return NextResponse.json({
      message: 'Failed to estimate time',
      error: error.message
    }, { status: 500 });
  }
}

function generateRecommendations(params: any): string[] {
  const recommendations: string[] = [];

  if (params.strategy === 'percentage' && !params.trailingPercent) {
    recommendations.push('Consider setting trailingPercent for percentage strategy (e.g., 0.05 for 5%)');
  }

  if (params.strategy === 'atr' && !params.atrMultiplier) {
    recommendations.push('Consider setting atrMultiplier for ATR strategy (e.g., 2.0)');
  }

  if (!params.entryCondition || params.entryCondition === 'always') {
    recommendations.push('Consider using specific entry conditions like "trend_up" or "breakout" for better results');
  }

  if (parseFloat(params.positionSize || '0.1') > 0.2) {
    recommendations.push('High position size detected. Consider risk management with smaller position sizes');
  }

  return recommendations;
}

function getTimeframeMs(timeframe: string): number {
  const timeframes: { [key: string]: number } = {
    '1m': 60 * 1000,
    '5m': 5 * 60 * 1000,
    '15m': 15 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '4h': 4 * 60 * 60 * 1000,
    '1d': 24 * 60 * 60 * 1000
  };
  
  return timeframes[timeframe] || 60 * 60 * 1000; // Default to 1h
}
