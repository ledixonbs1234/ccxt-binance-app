// File: contexts/integrated/MarketContext.tsx
'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode, useCallback } from 'react';

// Types
export interface CoinData {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  volume24h: number;
  marketCap: number;
  high24h: number;
  low24h: number;
  lastUpdated: Date;
  rank?: number;
  icon?: string;
}

export interface MarketOverview {
  totalMarketCap: number;
  totalVolume24h: number;
  btcDominance: number;
  activeCoins: number;
  marketCapChange24h: number;
  lastUpdated: Date;
}

export interface MarketTrend {
  symbol: string;
  trend: 'up' | 'down' | 'neutral';
  strength: number; // 0-100
  timeframe: string;
}

export interface MarketState {
  coins: CoinData[];
  overview: MarketOverview | null;
  trends: MarketTrend[];
  selectedCoin: CoinData | null;
  isLoading: boolean;
  error: string | null;
  lastUpdate: Date | null;
  searchQuery: string;
  sortBy: 'rank' | 'price' | 'change24h' | 'volume24h' | 'marketCap';
  sortOrder: 'asc' | 'desc';
  filters: {
    priceRange: [number, number] | null;
    volumeRange: [number, number] | null;
    changeRange: [number, number] | null;
  };
}

// Initial state
const initialState: MarketState = {
  coins: [],
  overview: null,
  trends: [],
  selectedCoin: null,
  isLoading: false,
  error: null,
  lastUpdate: null,
  searchQuery: '',
  sortBy: 'rank',
  sortOrder: 'asc',
  filters: {
    priceRange: null,
    volumeRange: null,
    changeRange: null,
  },
};

// Action types
type MarketAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_COINS'; payload: CoinData[] }
  | { type: 'SET_OVERVIEW'; payload: MarketOverview }
  | { type: 'SET_TRENDS'; payload: MarketTrend[] }
  | { type: 'SET_SELECTED_COIN'; payload: CoinData | null }
  | { type: 'UPDATE_COIN_PRICE'; payload: { symbol: string; price: number; change24h: number; changePercent24h: number } }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_SORT'; payload: { sortBy: MarketState['sortBy']; sortOrder: MarketState['sortOrder'] } }
  | { type: 'SET_FILTERS'; payload: Partial<MarketState['filters']> }
  | { type: 'CLEAR_FILTERS' };

// Reducer
function marketReducer(state: MarketState, action: MarketAction): MarketState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };

    case 'SET_COINS':
      return {
        ...state,
        coins: action.payload,
        lastUpdate: new Date(),
        isLoading: false,
        error: null,
      };

    case 'SET_OVERVIEW':
      return {
        ...state,
        overview: action.payload,
        lastUpdate: new Date(),
      };

    case 'SET_TRENDS':
      return {
        ...state,
        trends: action.payload,
        lastUpdate: new Date(),
      };

    case 'SET_SELECTED_COIN':
      return { ...state, selectedCoin: action.payload };

    case 'UPDATE_COIN_PRICE':
      return {
        ...state,
        coins: state.coins.map(coin =>
          coin.symbol === action.payload.symbol
            ? {
                ...coin,
                price: action.payload.price,
                change24h: action.payload.change24h,
                changePercent24h: action.payload.changePercent24h,
                lastUpdated: new Date(),
              }
            : coin
        ),
        selectedCoin: state.selectedCoin?.symbol === action.payload.symbol
          ? {
              ...state.selectedCoin,
              price: action.payload.price,
              change24h: action.payload.change24h,
              changePercent24h: action.payload.changePercent24h,
              lastUpdated: new Date(),
            }
          : state.selectedCoin,
        lastUpdate: new Date(),
      };

    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.payload };

    case 'SET_SORT':
      return {
        ...state,
        sortBy: action.payload.sortBy,
        sortOrder: action.payload.sortOrder,
      };

    case 'SET_FILTERS':
      return {
        ...state,
        filters: { ...state.filters, ...action.payload },
      };

    case 'CLEAR_FILTERS':
      return {
        ...state,
        filters: {
          priceRange: null,
          volumeRange: null,
          changeRange: null,
        },
        searchQuery: '',
      };

    default:
      return state;
  }
}

// Context
interface MarketContextType {
  state: MarketState;
  fetchCoins: () => Promise<void>;
  fetchMarketOverview: () => Promise<void>;
  fetchMarketTrends: () => Promise<void>;
  selectCoin: (coin: CoinData | null) => void;
  updateCoinPrice: (symbol: string, price: number, change24h: number, changePercent24h: number) => void;
  setSearchQuery: (query: string) => void;
  setSorting: (sortBy: MarketState['sortBy'], sortOrder: MarketState['sortOrder']) => void;
  setFilters: (filters: Partial<MarketState['filters']>) => void;
  clearFilters: () => void;
  getFilteredCoins: () => CoinData[];
}

const MarketContext = createContext<MarketContextType | undefined>(undefined);

// Provider component
interface MarketProviderProps {
  children: ReactNode;
}

