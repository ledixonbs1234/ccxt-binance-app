// File: contexts/integrated/NotificationContext.tsx
'use client';

import React, { createContext, useContext, useReducer, useCallback, useEffect, ReactNode } from 'react';
import { notification } from 'antd';

// Types
export interface NotificationItem {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  persistent: boolean;
  category: 'trading' | 'system' | 'market' | 'account';
  priority: 'low' | 'medium' | 'high' | 'critical';
  data?: any;
  actions?: Array<{
    label: string;
    action: () => void;
    type?: 'primary' | 'default' | 'danger';
  }>;
}

export interface PriceAlert {
  id: string;
  symbol: string;
  condition: 'above' | 'below' | 'change_percent';
  targetValue: number;
  currentValue: number;
  enabled: boolean;
  triggered: boolean;
  createdAt: Date;
  triggeredAt?: Date;
}

export interface NotificationSettings {
  enabled: boolean;
  sound: boolean;
  desktop: boolean;
  categories: {
    trading: boolean;
    system: boolean;
    market: boolean;
    account: boolean;
  };
  priorities: {
    low: boolean;
    medium: boolean;
    high: boolean;
    critical: boolean;
  };
}

export interface NotificationState {
  notifications: NotificationItem[];
  unreadCount: number;
  priceAlerts: PriceAlert[];
  settings: NotificationSettings;
  isLoading: boolean;
  error: string | null;
}

// Initial state
const defaultSettings: NotificationSettings = {
  enabled: true,
  sound: true,
  desktop: true,
  categories: {
    trading: true,
    system: true,
    market: true,
    account: true,
  },
  priorities: {
    low: true,
    medium: true,
    high: true,
    critical: true,
  },
};

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  priceAlerts: [],
  settings: defaultSettings,
  isLoading: false,
  error: null,
};

// Action types
type NotificationAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'ADD_NOTIFICATION'; payload: NotificationItem }
  | { type: 'MARK_READ'; payload: string }
  | { type: 'MARK_ALL_READ' }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'CLEAR_ALL_NOTIFICATIONS' }
  | { type: 'ADD_PRICE_ALERT'; payload: PriceAlert }
  | { type: 'UPDATE_PRICE_ALERT'; payload: PriceAlert }
  | { type: 'REMOVE_PRICE_ALERT'; payload: string }
  | { type: 'TRIGGER_PRICE_ALERT'; payload: { id: string; currentValue: number } }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<NotificationSettings> };

// Reducer
function notificationReducer(state: NotificationState, action: NotificationAction): NotificationState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    
    case 'ADD_NOTIFICATION':
      const newNotifications = [action.payload, ...state.notifications];
      return {
        ...state,
        notifications: newNotifications,
        unreadCount: state.unreadCount + 1,
      };
    
    case 'MARK_READ':
      const updatedNotifications = state.notifications.map(notification =>
        notification.id === action.payload ? { ...notification, read: true } : notification
      );
      const wasUnread = state.notifications.find(n => n.id === action.payload && !n.read);
      return {
        ...state,
        notifications: updatedNotifications,
        unreadCount: wasUnread ? state.unreadCount - 1 : state.unreadCount,
      };
    
    case 'MARK_ALL_READ':
      return {
        ...state,
        notifications: state.notifications.map(notification => ({ ...notification, read: true })),
        unreadCount: 0,
      };
    
    case 'REMOVE_NOTIFICATION':
      const filteredNotifications = state.notifications.filter(n => n.id !== action.payload);
      const removedNotification = state.notifications.find(n => n.id === action.payload);
      return {
        ...state,
        notifications: filteredNotifications,
        unreadCount: removedNotification && !removedNotification.read ? state.unreadCount - 1 : state.unreadCount,
      };
    
    case 'CLEAR_ALL_NOTIFICATIONS':
      return {
        ...state,
        notifications: [],
        unreadCount: 0,
      };
    
    case 'ADD_PRICE_ALERT':
      return {
        ...state,
        priceAlerts: [...state.priceAlerts, action.payload],
      };
    
    case 'UPDATE_PRICE_ALERT':
      return {
        ...state,
        priceAlerts: state.priceAlerts.map(alert =>
          alert.id === action.payload.id ? action.payload : alert
        ),
      };
    
    case 'REMOVE_PRICE_ALERT':
      return {
        ...state,
        priceAlerts: state.priceAlerts.filter(alert => alert.id !== action.payload),
      };
    
    case 'TRIGGER_PRICE_ALERT':
      const triggeredAlerts = state.priceAlerts.map(alert =>
        alert.id === action.payload.id
          ? { ...alert, triggered: true, triggeredAt: new Date(), currentValue: action.payload.currentValue }
          : alert
      );
      return {
        ...state,
        priceAlerts: triggeredAlerts,
      };
    
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
interface NotificationContextType {
  state: NotificationState;
  
