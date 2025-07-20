// File: contexts/integrated/EnhancedTradingContext.tsx
'use client';

import React, { createContext, useContext, useReducer, useCallback, useEffect, ReactNode } from 'react';
import { useTrading } from '../TradingContext';
import { useUser } from './UserContext';

// Types
export interface Order {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'stop' | 'trailing-stop';
  amount: number;
  price?: number;
  stopPrice?: number;
  trailingPercent?: number;
  status: 'pending' | 'open' | 'filled' | 'cancelled' | 'rejected';
  filledAmount: number;
  averagePrice?: number;
  fee: number;
  createdAt: Date;
  updatedAt: Date;
  clientOrderId?: string;
}

export interface Position {
  id: string;
  symbol: string;
  side: 'long' | 'short';
  size: number;
  entryPrice: number;
  currentPrice: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
  realizedPnl: number;
  stopLoss?: number;
  takeProfit?: number;
  trailingStop?: {
    percent: number;
    highestPrice: number;
    lowestPrice: number;
    stopPrice: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface TradingAccount {
  balance: number;
  availableBalance: number;
  totalEquity: number;
  marginUsed: number;
  marginAvailable: number;
  unrealizedPnl: number;
  dailyPnl: number;
  totalPnl: number;
}

export interface EnhancedTradingState {
  // Orders
  orders: Order[];
  openOrders: Order[];
  orderHistory: Order[];
  
  // Positions
  positions: Position[];
  openPositions: Position[];
  positionHistory: Position[];
  
  // Account
  account: TradingAccount;
  
  // UI State
  isLoading: boolean;
  error: string | null;
  selectedOrder: Order | null;
  selectedPosition: Position | null;
  
  // Trading Settings
  settings: {
    confirmOrders: boolean;
    defaultOrderType: 'market' | 'limit';
    defaultStopLoss: number;
    defaultTakeProfit: number;
    maxPositionSize: number;
    riskPerTrade: number;
  };
}

// Initial state
const initialAccount: TradingAccount = {
  balance: 10000,
  availableBalance: 10000,
  totalEquity: 10000,
  marginUsed: 0,
  marginAvailable: 10000,
  unrealizedPnl: 0,
  dailyPnl: 0,
  totalPnl: 0,
};

const initialState: EnhancedTradingState = {
  orders: [],
  openOrders: [],
  orderHistory: [],
  positions: [],
  openPositions: [],
  positionHistory: [],
  account: initialAccount,
  isLoading: false,
  error: null,
  selectedOrder: null,
  selectedPosition: null,
  settings: {
    confirmOrders: true,
    defaultOrderType: 'limit',
    defaultStopLoss: 2,
    defaultTakeProfit: 5,
    maxPositionSize: 1000,
    riskPerTrade: 1,
  },
};

// Action types
type EnhancedTradingAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'ADD_ORDER'; payload: Order }
  | { type: 'UPDATE_ORDER'; payload: Order }
  | { type: 'REMOVE_ORDER'; payload: string }
  | { type: 'ADD_POSITION'; payload: Position }
  | { type: 'UPDATE_POSITION'; payload: Position }
  | { type: 'CLOSE_POSITION'; payload: string }
  | { type: 'UPDATE_ACCOUNT'; payload: Partial<TradingAccount> }
  | { type: 'SELECT_ORDER'; payload: Order | null }
  | { type: 'SELECT_POSITION'; payload: Position | null }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<EnhancedTradingState['settings']> };