export function MarketProvider({ children }: MarketProviderProps) {
  const [state, dispatch] = useReducer(marketReducer, initialState);

  // Mock data for development
  const mockCoins: CoinData[] = [
    {
      symbol: 'BTCUSDT',
      name: 'Bitcoin',
      price: 45000,
      change24h: 1200,
      changePercent24h: 2.74,
      volume24h: 28500000000,
      marketCap: 850000000000,
      high24h: 46000,
      low24h: 43500,
      lastUpdated: new Date(),
      rank: 1,
    },
    {
      symbol: 'ETHUSDT',
      name: 'Ethereum',
      price: 3200,
      change24h: -85,
      changePercent24h: -2.59,
      volume24h: 15200000000,
      marketCap: 385000000000,
      high24h: 3350,
      low24h: 3150,
      lastUpdated: new Date(),
      rank: 2,
    },
    {
      symbol: 'PEPEUSDT',
      name: 'Pepe',
      price: 0.00001234,
      change24h: 0.00000156,
      changePercent24h: 14.45,
      volume24h: 850000000,
      marketCap: 5200000000,
      high24h: 0.00001289,
      low24h: 0.00001089,
      lastUpdated: new Date(),
      rank: 3,
    },
  ];

  const fetchCoins = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
      dispatch({ type: 'SET_COINS', payload: mockCoins });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to fetch coins' });
    }
  }, []);

  const fetchMarketOverview = useCallback(async () => {
    try {
      // TODO: Replace with actual API call
      const mockOverview: MarketOverview = {
        totalMarketCap: 1750000000000,
        totalVolume24h: 85000000000,
        btcDominance: 48.5,
        activeCoins: 2500,
        marketCapChange24h: 2.3,
        lastUpdated: new Date(),
      };

      dispatch({ type: 'SET_OVERVIEW', payload: mockOverview });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to fetch market overview' });
    }
  }, []);

  const fetchMarketTrends = useCallback(async () => {
    try {
      // TODO: Replace with actual API call
      const mockTrends: MarketTrend[] = [
        { symbol: 'BTCUSDT', trend: 'up', strength: 75, timeframe: '1h' },
        { symbol: 'ETHUSDT', trend: 'down', strength: 60, timeframe: '1h' },
        { symbol: 'PEPEUSDT', trend: 'up', strength: 85, timeframe: '1h' },
      ];

      dispatch({ type: 'SET_TRENDS', payload: mockTrends });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to fetch market trends' });
    }
  }, []);

  const selectCoin = useCallback((coin: CoinData | null) => {
    dispatch({ type: 'SET_SELECTED_COIN', payload: coin });
  }, []);

  const updateCoinPrice = useCallback((symbol: string, price: number, change24h: number, changePercent24h: number) => {
    dispatch({ type: 'UPDATE_COIN_PRICE', payload: { symbol, price, change24h, changePercent24h } });
  }, []);

  const setSearchQuery = useCallback((query: string) => {
    dispatch({ type: 'SET_SEARCH_QUERY', payload: query });
  }, []);

  const setSorting = useCallback((sortBy: MarketState['sortBy'], sortOrder: MarketState['sortOrder']) => {
    dispatch({ type: 'SET_SORT', payload: { sortBy, sortOrder } });
  }, []);

  const setFilters = useCallback((filters: Partial<MarketState['filters']>) => {
    dispatch({ type: 'SET_FILTERS', payload: filters });
  }, []);

  const clearFilters = useCallback(() => {
    dispatch({ type: 'CLEAR_FILTERS' });
  }, []);

  const getFilteredCoins = useCallback(() => {
    let filtered = [...state.coins];

    // Apply search filter
    if (state.searchQuery) {
      const query = state.searchQuery.toLowerCase();
      filtered = filtered.filter(coin =>
        coin.name.toLowerCase().includes(query) ||
        coin.symbol.toLowerCase().includes(query)
      );
    }

    // Apply price range filter
    if (state.filters.priceRange) {
      const [min, max] = state.filters.priceRange;
      filtered = filtered.filter(coin => coin.price >= min && coin.price <= max);
    }

    // Apply volume range filter
    if (state.filters.volumeRange) {
      const [min, max] = state.filters.volumeRange;
      filtered = filtered.filter(coin => coin.volume24h >= min && coin.volume24h <= max);
    }

    // Apply change range filter
    if (state.filters.changeRange) {
      const [min, max] = state.filters.changeRange;
      filtered = filtered.filter(coin => coin.changePercent24h >= min && coin.changePercent24h <= max);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: number;
      let bValue: number;

      switch (state.sortBy) {
        case 'rank':
          aValue = a.rank || 999999;
          bValue = b.rank || 999999;
          break;
        case 'price':
          aValue = a.price;
          bValue = b.price;
          break;
        case 'change24h':
          aValue = a.changePercent24h;
          bValue = b.changePercent24h;
          break;
        case 'volume24h':
          aValue = a.volume24h;
          bValue = b.volume24h;
          break;
        case 'marketCap':
          aValue = a.marketCap;
          bValue = b.marketCap;
          break;
        default:
          return 0;
      }

      if (state.sortOrder === 'asc') {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    });

    return filtered;
  }, [state.coins, state.searchQuery, state.filters, state.sortBy, state.sortOrder]);

  // Auto-fetch data on mount
  useEffect(() => {
    fetchCoins();
    fetchMarketOverview();
    fetchMarketTrends();
  }, [fetchCoins, fetchMarketOverview, fetchMarketTrends]);

  const contextValue: MarketContextType = {
    state,
    fetchCoins,
    fetchMarketOverview,
    fetchMarketTrends,
    selectCoin,
    updateCoinPrice,
    setSearchQuery,
    setSorting,
    setFilters,
    clearFilters,
    getFilteredCoins,
  };

  return (
    <MarketContext.Provider value={contextValue}>
      {children}
    </MarketContext.Provider>
  );
}

// Hook to use the context
export function useMarket() {
  const context = useContext(MarketContext);
  if (context === undefined) {
    throw new Error('useMarket must be used within a MarketProvider');
  }
  return context;
}