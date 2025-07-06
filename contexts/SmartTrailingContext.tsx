// File: contexts/SmartTrailingContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import SmartTrailingStopService, { 
  SmartTrailingSettings, 
  CoinAnalysis, 
  SmartTrailingPosition 
} from '../lib/smartTrailingService';
import { generateUniqueId } from '../lib/utils';


export interface SmartTrailingNotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  data?: any;
}

interface SmartTrailingContextType {
  isRunning: boolean;
  settings: SmartTrailingSettings;
  coinAnalyses: CoinAnalysis[];
  activePositions: SmartTrailingPosition[];
  notifications: SmartTrailingNotification[];
  startService: (settings?: Partial<SmartTrailingSettings>) => Promise<void>;
  stopService: () => void;
  updateSettings: (settings: Partial<SmartTrailingSettings>) => void;
  clearNotifications: () => void;
}

const SmartTrailingContext = createContext<SmartTrailingContextType | undefined>(undefined);

export function SmartTrailingProvider({ children }: { children: ReactNode }) {
  const [serviceInstance] = useState(() => SmartTrailingStopService.getInstance());
  const [isRunning, setIsRunning] = useState(serviceInstance.getSettings().enabled);
  const [settings, setSettings] = useState<SmartTrailingSettings>(serviceInstance.getSettings());
  const [coinAnalyses, setCoinAnalyses] = useState<CoinAnalysis[]>([]);
  const [activePositions, setActivePositions] = useState<SmartTrailingPosition[]>([]);
  const [notifications, setNotifications] = useState<SmartTrailingNotification[]>([]);

  const addNotification = (notification: Omit<SmartTrailingNotification, 'id' | 'timestamp'>) => {
    const newNotification: SmartTrailingNotification = {
      id: generateUniqueId().toString(),
      timestamp: new Date(),
      ...notification
    };
    setNotifications(prev => [newNotification, ...prev].slice(0, 50)); // Keep last 50
  };
  
  useEffect(() => {
    const onServiceStarted = (data: any) => {
      setIsRunning(true);
      addNotification({ type: 'success', title: 'Smart Trailing Started', message: 'Service is now active', data });
    };

    const onServiceStopped = () => {
      setIsRunning(false);
      addNotification({ type: 'info', title: 'Smart Trailing Stopped', message: 'Service has been stopped' });
    };

    const onAnalysisCompleted = (analyses: CoinAnalysis[]) => setCoinAnalyses(analyses);
    
    const onPositionCreated = (position: SmartTrailingPosition) => {
      setActivePositions(prev => [...prev, position]);
      addNotification({ type: 'success', title: 'Position Created', message: `Trailing stop opened for ${position.symbol}`, data: position });
    };
    
    const onPositionClosed = (data: { position: SmartTrailingPosition; reason: string; price: number }) => {
      setActivePositions(prev => prev.filter(p => p.id !== data.position.id));
      const profit = (data.price - data.position.entryPrice) * data.position.quantity;
      addNotification({ type: profit >= 0 ? 'success' : 'warning', title: `Position Closed: ${data.position.symbol}`, message: `Closed due to ${data.reason}. P/L: ${profit.toFixed(2)} USDT`, data });
    };

    const onSettingsUpdated = (newSettings: SmartTrailingSettings) => setSettings(newSettings);
    
    const onAnalysisError = (error: any) => {
      addNotification({ type: 'error', title: 'Analysis Error', message: error.message || 'An unknown error occurred', data: error });
    }

    serviceInstance.on('serviceStarted', onServiceStarted);
    serviceInstance.on('serviceStopped', onServiceStopped);
    serviceInstance.on('analysisCompleted', onAnalysisCompleted);
    serviceInstance.on('positionCreated', onPositionCreated);
    serviceInstance.on('positionClosed', onPositionClosed);
    serviceInstance.on('settingsUpdated', onSettingsUpdated);
    serviceInstance.on('analysisError', onAnalysisError);

    return () => {
      serviceInstance.off('serviceStarted', onServiceStarted);
      serviceInstance.off('serviceStopped', onServiceStopped);
      serviceInstance.off('analysisCompleted', onAnalysisCompleted);
      serviceInstance.off('positionCreated', onPositionCreated);
      serviceInstance.off('positionClosed', onPositionClosed);
      serviceInstance.off('settingsUpdated', onSettingsUpdated);
      serviceInstance.off('analysisError', onAnalysisError);
    };
  }, [serviceInstance]);

  const startService = async (newSettings?: Partial<SmartTrailingSettings>) => {
    await serviceInstance.startSmartTrailing(newSettings);
  };

  const stopService = () => {
    serviceInstance.stopSmartTrailing();
  };
  
  const updateSettings = (newSettings: Partial<SmartTrailingSettings>) => {
    serviceInstance.updateSettings(newSettings);
  };
  
  const clearNotifications = () => setNotifications([]);

  const value = {
    isRunning,
    settings,
    coinAnalyses,
    activePositions,
    notifications,
    startService,
    stopService,
    updateSettings,
    clearNotifications
  };

  return (
    <SmartTrailingContext.Provider value={value}>
      {children}
    </SmartTrailingContext.Provider>
  );
}

export const useSmartTrailing = (): SmartTrailingContextType => {
  const context = useContext(SmartTrailingContext);
  if (context === undefined) {
    throw new Error('useSmartTrailing must be used within a SmartTrailingProvider');
  }
  return context;
};