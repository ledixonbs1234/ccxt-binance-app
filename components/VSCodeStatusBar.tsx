// File: components/VSCodeStatusBar.tsx
'use client';

import { useTrading } from '../contexts/TradingContext';
import { useEffect, useState } from 'react';

export default function VSCodeStatusBar() {
  const { selectedCoin, coinsData } = useTrading();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const currentCoinData = coinsData[selectedCoin];
  const connectionStatus = 'Connected';
  const latency = Math.floor(Math.random() * 50) + 10; // Simulated latency

  return (
    <div className="vscode-status-bar flex items-center justify-between px-4 py-1 text-xs">
      <div className="flex items-center space-x-4">
        {/* Connection Status */}
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
          <span>{connectionStatus}</span>
        </div>
        
        {/* Current Coin */}
        <div className="flex items-center space-x-1">
          <span className="font-mono">{selectedCoin}</span>
          {currentCoinData && (
            <span className="font-mono">
              ${currentCoinData.price.toFixed(2)}
            </span>
          )}
        </div>
        
        {/* Latency */}
        <div className="flex items-center space-x-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span>{latency}ms</span>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        {/* Market Status */}
        <div className="flex items-center space-x-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span>Market Open</span>
        </div>
        
        {/* Current Time */}
        <div className="flex items-center space-x-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-mono">
            {currentTime.toLocaleTimeString()}
          </span>
        </div>
      </div>
    </div>
  );
}
