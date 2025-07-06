'use client';

import React, { useState, useRef, useEffect } from 'react';
import { TrailingStopPosition, TrailingStopStrategy } from '../types/trailingStop';
import {
  CogIcon,
  XMarkIcon,
  CheckIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  PlayIcon,
  PauseIcon,
} from '@heroicons/react/24/outline';

interface InteractiveChartControlsProps {
  position: TrailingStopPosition;
  onUpdate: (position: TrailingStopPosition) => void;
  onRemove: (positionId: string) => void;
  chartBounds: { x: number; y: number; width: number; height: number };
  priceToPixel: (price: number) => number;
  pixelToPrice: (pixel: number) => number;
}

export default function InteractiveChartControls({
  position,
  onUpdate,
  onRemove,
  chartBounds,
  priceToPixel,
  pixelToPrice
}: InteractiveChartControlsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState<'stop' | 'entry' | null>(null);
  const [tempPosition, setTempPosition] = useState(position);
  const [showQuickActions, setShowQuickActions] = useState(false);
  
  const controlsRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ y: number; price: number } | null>(null);

  // Calculate positions on chart
  const entryPixelY = priceToPixel(position.entryPrice);
  const stopPixelY = priceToPixel(position.stopLossPrice);
  const currentPixelY = priceToPixel(position.currentPrice);

  // Handle mouse events for dragging
  const handleMouseDown = (e: React.MouseEvent, type: 'stop' | 'entry') => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragging(true);
    setDragType(type);
    dragStartRef.current = {
      y: e.clientY,
      price: type === 'stop' ? position.stopLossPrice : position.entryPrice
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !dragStartRef.current || !dragType) return;

    const deltaY = e.clientY - dragStartRef.current.y;
    const deltaPrice = pixelToPrice(deltaY) - pixelToPrice(0);
    const newPrice = dragStartRef.current.price - deltaPrice; // Invert because chart Y is inverted

    const updatedPosition = { ...tempPosition };
    
    if (dragType === 'stop') {
      updatedPosition.stopLossPrice = Math.max(0, newPrice);
      // Recalculate trailing percentage based on new stop loss
      if (position.side === 'sell') {
        const newTrailingPercent = ((position.highestPrice - newPrice) / position.highestPrice) * 100;
        updatedPosition.trailingPercent = Math.max(0.1, Math.min(50, newTrailingPercent));
      }
    } else if (dragType === 'entry') {
      updatedPosition.entryPrice = Math.max(0, newPrice);
    }

    setTempPosition(updatedPosition);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragType(null);
    dragStartRef.current = null;

    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);

    // Apply changes
    onUpdate(tempPosition);
  };

  // Quick adjustment functions
  const adjustTrailingPercent = (delta: number) => {
    const newPercent = Math.max(0.1, Math.min(50, position.trailingPercent + delta));
    const updatedPosition = { ...position, trailingPercent: newPercent };
    
    // Recalculate stop loss with new percentage
    if (position.side === 'sell') {
      updatedPosition.stopLossPrice = position.highestPrice * (1 - newPercent / 100);
    } else {
      updatedPosition.stopLossPrice = position.lowestPrice * (1 + newPercent / 100);
    }
    
    onUpdate(updatedPosition);
  };

  const togglePositionStatus = () => {
    const newStatus = position.status === 'active' ? 'pending' : 'active';
    onUpdate({ ...position, status: newStatus });
  };

  // Position controls on the chart
  const PositionMarker = ({ 
    y, 
    color, 
    label, 
    isDraggable = false, 
    onMouseDown 
  }: { 
    y: number; 
    color: string; 
    label: string; 
    isDraggable?: boolean;
    onMouseDown?: (e: React.MouseEvent) => void;
  }) => (
    <div
      className={`absolute left-0 flex items-center ${isDraggable ? 'cursor-ns-resize' : ''}`}
      style={{ 
        top: y - 10, 
        zIndex: 1000,
        pointerEvents: 'auto'
      }}
      onMouseDown={onMouseDown}
    >
      <div
        className={`w-3 h-3 rounded-full border-2 border-white shadow-lg`}
        style={{ backgroundColor: color }}
      />
      <div
        className={`ml-3 px-3 py-1.5 text-xs font-medium rounded-lg shadow-lg text-white border border-white/20`}
        style={{ backgroundColor: color }}
      >
        {label}
      </div>
      {isDraggable && (
        <div className="ml-2 text-xs text-gray-400 font-medium">
          ⇅
        </div>
      )}
    </div>
  );

  return (
    <div
      ref={controlsRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 999 }}
    >
      {/* Position Markers */}
      <PositionMarker
        y={entryPixelY}
        color="#3b82f6"
        label={`Entry: $${position.entryPrice.toFixed(2)}`}
        isDraggable={true}
        onMouseDown={(e) => handleMouseDown(e, 'entry')}
      />
      
      <PositionMarker
        y={stopPixelY}
        color="#ef4444"
        label={`Stop: $${(isDragging && dragType === 'stop' ? tempPosition : position).stopLossPrice.toFixed(2)}`}
        isDraggable={true}
        onMouseDown={(e) => handleMouseDown(e, 'stop')}
      />
      
      <PositionMarker
        y={currentPixelY}
        color="#10b981"
        label={`Current: $${position.currentPrice.toFixed(2)}`}
      />

      {/* Quick Actions Panel */}
      <div
        className="absolute top-6 right-6 pointer-events-auto"
        style={{ zIndex: 1001 }}
      >
        <div className="flex items-center gap-3">
          {/* Quick Actions Toggle */}
          <button
            onClick={() => setShowQuickActions(!showQuickActions)}
            className="p-3 bg-panel border border-border rounded-lg shadow-lg hover:bg-background transition-colors"
            title="Quick Actions"
          >
            <CogIcon className="w-5 h-5" />
          </button>

          {/* Status Toggle */}
          <button
            onClick={togglePositionStatus}
            className={`p-2 border border-border rounded-lg shadow-lg transition-colors ${
              position.status === 'active' 
                ? 'bg-green-500 text-white hover:bg-green-600' 
                : 'bg-yellow-500 text-white hover:bg-yellow-600'
            }`}
            title={position.status === 'active' ? 'Pause Trailing' : 'Resume Trailing'}
          >
            {position.status === 'active' ? (
              <PauseIcon className="w-4 h-4" />
            ) : (
              <PlayIcon className="w-4 h-4" />
            )}
          </button>

          {/* Remove Position */}
          <button
            onClick={() => onRemove(position.id)}
            className="p-2 bg-red-500 text-white border border-red-600 rounded-lg shadow-lg hover:bg-red-600 transition-colors"
            title="Remove Position"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Actions Panel */}
        {showQuickActions && (
          <div className="absolute top-12 right-0 bg-panel border border-border rounded-lg shadow-xl p-4 min-w-64">
            <div className="space-y-4">
              {/* Trailing Percentage Adjustment */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Trailing Percentage: {position.trailingPercent.toFixed(1)}%
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => adjustTrailingPercent(-0.5)}
                    className="p-1 bg-background border border-border rounded hover:bg-panel transition-colors"
                  >
                    <ArrowDownIcon className="w-3 h-3" />
                  </button>
                  <div className="flex-1 bg-background border border-border rounded px-2 py-1 text-center text-sm">
                    {position.trailingPercent.toFixed(1)}%
                  </div>
                  <button
                    onClick={() => adjustTrailingPercent(0.5)}
                    className="p-1 bg-background border border-border rounded hover:bg-panel transition-colors"
                  >
                    <ArrowUpIcon className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Strategy Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">Strategy</label>
                <select
                  value={position.strategy}
                  onChange={(e) => onUpdate({ 
                    ...position, 
                    strategy: e.target.value as TrailingStopStrategy 
                  })}
                  className="w-full bg-background border border-border rounded px-2 py-1 text-sm"
                >
                  <option value="percentage">Percentage</option>
                  <option value="atr">ATR Based</option>
                  <option value="support_resistance">Support/Resistance</option>
                  <option value="dynamic">Dynamic</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>

              {/* Position Info */}
              <div className="pt-2 border-t border-border">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted">P&L:</span>
                    <div className={`font-medium ${
                      position.unrealizedPnLPercent >= 0 ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {position.unrealizedPnLPercent >= 0 ? '+' : ''}{position.unrealizedPnLPercent.toFixed(2)}%
                    </div>
                  </div>
                  <div>
                    <span className="text-muted">Max Profit:</span>
                    <div className="font-medium text-green-500">
                      +{position.maxProfit.toFixed(2)}%
                    </div>
                  </div>
                  <div>
                    <span className="text-muted">Quantity:</span>
                    <div className="font-medium">{position.quantity}</div>
                  </div>
                  <div>
                    <span className="text-muted">Side:</span>
                    <div className="font-medium capitalize">{position.side}</div>
                  </div>
                </div>
              </div>

              {/* Quick Preset Adjustments */}
              <div>
                <label className="block text-sm font-medium mb-2">Quick Presets</label>
                <div className="grid grid-cols-3 gap-1">
                  {[1, 2.5, 5].map(percent => (
                    <button
                      key={percent}
                      onClick={() => {
                        const updatedPosition = { ...position, trailingPercent: percent };
                        if (position.side === 'sell') {
                          updatedPosition.stopLossPrice = position.highestPrice * (1 - percent / 100);
                        } else {
                          updatedPosition.stopLossPrice = position.lowestPrice * (1 + percent / 100);
                        }
                        onUpdate(updatedPosition);
                      }}
                      className="px-2 py-1 text-xs bg-background border border-border rounded hover:bg-panel transition-colors"
                    >
                      {percent}%
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Dragging Indicator */}
      {isDragging && (
        <div className="absolute top-4 left-4 bg-accent text-white px-3 py-2 rounded-lg shadow-lg pointer-events-none">
          <div className="text-sm font-medium">
            Adjusting {dragType === 'stop' ? 'Stop Loss' : 'Entry Price'}
          </div>
          <div className="text-xs opacity-90">
            {dragType === 'stop' 
              ? `$${tempPosition.stopLossPrice.toFixed(2)} (${tempPosition.trailingPercent.toFixed(1)}%)`
              : `$${tempPosition.entryPrice.toFixed(2)}`
            }
          </div>
        </div>
      )}

      {/* Connection Lines */}
      <svg
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 998 }}
      >
        {/* Entry to Current Price Line */}
        <line
          x1={chartBounds.width - 100}
          y1={entryPixelY}
          x2={chartBounds.width - 100}
          y2={currentPixelY}
          stroke="#3b82f6"
          strokeWidth="1"
          strokeDasharray="5,5"
          opacity="0.5"
        />
        
        {/* Current to Stop Loss Line */}
        <line
          x1={chartBounds.width - 100}
          y1={currentPixelY}
          x2={chartBounds.width - 100}
          y2={stopPixelY}
          stroke="#ef4444"
          strokeWidth="2"
          opacity="0.7"
        />
      </svg>
    </div>
  );
}
