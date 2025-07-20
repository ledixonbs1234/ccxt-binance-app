// File: lib/stateSync.ts

import { useEffect, useCallback } from 'react';
import { useMarket } from '../contexts/integrated/MarketContext';
import { useEnhancedTrading } from '../contexts/integrated/EnhancedTradingContext';
import { useNotification } from '../contexts/integrated/NotificationContext';
import { useWebSocket } from '../contexts/integrated/WebSocketContext';
import { useTrading } from '../contexts/TradingContext';

// Types for state synchronization
export interface StateSyncConfig {
  enablePriceSync: boolean;
  enableOrderSync: boolean;
  enableNotificationSync: boolean;
  enableWebSocketSync: boolean;
  syncInterval: number;
}

const defaultConfig: StateSyncConfig = {
  enablePriceSync: true,
  enableOrderSync: true,
  enableNotificationSync: true,
  enableWebSocketSync: true,
  syncInterval: 1000, // 1 second
};

// Hook to sync market data between contexts
export function useMarketDataSync(config: Partial<StateSyncConfig> = {}) {
  const finalConfig = { ...defaultConfig, ...config };
  const { state: marketState, updateCoinPrice } = useMarket();
  const { coinsData } = useTrading();
  const { checkPriceAlerts } = useNotification();

  // Sync price data from TradingContext to MarketContext
  useEffect(() => {
    if (!finalConfig.enablePriceSync) return;

    const syncPrices = () => {
      Object.entries(coinsData).forEach(([symbol, coinData]) => {
        if (coinData.price > 0) {
          updateCoinPrice(
            symbol + 'USDT',
            coinData.price,
            coinData.change24h,
            coinData.change24h
          );

          // Check price alerts
          checkPriceAlerts(symbol + 'USDT', coinData.price);
        }
      });
    };

    syncPrices();
    const interval = setInterval(syncPrices, finalConfig.syncInterval);
    return () => clearInterval(interval);
  }, [coinsData, updateCoinPrice, checkPriceAlerts, finalConfig.enablePriceSync, finalConfig.syncInterval]);

  return { marketState };
}

// Hook to sync trading data between contexts
export function useTradingDataSync(config: Partial<StateSyncConfig> = {}) {
  const finalConfig = { ...defaultConfig, ...config };
  const { state: tradingState } = useEnhancedTrading();
  const { addNotification } = useNotification();

  // Sync order status changes to notifications
  useEffect(() => {
    if (!finalConfig.enableOrderSync || !finalConfig.enableNotificationSync) return;

    tradingState.orders.forEach(order => {
      if (order.status === 'filled' && order.updatedAt) {
        const timeSinceUpdate = Date.now() - order.updatedAt.getTime();
        if (timeSinceUpdate < finalConfig.syncInterval * 2) {
          addNotification({
            type: 'success',
            title: 'Order Filled',
            message: `${order.side.toUpperCase()} order for ${order.amount} ${order.symbol} filled at ${order.averagePrice}`,
            category: 'trading',
            priority: 'medium',
            persistent: false,
            data: order,
          });
        }
      }

      if (order.status === 'cancelled' && order.updatedAt) {
        const timeSinceUpdate = Date.now() - order.updatedAt.getTime();
        if (timeSinceUpdate < finalConfig.syncInterval * 2) {
          addNotification({
            type: 'warning',
            title: 'Order Cancelled',
            message: `${order.side.toUpperCase()} order for ${order.amount} ${order.symbol} was cancelled`,
            category: 'trading',
            priority: 'low',
            persistent: false,
            data: order,
          });
        }
      }
    });
  }, [tradingState.orders, addNotification, finalConfig.enableOrderSync, finalConfig.enableNotificationSync, finalConfig.syncInterval]);

  // Sync position PnL changes to notifications
  useEffect(() => {
    if (!finalConfig.enableNotificationSync) return;

    tradingState.positions.forEach(position => {
      // Notify on significant PnL changes
      if (Math.abs(position.unrealizedPnlPercent) > 5) {
        const timeSinceUpdate = Date.now() - position.updatedAt.getTime();
        if (timeSinceUpdate < finalConfig.syncInterval * 2) {
          addNotification({
            type: position.unrealizedPnl > 0 ? 'success' : 'warning',
            title: 'Position Update',
            message: `${position.symbol} position: ${position.unrealizedPnlPercent.toFixed(2)}% PnL`,
            category: 'trading',
            priority: Math.abs(position.unrealizedPnlPercent) > 10 ? 'high' : 'medium',
            persistent: false,
            data: position,
          });
        }
      }
    });
  }, [tradingState.positions, addNotification, finalConfig.enableNotificationSync, finalConfig.syncInterval]);

  return { tradingState };
}