// Reducer
function enhancedTradingReducer(state: EnhancedTradingState, action: EnhancedTradingAction): EnhancedTradingState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    
    case 'ADD_ORDER':
      const newOrders = [...state.orders, action.payload];
      return {
        ...state,
        orders: newOrders,
        openOrders: newOrders.filter(o => ['pending', 'open'].includes(o.status)),
        orderHistory: newOrders.filter(o => ['filled', 'cancelled', 'rejected'].includes(o.status)),
      };
    
    case 'UPDATE_ORDER':
      const updatedOrders = state.orders.map(order =>
        order.id === action.payload.id ? action.payload : order
      );
      return {
        ...state,
        orders: updatedOrders,
        openOrders: updatedOrders.filter(o => ['pending', 'open'].includes(o.status)),
        orderHistory: updatedOrders.filter(o => ['filled', 'cancelled', 'rejected'].includes(o.status)),
        selectedOrder: state.selectedOrder?.id === action.payload.id ? action.payload : state.selectedOrder,
      };
    
    case 'REMOVE_ORDER':
      const filteredOrders = state.orders.filter(order => order.id !== action.payload);
      return {
        ...state,
        orders: filteredOrders,
        openOrders: filteredOrders.filter(o => ['pending', 'open'].includes(o.status)),
        orderHistory: filteredOrders.filter(o => ['filled', 'cancelled', 'rejected'].includes(o.status)),
        selectedOrder: state.selectedOrder?.id === action.payload ? null : state.selectedOrder,
      };
    
    case 'ADD_POSITION':
      const newPositions = [...state.positions, action.payload];
      return {
        ...state,
        positions: newPositions,
        openPositions: newPositions.filter(p => p.size !== 0),
        positionHistory: newPositions.filter(p => p.size === 0),
      };
    
    case 'UPDATE_POSITION':
      const updatedPositions = state.positions.map(position =>
        position.id === action.payload.id ? action.payload : position
      );
      return {
        ...state,
        positions: updatedPositions,
        openPositions: updatedPositions.filter(p => p.size !== 0),
        positionHistory: updatedPositions.filter(p => p.size === 0),
        selectedPosition: state.selectedPosition?.id === action.payload.id ? action.payload : state.selectedPosition,
      };
    
    case 'CLOSE_POSITION':
      const closedPositions = state.positions.map(position =>
        position.id === action.payload ? { ...position, size: 0, updatedAt: new Date() } : position
      );
      return {
        ...state,
        positions: closedPositions,
        openPositions: closedPositions.filter(p => p.size !== 0),
        positionHistory: closedPositions.filter(p => p.size === 0),
        selectedPosition: state.selectedPosition?.id === action.payload ? null : state.selectedPosition,
      };
    
    case 'UPDATE_ACCOUNT':
      return {
        ...state,
        account: { ...state.account, ...action.payload },
      };
    
    case 'SELECT_ORDER':
      return { ...state, selectedOrder: action.payload };
    
    case 'SELECT_POSITION':
      return { ...state, selectedPosition: action.payload };
    
    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: { ...state.settings, ...action.payload },
      };
    
    default:
      return state;
  }
}

// Context
interface EnhancedTradingContextType {
  state: EnhancedTradingState;
  
