// File: components/SmartTrailingMonitor.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useSmartTrailing, SmartTrailingNotification } from '../contexts/SmartTrailingContext';
import VSCodeCard from './VSCodeCard';
import { CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon, XCircleIcon } from '@heroicons/react/20/solid';

export default function SmartTrailingMonitor() {
  const {
    isRunning, settings, coinAnalyses, activePositions, notifications,
    startService, stopService, updateSettings, clearNotifications
  } = useSmartTrailing();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [localSettings, setLocalSettings] = useState(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setLocalSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : Number(value)
    }));
  };

  const handleSaveSettings = () => {
    updateSettings(localSettings);
    setIsSettingsOpen(false);
  };
  
  const getMomentumColor = (momentum: string) => {
    switch (momentum) {
      case 'strong_up': return 'bg-success/20 text-success border border-success/30';
      case 'up': return 'bg-success/20 text-success border border-success/30';
      case 'sideways': return 'bg-info/20 text-info border border-info/30';
      case 'down': return 'bg-warning/20 text-warning border border-warning/30';
      case 'strong_down': return 'bg-error/20 text-error border border-error/30';
      default: return 'bg-info/20 text-info border border-info/30';
    }
  };

  return (
    <div className="space-y-6">
      <VSCodeCard
        title="Smart Trailing Service"
        subtitle="AI-powered opportunity detection and automated position management"
        headerActions={
          <div className="flex items-center gap-4">
             <div className={`status-indicator ${isRunning ? 'status-online' : 'status-offline'}`}>
              <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
              {isRunning ? 'Active' : 'Inactive'}
            </div>
            <button onClick={() => setIsSettingsOpen(!isSettingsOpen)} className="vscode-button-secondary">Settings</button>
            <button onClick={isRunning ? stopService : () => startService()} className={`vscode-button ${isRunning ? 'vscode-button-warning' : 'vscode-button-success'}`}>
              {isRunning ? 'Stop Service' : 'Start Service'}
            </button>
          </div>
        }
      >
        {isSettingsOpen && (
          <div className="p-4 border-b border-border">
            <h4 className="font-semibold mb-3">Service Settings</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Min Price Change */}
                <div>
                  <label className="text-xs text-muted">Min 24h Change (%)</label>
                  <input type="number" name="minPriceChange" value={localSettings.minPriceChange} onChange={handleSettingsChange} className="vscode-input" />
                </div>
                {/* Investment Amount */}
                <div>
                  <label className="text-xs text-muted">Invest/Trade (USDT)</label>
                  <input type="number" name="investmentAmount" value={localSettings.investmentAmount} onChange={handleSettingsChange} className="vscode-input" />
                </div>
                {/* Trailing Percent */}
                <div>
                  <label className="text-xs text-muted">Trailing Stop (%)</label>
                  <input type="number" name="trailingPercent" value={localSettings.trailingPercent} onChange={handleSettingsChange} className="vscode-input" />
                </div>
                 {/* Max Positions */}
                <div>
                  <label className="text-xs text-muted">Max Active Positions</label>
                  <input type="number" name="maxPositions" value={localSettings.maxPositions} onChange={handleSettingsChange} className="vscode-input" />
                </div>
            </div>
             <div className="flex justify-end mt-4 gap-2">
                <button onClick={() => setIsSettingsOpen(false)} className="vscode-button-secondary">Cancel</button>
                <button onClick={handleSaveSettings} className="vscode-button">Save Settings</button>
            </div>
          </div>
        )}
      </VSCodeCard>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Market Analysis */}
        <VSCodeCard title="Phân tích thị trường" subtitle="Đánh giá coin theo thời gian thực">
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {coinAnalyses.length === 0 && <p className="text-muted text-center py-4">Khởi động dịch vụ để xem phân tích.</p>}
            {coinAnalyses.map(a => (
              <div key={a.symbol} className={`bg-card border border-border rounded-card p-3 shadow-custom ${a.analysis.isGoodForTrailing ? 'border-trading-profit/30 bg-trading-profit/5' : ''}`}>
                <div className="flex justify-between items-center">
                  <span className="font-semibold">{a.symbol}</span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-button ${getMomentumColor(a.momentum)}`}>{a.momentum.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between items-center text-sm mt-1">
                  <span className="text-muted">Độ tin cậy</span>
                  <span className="font-semibold">{a.analysis.confidence.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-secondary-bg rounded-full h-1.5 mt-1">
                    <div className="bg-accent h-1.5 rounded-full transition-all duration-300" style={{width: `${a.analysis.confidence}%`}}></div>
                </div>
              </div>
            ))}
          </div>
        </VSCodeCard>

        {/* Active Positions */}
        <VSCodeCard title="Vị thế đang hoạt động" subtitle="Trailing stops tự động">
          <div className="space-y-2 max-h-96 overflow-y-auto">
             {activePositions.length === 0 && <p className="text-muted text-center py-4">Không có vị thế nào đang hoạt động.</p>}
            {activePositions.map(p => {
              const currentPrice = coinAnalyses.find(a => a.symbol === p.symbol)?.currentPrice || p.entryPrice;
              const pnl = (currentPrice - p.entryPrice) / p.entryPrice * 100;
              return (
              <div key={p.id} className="bg-card border border-border rounded-card p-3 shadow-custom">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">{p.symbol}</span>
                    <span className={`font-semibold ${pnl >= 0 ? 'text-trading-profit' : 'text-trading-loss'}`}>{pnl.toFixed(2)}%</span>
                  </div>
                  <p className="text-xs text-muted">Vào lệnh: ${p.entryPrice.toFixed(4)} | SL: {p.quantity.toFixed(5)}</p>
              </div>
            )})}
          </div>
        </VSCodeCard>
      </div>
      
      {/* Notifications */}
      <VSCodeCard title="Thông báo" subtitle="Hoạt động gần đây của dịch vụ" headerActions={<button onClick={clearNotifications} className="px-2 py-1 text-xs font-medium bg-secondary-bg text-foreground border border-border rounded-button hover:bg-hover transition-colors">Xóa</button>}>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {notifications.length === 0 && <p className="text-muted text-center py-4">Không có hoạt động gần đây.</p>}
          {notifications.map(n => (
            <div key={n.id} className={`flex items-center gap-3 p-3 rounded-card border ${
              n.type === 'success' ? 'bg-success/10 border-success/30 text-success' :
              n.type === 'error' ? 'bg-error/10 border-error/30 text-error' :
              'bg-info/10 border-info/30 text-info'
            }`}>
                {n.type === 'success' ? <CheckCircleIcon className="h-5 w-5 flex-shrink-0" /> :
                 n.type === 'error' ? <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0" /> :
                 <InformationCircleIcon className="h-5 w-5 flex-shrink-0" />}
                <div>
                  <p className="font-semibold text-sm">{n.title}</p>
                  <p className="text-xs opacity-75">{n.message}</p>
                </div>
            </div>
          ))}
        </div>
      </VSCodeCard>
    </div>
  );
}