  // Notification management
  addNotification: (notification: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
  
  // Price alerts
  addPriceAlert: (alert: Omit<PriceAlert, 'id' | 'triggered' | 'createdAt'>) => void;
  updatePriceAlert: (id: string, updates: Partial<PriceAlert>) => void;
  removePriceAlert: (id: string) => void;
  checkPriceAlerts: (symbol: string, currentPrice: number) => void;
  
  // Settings
  updateSettings: (settings: Partial<NotificationSettings>) => void;
  
  // Utilities
  showToast: (type: NotificationItem['type'], title: string, message: string) => void;
  playNotificationSound: () => void;
  requestDesktopPermission: () => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Provider component
interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [state, dispatch] = useReducer(notificationReducer, initialState);

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('notificationSettings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        dispatch({ type: 'UPDATE_SETTINGS', payload: settings });
      } catch (error) {
        console.error('Failed to load notification settings:', error);
      }
    }
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('notificationSettings', JSON.stringify(state.settings));
  }, [state.settings]);

  const addNotification = useCallback((notificationData: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) => {
    const notification: NotificationItem = {
      ...notificationData,
      id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      read: false,
    };

    // Check if notification should be shown based on settings
    if (!state.settings.enabled) return;
    if (!state.settings.categories[notification.category]) return;
    if (!state.settings.priorities[notification.priority]) return;

    dispatch({ type: 'ADD_NOTIFICATION', payload: notification });

    // Show toast notification
    showToast(notification.type, notification.title, notification.message);

    // Play sound if enabled
    if (state.settings.sound) {
      playNotificationSound();
    }

    // Show desktop notification if enabled and permission granted
    if (state.settings.desktop && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.id,
      });
    }
  }, [state.settings]);

  const markAsRead = useCallback((id: string) => {
    dispatch({ type: 'MARK_READ', payload: id });
  }, []);

  const markAllAsRead = useCallback(() => {
    dispatch({ type: 'MARK_ALL_READ' });
  }, []);

  const removeNotification = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_NOTIFICATION', payload: id });
  }, []);

  const clearAllNotifications = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL_NOTIFICATIONS' });
  }, []);

  const addPriceAlert = useCallback((alertData: Omit<PriceAlert, 'id' | 'triggered' | 'createdAt'>) => {
    const alert: PriceAlert = {
      ...alertData,
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      triggered: false,
      createdAt: new Date(),
    };
    dispatch({ type: 'ADD_PRICE_ALERT', payload: alert });
  }, []);

  const updatePriceAlert = useCallback((id: string, updates: Partial<PriceAlert>) => {
    const alert = state.priceAlerts.find(a => a.id === id);
    if (alert) {
      dispatch({ type: 'UPDATE_PRICE_ALERT', payload: { ...alert, ...updates } });
    }
  }, [state.priceAlerts]);

  const removePriceAlert = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_PRICE_ALERT', payload: id });
  }, []);

  const checkPriceAlerts = useCallback((symbol: string, currentPrice: number) => {
    state.priceAlerts
      .filter(alert => alert.symbol === symbol && alert.enabled && !alert.triggered)
      .forEach(alert => {
        let shouldTrigger = false;

        switch (alert.condition) {
          case 'above':
            shouldTrigger = currentPrice >= alert.targetValue;
            break;
          case 'below':
            shouldTrigger = currentPrice <= alert.targetValue;
            break;
          case 'change_percent':
            const changePercent = ((currentPrice - alert.currentValue) / alert.currentValue) * 100;
            shouldTrigger = Math.abs(changePercent) >= alert.targetValue;
            break;
        }

        if (shouldTrigger) {
          dispatch({ type: 'TRIGGER_PRICE_ALERT', payload: { id: alert.id, currentValue: currentPrice } });
          
          addNotification({
            type: 'warning',
            title: 'Price Alert Triggered',
            message: `${symbol} has reached your alert condition: ${alert.condition} ${alert.targetValue}`,
            category: 'market',
            priority: 'high',
            persistent: true,
            data: { alert, currentPrice },
          });
        }
      });
  }, [state.priceAlerts, addNotification]);

  const updateSettings = useCallback((settings: Partial<NotificationSettings>) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: settings });
  }, []);

  const showToast = useCallback((type: NotificationItem['type'], title: string, message: string) => {
    notification[type]({
      message: title,
      description: message,
      placement: 'topRight',
      duration: type === 'error' ? 0 : 4.5,
    });
  }, []);

  const playNotificationSound = useCallback(() => {
    try {
      const audio = new Audio('/notification-sound.mp3');
      audio.volume = 0.3;
      audio.play().catch(() => {
        // Ignore audio play errors (user interaction required)
      });
    } catch (error) {
      // Ignore audio errors
    }
  }, []);

  const requestDesktopPermission = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }, []);

  const contextValue: NotificationContextType = {
    state,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
    addPriceAlert,
    updatePriceAlert,
    removePriceAlert,
    checkPriceAlerts,
    updateSettings,
    showToast,
    playNotificationSound,
    requestDesktopPermission,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
}

// Hook to use the context
export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}
