// File: contexts/integrated/UserContext.tsx
'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';

// Types
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: 'vi' | 'en';
  defaultTimeframe: '1m' | '5m' | '15m' | '1h' | '4h' | '1d';
  defaultTradingPair: string;
  notifications: {
    orderFilled: boolean;
    priceAlerts: boolean;
    systemUpdates: boolean;
  };
  trading: {
    confirmOrders: boolean;
    defaultOrderType: 'market' | 'limit';
    riskManagement: {
      maxPositionSize: number;
      stopLossPercentage: number;
      takeProfitPercentage: number;
    };
  };
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  isAuthenticated: boolean;
  preferences: UserPreferences;
  createdAt: Date;
  lastLoginAt: Date;
}

export interface UserState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  preferences: UserPreferences;
}

// Default preferences
const defaultPreferences: UserPreferences = {
  theme: 'system',
  language: 'vi',
  defaultTimeframe: '1h',
  defaultTradingPair: 'BTCUSDT',
  notifications: {
    orderFilled: true,
    priceAlerts: true,
    systemUpdates: false,
  },
  trading: {
    confirmOrders: true,
    defaultOrderType: 'limit',
    riskManagement: {
      maxPositionSize: 1000,
      stopLossPercentage: 2,
      takeProfitPercentage: 5,
    },
  },
};

// Initial state
const initialState: UserState = {
  user: null,
  isLoading: false,
  error: null,
  preferences: defaultPreferences,
};

// Action types
type UserAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_USER'; payload: User }
  | { type: 'CLEAR_USER' }
  | { type: 'UPDATE_PREFERENCES'; payload: Partial<UserPreferences> }
  | { type: 'RESET_PREFERENCES' };

// Reducer
function userReducer(state: UserState, action: UserAction): UserState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };

    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        preferences: { ...state.preferences, ...action.payload.preferences },
        isLoading: false,
        error: null,
      };

    case 'CLEAR_USER':
      return {
        ...state,
        user: null,
        preferences: defaultPreferences,
        isLoading: false,
        error: null,
      };

    case 'UPDATE_PREFERENCES':
      const updatedPreferences = { ...state.preferences, ...action.payload };
      return {
        ...state,
        preferences: updatedPreferences,
        user: state.user ? { ...state.user, preferences: updatedPreferences } : null,
      };

    case 'RESET_PREFERENCES':
      return {
        ...state,
        preferences: defaultPreferences,
        user: state.user ? { ...state.user, preferences: defaultPreferences } : null,
      };

    default:
      return state;
  }
}

// Context
interface UserContextType {
  state: UserState;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updatePreferences: (preferences: Partial<UserPreferences>) => void;
  resetPreferences: () => void;
  isAuthenticated: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Provider component
interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  const [state, dispatch] = useReducer(userReducer, initialState);

  // Load preferences from localStorage on mount
  useEffect(() => {
    const savedPreferences = localStorage.getItem('userPreferences');
    if (savedPreferences) {
      try {
        const preferences = JSON.parse(savedPreferences);
        dispatch({ type: 'UPDATE_PREFERENCES', payload: preferences });
      } catch (error) {
        console.error('Failed to load user preferences:', error);
      }
    }
  }, []);

  // Save preferences to localStorage when they change
  useEffect(() => {
    localStorage.setItem('userPreferences', JSON.stringify(state.preferences));
  }, [state.preferences]);

  const login = async (email: string, password: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      // TODO: Implement actual authentication with Supabase
      // For now, create a mock user
      const mockUser: User = {
        id: '1',
        email,
        name: email.split('@')[0],
        isAuthenticated: true,
        preferences: state.preferences,
        createdAt: new Date(),
        lastLoginAt: new Date(),
      };

      dispatch({ type: 'SET_USER', payload: mockUser });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Login failed' });
    }
  };

  const logout = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      // TODO: Implement actual logout with Supabase
      dispatch({ type: 'CLEAR_USER' });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Logout failed' });
    }
  };

  const updatePreferences = (preferences: Partial<UserPreferences>) => {
    dispatch({ type: 'UPDATE_PREFERENCES', payload: preferences });
  };

  const resetPreferences = () => {
    dispatch({ type: 'RESET_PREFERENCES' });
  };

  const contextValue: UserContextType = {
    state,
    login,
    logout,
    updatePreferences,
    resetPreferences,
    isAuthenticated: state.user?.isAuthenticated || false,
  };

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
}

// Hook to use the context
export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}