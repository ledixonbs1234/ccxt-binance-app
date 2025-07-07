'use client';

import React from 'react';
import { TrailingStopState } from '../lib/trailingStopState';
import { formatSmartPrice } from '../lib/priceFormatter';

interface TrailingStopLegendProps {
  trailingStops: TrailingStopState[];
  symbol: string;
  currentPrice: number;
}

export default function TrailingStopLegend({ 
  trailingStops, 
  symbol, 
  currentPrice 
}: TrailingStopLegendProps) {
  // Filter relevant stops for current symbol
  const relevantStops = trailingStops.filter(stop => 
    stop.symbol.replace('/', '') === symbol.replace('/', '') && 
    stop.isActive && 
    stop.status !== 'triggered'
  );

  if (relevantStops.length === 0) {
    return null;
  }

  return (
    <div className="absolute bottom-4 left-4 z-10 bg-gray-900 bg-opacity-95 backdrop-blur-sm rounded-lg border border-gray-700 p-3 min-w-[280px] max-w-[400px]">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-700">
        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
        <span className="text-white text-sm font-semibold">Active Trailing Stops</span>
        <span className="text-gray-400 text-xs">({relevantStops.length})</span>
      </div>

      <div className="space-y-2 max-h-32 overflow-y-auto">
        {relevantStops.map((stop, index) => {
          const currentStopPrice = stop.highestPrice * (1 - stop.trailingPercent / 100);
          const profitTarget = stop.entryPrice * (1 + (stop.trailingPercent * 2) / 100);
          const currentPnL = ((currentPrice - stop.entryPrice) / stop.entryPrice) * 100;
          const distanceToStop = ((currentPrice - currentStopPrice) / currentPrice) * 100;

          return (
            <div key={stop.stateKey} className="text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-gray-300 font-medium">#{index + 1}</span>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    stop.status === 'active' ? 'bg-green-900 text-green-300' :
                    stop.status === 'pending_activation' ? 'bg-yellow-900 text-yellow-300' :
                    'bg-gray-800 text-gray-300'
                  }`}>
                    {stop.status === 'active' ? 'Active' :
                     stop.status === 'pending_activation' ? 'Pending' : 'Unknown'}
                  </span>
                  <span className={`text-xs font-medium ${
                    currentPnL >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {currentPnL >= 0 ? '+' : ''}{currentPnL.toFixed(2)}%
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-0.5 bg-blue-500"></div>
                    <span className="text-gray-400">Entry:</span>
                    <span className="text-blue-400 font-mono">
                      {formatSmartPrice(stop.entryPrice, stop.symbol)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-0.5 bg-red-500"></div>
                    <span className="text-gray-400">Stop:</span>
                    <span className="text-red-400 font-mono">
                      {formatSmartPrice(currentStopPrice, stop.symbol)}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-0.5 bg-green-500"></div>
                    <span className="text-gray-400">Target:</span>
                    <span className="text-green-400 font-mono">
                      {formatSmartPrice(profitTarget, stop.symbol)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-0.5 bg-orange-500"></div>
                    <span className="text-gray-400">Trail:</span>
                    <span className="text-orange-400 font-medium">
                      {stop.trailingPercent}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-gray-800">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Qty:</span>
                  <span className="text-white font-mono text-xs">
                    {stop.quantity}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Distance:</span>
                  <span className={`font-mono text-xs ${
                    distanceToStop > 5 ? 'text-green-400' :
                    distanceToStop > 2 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {distanceToStop.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-3 pt-2 border-t border-gray-700">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-blue-500"></div>
              <span className="text-gray-400">Entry Price</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-red-500"></div>
              <span className="text-gray-400">Stop Loss</span>
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-green-500"></div>
              <span className="text-gray-400">Profit Target</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-orange-500 opacity-60"></div>
              <span className="text-gray-400">Trailing Path</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