  // Order management
  createOrder: (orderData: Omit<Order, 'id' | 'status' | 'filledAmount' | 'fee' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  cancelOrder: (orderId: string) => Promise<void>;
  modifyOrder: (orderId: string, updates: Partial<Order>) => Promise<void>;
  
  // Position management
  closePosition: (positionId: string, amount?: number) => Promise<void>;
  updateStopLoss: (positionId: string, stopLoss: number) => void;
  updateTakeProfit: (positionId: string, takeProfit: number) => void;
  enableTrailingStop: (positionId: string, percent: number) => void;
  
  // Account management
  refreshAccount: () => Promise<void>;
  
  // UI actions
  selectOrder: (order: Order | null) => void;
  selectPosition: (position: Position | null) => void;
  updateSettings: (settings: Partial<EnhancedTradingState['settings']>) => void;
  
  // Utilities
  calculatePositionSize: (symbol: string, riskPercent: number, stopLossPercent: number) => number;
  calculatePnL: (position: Position, currentPrice: number) => { unrealizedPnl: number; unrealizedPnlPercent: number };
}

const EnhancedTradingContext = createContext<EnhancedTradingContextType | undefined>(undefined);

// Provider component
interface EnhancedTradingProviderProps {
  children: ReactNode;
}

export function EnhancedTradingProvider({ children }: EnhancedTradingProviderProps) {
  const [state, dispatch] = useReducer(enhancedTradingReducer, initialState);
  const { coinsData } = useTrading(); // Use existing trading context for market data
  const { state: userState } = useUser();

  // Initialize settings from user preferences
  useEffect(() => {
    if (userState.user?.preferences.trading) {
      dispatch({
        type: 'UPDATE_SETTINGS',
        payload: {
          confirmOrders: userState.user.preferences.trading.confirmOrders,
          defaultOrderType: userState.user.preferences.trading.defaultOrderType,
          maxPositionSize: userState.user.preferences.trading.riskManagement.maxPositionSize,
          defaultStopLoss: userState.user.preferences.trading.riskManagement.stopLossPercentage,
          defaultTakeProfit: userState.user.preferences.trading.riskManagement.takeProfitPercentage,
        },
      });
    }
  }, [userState.user?.preferences.trading]);

  const createOrder = useCallback(async (orderData: Omit<Order, 'id' | 'status' | 'filledAmount' | 'fee' | 'createdAt' | 'updatedAt'>) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const order: Order = {
        ...orderData,
        id: `order_${Date.now()}`,
        status: 'pending',
        filledAmount: 0,
        fee: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        clientOrderId: `client_${Date.now()}`,
      };

      // TODO: Implement actual order creation via API
      // For now, simulate order processing
      dispatch({ type: 'ADD_ORDER', payload: order });
      
      // Simulate order fill after delay
      setTimeout(() => {
        const filledOrder: Order = {
          ...order,
          status: 'filled',
          filledAmount: order.amount,
          averagePrice: order.price || coinsData[order.symbol as keyof typeof coinsData]?.price || 0,
          fee: (order.amount * (order.price || 0)) * 0.001, // 0.1% fee
          updatedAt: new Date(),
        };
        dispatch({ type: 'UPDATE_ORDER', payload: filledOrder });
        
        // Create position if order is filled
        if (filledOrder.status === 'filled') {
          createPositionFromOrder(filledOrder);
        }
      }, 1000);
      
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to create order' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [coinsData]);

  const createPositionFromOrder = useCallback((order: Order) => {
    const currentPrice = coinsData[order.symbol as keyof typeof coinsData]?.price || order.averagePrice || 0;
    
    const position: Position = {
      id: `position_${Date.now()}`,
      symbol: order.symbol,
      side: order.side === 'buy' ? 'long' : 'short',
      size: order.filledAmount,
      entryPrice: order.averagePrice || currentPrice,
      currentPrice,
      unrealizedPnl: 0,
      unrealizedPnlPercent: 0,
      realizedPnl: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    dispatch({ type: 'ADD_POSITION', payload: position });
  }, [coinsData]);

  const cancelOrder = useCallback(async (orderId: string) => {
    try {
      // TODO: Implement actual order cancellation via API
      const cancelledOrder = state.orders.find(o => o.id === orderId);
      if (cancelledOrder) {
        dispatch({
          type: 'UPDATE_ORDER',
          payload: { ...cancelledOrder, status: 'cancelled', updatedAt: new Date() },
        });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to cancel order' });
    }
  }, [state.orders]);

  const closePosition = useCallback(async (positionId: string, amount?: number) => {
    try {
      // TODO: Implement actual position closing via API
      dispatch({ type: 'CLOSE_POSITION', payload: positionId });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to close position' });
    }
  }, []);

  const updateStopLoss = useCallback((positionId: string, stopLoss: number) => {
    const position = state.positions.find(p => p.id === positionId);
    if (position) {
      dispatch({
        type: 'UPDATE_POSITION',
        payload: { ...position, stopLoss, updatedAt: new Date() },
      });
    }
  }, [state.positions]);

  const updateTakeProfit = useCallback((positionId: string, takeProfit: number) => {
    const position = state.positions.find(p => p.id === positionId);
    if (position) {
      dispatch({
        type: 'UPDATE_POSITION',
        payload: { ...position, takeProfit, updatedAt: new Date() },
      });
    }
  }, [state.positions]);

  const enableTrailingStop = useCallback((positionId: string, percent: number) => {
    const position = state.positions.find(p => p.id === positionId);
    if (position) {
      const trailingStop = {
        percent,
        highestPrice: position.currentPrice,
        lowestPrice: position.currentPrice,
        stopPrice: position.side === 'long' 
          ? position.currentPrice * (1 - percent / 100)
          : position.currentPrice * (1 + percent / 100),
      };
      
      dispatch({
        type: 'UPDATE_POSITION',
        payload: { ...position, trailingStop, updatedAt: new Date() },
      });
    }
  }, [state.positions]);

  const refreshAccount = useCallback(async () => {
    try {
      // TODO: Implement actual account data fetching
      // For now, calculate from positions
      const totalUnrealizedPnl = state.openPositions.reduce((sum, pos) => sum + pos.unrealizedPnl, 0);
      const totalRealizedPnl = state.positions.reduce((sum, pos) => sum + pos.realizedPnl, 0);
      
      dispatch({
        type: 'UPDATE_ACCOUNT',
        payload: {
          unrealizedPnl: totalUnrealizedPnl,
          totalPnl: totalRealizedPnl,
          totalEquity: initialAccount.balance + totalRealizedPnl + totalUnrealizedPnl,
        },
      });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to refresh account' });
    }
  }, [state.openPositions, state.positions]);

  const selectOrder = useCallback((order: Order | null) => {
    dispatch({ type: 'SELECT_ORDER', payload: order });
  }, []);

  const selectPosition = useCallback((position: Position | null) => {
    dispatch({ type: 'SELECT_POSITION', payload: position });
  }, []);

  const updateSettings = useCallback((settings: Partial<EnhancedTradingState['settings']>) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: settings });
  }, []);

  const calculatePositionSize = useCallback((symbol: string, riskPercent: number, stopLossPercent: number) => {
    const accountBalance = state.account.availableBalance;
    const riskAmount = accountBalance * (riskPercent / 100);
    const currentPrice = coinsData[symbol as keyof typeof coinsData]?.price || 0;
    
    if (currentPrice === 0) return 0;
    
    const stopLossDistance = currentPrice * (stopLossPercent / 100);
    return riskAmount / stopLossDistance;
  }, [state.account.availableBalance, coinsData]);

  const calculatePnL = useCallback((position: Position, currentPrice: number) => {
    const priceDiff = position.side === 'long' 
      ? currentPrice - position.entryPrice
      : position.entryPrice - currentPrice;
    
    const unrealizedPnl = priceDiff * position.size;
    const unrealizedPnlPercent = (priceDiff / position.entryPrice) * 100;
    
    return { unrealizedPnl, unrealizedPnlPercent };
  }, []);

  // Update positions with current prices
  useEffect(() => {
    state.openPositions.forEach(position => {
      const currentPrice = coinsData[position.symbol as keyof typeof coinsData]?.price;
      if (currentPrice && currentPrice !== position.currentPrice) {
        const { unrealizedPnl, unrealizedPnlPercent } = calculatePnL(position, currentPrice);
        
        dispatch({
          type: 'UPDATE_POSITION',
          payload: {
            ...position,
            currentPrice,
            unrealizedPnl,
            unrealizedPnlPercent,
            updatedAt: new Date(),
          },
        });
      }
    });
  }, [coinsData, state.openPositions, calculatePnL]);

  const contextValue: EnhancedTradingContextType = {
    state,
    createOrder,
    cancelOrder,
    modifyOrder: async () => {}, // TODO: Implement
    closePosition,
    updateStopLoss,
    updateTakeProfit,
    enableTrailingStop,
    refreshAccount,
    selectOrder,
    selectPosition,
    updateSettings,
    calculatePositionSize,
    calculatePnL,
  };

  return (
    <EnhancedTradingContext.Provider value={contextValue}>
      {children}
    </EnhancedTradingContext.Provider>
  );
}

// Hook to use the context
export function useEnhancedTrading() {
  const context = useContext(EnhancedTradingContext);
  if (context === undefined) {
    throw new Error('useEnhancedTrading must be used within an EnhancedTradingProvider');
  }
  return context;
}
