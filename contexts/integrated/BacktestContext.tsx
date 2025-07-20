// File: contexts/integrated/BacktestContext.tsx
'use client';

import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';

// Types
export interface BacktestStrategy {
  id: string;
  name: string;
  description: string;
  parameters: Record<string, any>;
  type: 'sma' | 'ema' | 'rsi' | 'macd' | 'bollinger' | 'custom';
  createdAt: Date;
  updatedAt: Date;
}

export interface BacktestConfiguration {
  id: string;
  name: string;
  symbol: string;
  timeframe: '1m' | '5m' | '15m' | '1h' | '4h' | '1d';
  startDate: Date;
  endDate: Date;
  initialCapital: number;
  strategy: BacktestStrategy;
  riskManagement: {
    stopLoss: number;
    takeProfit: number;
    maxPositionSize: number;
  };
  fees: {
    maker: number;
    taker: number;
  };
}

export interface BacktestTrade {
  id: string;
  entryTime: Date;
  exitTime: Date;
  side: 'buy' | 'sell';
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  pnl: number;
  pnlPercent: number;
  fees: number;
  reason: 'signal' | 'stop_loss' | 'take_profit' | 'manual';
}

export interface BacktestResult {
  id: string;
  configurationId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  startTime: Date;
  endTime?: Date;
  trades: BacktestTrade[];
  metrics: {
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    winRate: number;
    totalPnl: number;
    totalPnlPercent: number;
    maxDrawdown: number;
    maxDrawdownPercent: number;
    sharpeRatio: number;
    profitFactor: number;
    averageWin: number;
    averageLoss: number;
    largestWin: number;
    largestLoss: number;
  };
  equityCurve: Array<{ time: Date; equity: number; drawdown: number }>;
  error?: string;
}

export interface BacktestState {
  strategies: BacktestStrategy[];
  configurations: BacktestConfiguration[];
  results: BacktestResult[];
  activeBacktest: BacktestResult | null;
  selectedResult: BacktestResult | null;
  isLoading: boolean;
  error: string | null;
}

// Initial state
const initialState: BacktestState = {
  strategies: [],
  configurations: [],
  results: [],
  activeBacktest: null,
  selectedResult: null,
  isLoading: false,
  error: null,
};

// Action types
type BacktestAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_STRATEGIES'; payload: BacktestStrategy[] }
  | { type: 'ADD_STRATEGY'; payload: BacktestStrategy }
  | { type: 'UPDATE_STRATEGY'; payload: BacktestStrategy }
  | { type: 'DELETE_STRATEGY'; payload: string }
  | { type: 'SET_CONFIGURATIONS'; payload: BacktestConfiguration[] }
  | { type: 'ADD_CONFIGURATION'; payload: BacktestConfiguration }
  | { type: 'UPDATE_CONFIGURATION'; payload: BacktestConfiguration }
  | { type: 'DELETE_CONFIGURATION'; payload: string }
  | { type: 'SET_RESULTS'; payload: BacktestResult[] }
  | { type: 'ADD_RESULT'; payload: BacktestResult }
  | { type: 'UPDATE_RESULT'; payload: BacktestResult }
  | { type: 'DELETE_RESULT'; payload: string }
  | { type: 'SET_ACTIVE_BACKTEST'; payload: BacktestResult | null }
  | { type: 'SET_SELECTED_RESULT'; payload: BacktestResult | null };

// Reducer
function backtestReducer(state: BacktestState, action: BacktestAction): BacktestState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    
    case 'SET_STRATEGIES':
      return { ...state, strategies: action.payload };
    
    case 'ADD_STRATEGY':
      return { ...state, strategies: [...state.strategies, action.payload] };
    
    case 'UPDATE_STRATEGY':
      return {
        ...state,
        strategies: state.strategies.map(strategy =>
          strategy.id === action.payload.id ? action.payload : strategy
        ),
      };
    
    case 'DELETE_STRATEGY':
      return {
        ...state,
        strategies: state.strategies.filter(strategy => strategy.id !== action.payload),
      };
    
    case 'SET_CONFIGURATIONS':
      return { ...state, configurations: action.payload };
    
    case 'ADD_CONFIGURATION':
      return { ...state, configurations: [...state.configurations, action.payload] };
    
    case 'UPDATE_CONFIGURATION':
      return {
        ...state,
        configurations: state.configurations.map(config =>
          config.id === action.payload.id ? action.payload : config
        ),
      };
    
    case 'DELETE_CONFIGURATION':
      return {
        ...state,
        configurations: state.configurations.filter(config => config.id !== action.payload),
      };
    
    case 'SET_RESULTS':
      return { ...state, results: action.payload };
    
    case 'ADD_RESULT':
      return { ...state, results: [...state.results, action.payload] };
    
    case 'UPDATE_RESULT':
      return {
        ...state,
        results: state.results.map(result =>
          result.id === action.payload.id ? action.payload : result
        ),
        activeBacktest: state.activeBacktest?.id === action.payload.id ? action.payload : state.activeBacktest,
        selectedResult: state.selectedResult?.id === action.payload.id ? action.payload : state.selectedResult,
      };
    
    case 'DELETE_RESULT':
      return {
        ...state,
        results: state.results.filter(result => result.id !== action.payload),
        activeBacktest: state.activeBacktest?.id === action.payload ? null : state.activeBacktest,
        selectedResult: state.selectedResult?.id === action.payload ? null : state.selectedResult,
      };
    
    case 'SET_ACTIVE_BACKTEST':
      return { ...state, activeBacktest: action.payload };
    
    case 'SET_SELECTED_RESULT':
      return { ...state, selectedResult: action.payload };
    
    default:
      return state;
  }
}