// Hook to sync WebSocket data
export function useWebSocketDataSync(config: Partial<StateSyncConfig> = {}) {
  const finalConfig = { ...defaultConfig, ...config };
  const { state: wsState, connect, subscribe } = useWebSocket();
  const { updateCoinPrice } = useMarket();
  const { addNotification } = useNotification();

  // Connect to Binance WebSocket
  useEffect(() => {
    if (!finalConfig.enableWebSocketSync) return;

    const connectionId = 'binance-stream';
    const wsUrl = 'wss://stream.binance.com:9443/ws/btcusdt@ticker/ethusdt@ticker/pepeusdt@ticker';

    connect(connectionId, wsUrl, {
      maxReconnectAttempts: 10,
      reconnectDelay: 2000,
    });

    // Subscribe to ticker updates
    const subscriptionId = subscribe(
      connectionId,
      'ticker',
      (data) => {
        if (data.s && data.c) {
          updateCoinPrice(
            data.s, // symbol
            parseFloat(data.c), // current price
            parseFloat(data.P), // price change
            parseFloat(data.P) // price change percent
          );
        }
      }
    );

    return () => {
      // Cleanup handled by WebSocketContext
    };
  }, [connect, subscribe, updateCoinPrice, finalConfig.enableWebSocketSync]);

  // Handle WebSocket connection status notifications
  useEffect(() => {
    if (!finalConfig.enableNotificationSync) return;

    Object.values(wsState.connections).forEach(connection => {
      if (connection.status === 'connected' && connection.lastConnected) {
        const timeSinceConnected = Date.now() - connection.lastConnected.getTime();
        if (timeSinceConnected < finalConfig.syncInterval * 2) {
          addNotification({
            type: 'success',
            title: 'WebSocket Connected',
            message: `Real-time data connection established`,
            category: 'system',
            priority: 'low',
            persistent: false,
          });
        }
      }

      if (connection.status === 'error') {
        addNotification({
          type: 'error',
          title: 'WebSocket Error',
          message: `Real-time data connection failed`,
          category: 'system',
          priority: 'high',
          persistent: true,
        });
      }
    });
  }, [wsState.connections, addNotification, finalConfig.enableNotificationSync, finalConfig.syncInterval]);

  return { wsState };
}

// Main hook to enable all state synchronization
export function useStateSync(config: Partial<StateSyncConfig> = {}) {
  const marketSync = useMarketDataSync(config);
  const tradingSync = useTradingDataSync(config);
  const webSocketSync = useWebSocketDataSync(config);

  return {
    marketState: marketSync.marketState,
    tradingState: tradingSync.tradingState,
    wsState: webSocketSync.wsState,
  };
}

// Utility functions for state management
export const stateUtils = {
  // Format price with appropriate precision
  formatPrice: (price: number, symbol: string): string => {
    if (symbol.includes('PEPE')) {
      return price.toFixed(8);
    } else if (price < 1) {
      return price.toFixed(6);
    } else if (price < 100) {
      return price.toFixed(4);
    } else {
      return price.toFixed(2);
    }
  },

  // Calculate position size based on risk
  calculatePositionSize: (
    accountBalance: number,
    riskPercent: number,
    entryPrice: number,
    stopLossPrice: number
  ): number => {
    const riskAmount = accountBalance * (riskPercent / 100);
    const priceRisk = Math.abs(entryPrice - stopLossPrice);
    return riskAmount / priceRisk;
  },

  // Calculate PnL
  calculatePnL: (
    side: 'long' | 'short',
    entryPrice: number,
    currentPrice: number,
    size: number
  ): { pnl: number; pnlPercent: number } => {
    const priceDiff = side === 'long' 
      ? currentPrice - entryPrice 
      : entryPrice - currentPrice;
    
    const pnl = priceDiff * size;
    const pnlPercent = (priceDiff / entryPrice) * 100;
    
    return { pnl, pnlPercent };
  },

  // Validate order parameters
  validateOrder: (order: {
    symbol: string;
    side: 'buy' | 'sell';
    amount: number;
    price?: number;
  }): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!order.symbol || order.symbol.length < 3) {
      errors.push('Invalid symbol');
    }

    if (order.amount <= 0) {
      errors.push('Amount must be greater than 0');
    }

    if (order.price && order.price <= 0) {
      errors.push('Price must be greater than 0');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },

  // Generate unique ID
  generateId: (prefix: string = 'id'): string => {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },

  // Debounce function for performance
  debounce: <T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  },

  // Throttle function for performance
  throttle: <T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },
};