// Context
interface BacktestContextType {
  state: BacktestState;
  // Strategy management
  createStrategy: (strategy: Omit<BacktestStrategy, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateStrategy: (strategy: BacktestStrategy) => void;
  deleteStrategy: (id: string) => void;
  // Configuration management
  createConfiguration: (config: Omit<BacktestConfiguration, 'id'>) => void;
  updateConfiguration: (config: BacktestConfiguration) => void;
  deleteConfiguration: (id: string) => void;
  // Backtest execution
  runBacktest: (configurationId: string) => Promise<void>;
  stopBacktest: (resultId: string) => Promise<void>;
  // Result management
  selectResult: (result: BacktestResult | null) => void;
  deleteResult: (id: string) => void;
  compareResults: (resultIds: string[]) => BacktestResult[];
}

const BacktestContext = createContext<BacktestContextType | undefined>(undefined);

// Provider component
interface BacktestProviderProps {
  children: ReactNode;
}

export function BacktestProvider({ children }: BacktestProviderProps) {
  const [state, dispatch] = useReducer(backtestReducer, initialState);

  const createStrategy = useCallback((strategyData: Omit<BacktestStrategy, 'id' | 'createdAt' | 'updatedAt'>) => {
    const strategy: BacktestStrategy = {
      ...strategyData,
      id: `strategy_${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    dispatch({ type: 'ADD_STRATEGY', payload: strategy });
  }, []);

  const updateStrategy = useCallback((strategy: BacktestStrategy) => {
    const updatedStrategy = { ...strategy, updatedAt: new Date() };
    dispatch({ type: 'UPDATE_STRATEGY', payload: updatedStrategy });
  }, []);

  const deleteStrategy = useCallback((id: string) => {
    dispatch({ type: 'DELETE_STRATEGY', payload: id });
  }, []);

  const createConfiguration = useCallback((configData: Omit<BacktestConfiguration, 'id'>) => {
    const configuration: BacktestConfiguration = {
      ...configData,
      id: `config_${Date.now()}`,
    };
    dispatch({ type: 'ADD_CONFIGURATION', payload: configuration });
  }, []);

  const updateConfiguration = useCallback((config: BacktestConfiguration) => {
    dispatch({ type: 'UPDATE_CONFIGURATION', payload: config });
  }, []);

  const deleteConfiguration = useCallback((id: string) => {
    dispatch({ type: 'DELETE_CONFIGURATION', payload: id });
  }, []);

  const runBacktest = useCallback(async (configurationId: string) => {
    const configuration = state.configurations.find(c => c.id === configurationId);
    if (!configuration) {
      dispatch({ type: 'SET_ERROR', payload: 'Configuration not found' });
      return;
    }

    const result: BacktestResult = {
      id: `result_${Date.now()}`,
      configurationId,
      status: 'running',
      progress: 0,
      startTime: new Date(),
      trades: [],
      metrics: {
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        winRate: 0,
        totalPnl: 0,
        totalPnlPercent: 0,
        maxDrawdown: 0,
        maxDrawdownPercent: 0,
        sharpeRatio: 0,
        profitFactor: 0,
        averageWin: 0,
        averageLoss: 0,
        largestWin: 0,
        largestLoss: 0,
      },
      equityCurve: [],
    };

    dispatch({ type: 'ADD_RESULT', payload: result });
    dispatch({ type: 'SET_ACTIVE_BACKTEST', payload: result });

    // TODO: Implement actual backtest execution
    // For now, simulate progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 200));
      const updatedResult = { ...result, progress: i };
      if (i === 100) {
        updatedResult.status = 'completed';
        updatedResult.endTime = new Date();
      }
      dispatch({ type: 'UPDATE_RESULT', payload: updatedResult });
    }
  }, [state.configurations]);

  const stopBacktest = useCallback(async (resultId: string) => {
    const result = state.results.find(r => r.id === resultId);
    if (result && result.status === 'running') {
      const stoppedResult = { ...result, status: 'failed' as const, endTime: new Date() };
      dispatch({ type: 'UPDATE_RESULT', payload: stoppedResult });
    }
  }, [state.results]);

  const selectResult = useCallback((result: BacktestResult | null) => {
    dispatch({ type: 'SET_SELECTED_RESULT', payload: result });
  }, []);

  const deleteResult = useCallback((id: string) => {
    dispatch({ type: 'DELETE_RESULT', payload: id });
  }, []);

  const compareResults = useCallback((resultIds: string[]) => {
    return state.results.filter(result => resultIds.includes(result.id));
  }, [state.results]);

  const contextValue: BacktestContextType = {
    state,
    createStrategy,
    updateStrategy,
    deleteStrategy,
    createConfiguration,
    updateConfiguration,
    deleteConfiguration,
    runBacktest,
    stopBacktest,
    selectResult,
    deleteResult,
    compareResults,
  };

  return (
    <BacktestContext.Provider value={contextValue}>
      {children}
    </BacktestContext.Provider>
  );
}

// Hook to use the context
export function useBacktest() {
  const context = useContext(BacktestContext);
  if (context === undefined) {
    throw new Error('useBacktest must be used within a BacktestProvider');
  }
  return context;
}
