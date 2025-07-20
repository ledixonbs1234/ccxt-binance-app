// File: contexts/integrated/WebSocketContext.tsx
'use client';

import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef, ReactNode } from 'react';

// Types
export interface WebSocketConnection {
  id: string;
  url: string;
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  lastConnected?: Date;
  lastDisconnected?: Date;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
  reconnectDelay: number;
  subscriptions: string[];
}

export interface WebSocketMessage {
  id: string;
  connectionId: string;
  type: string;
  data: any;
  timestamp: Date;
}

export interface WebSocketSubscription {
  id: string;
  connectionId: string;
  channel: string;
  symbol?: string;
  callback: (data: any) => void;
  active: boolean;
}

export interface WebSocketState {
  connections: Record<string, WebSocketConnection>;
  messages: WebSocketMessage[];
  subscriptions: Record<string, WebSocketSubscription>;
  isLoading: boolean;
  error: string | null;
  globalStatus: 'connected' | 'disconnected' | 'partial' | 'error';
}

// Initial state
const initialState: WebSocketState = {
  connections: {},
  messages: [],
  subscriptions: {},
  isLoading: false,
  error: null,
  globalStatus: 'disconnected',
};

// Action types
type WebSocketAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'ADD_CONNECTION'; payload: WebSocketConnection }
  | { type: 'UPDATE_CONNECTION'; payload: { id: string; updates: Partial<WebSocketConnection> } }
  | { type: 'REMOVE_CONNECTION'; payload: string }
  | { type: 'ADD_MESSAGE'; payload: WebSocketMessage }
  | { type: 'CLEAR_MESSAGES'; payload?: string }
  | { type: 'ADD_SUBSCRIPTION'; payload: WebSocketSubscription }
  | { type: 'UPDATE_SUBSCRIPTION'; payload: { id: string; updates: Partial<WebSocketSubscription> } }
  | { type: 'REMOVE_SUBSCRIPTION'; payload: string }
  | { type: 'UPDATE_GLOBAL_STATUS' };

// Reducer
function webSocketReducer(state: WebSocketState, action: WebSocketAction): WebSocketState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    
    case 'ADD_CONNECTION':
      return {
        ...state,
        connections: { ...state.connections, [action.payload.id]: action.payload },
      };
    
    case 'UPDATE_CONNECTION':
      const connection = state.connections[action.payload.id];
      if (!connection) return state;
      
      return {
        ...state,
        connections: {
          ...state.connections,
          [action.payload.id]: { ...connection, ...action.payload.updates },
        },
      };
    
    case 'REMOVE_CONNECTION':
      const { [action.payload]: removed, ...remainingConnections } = state.connections;
      return {
        ...state,
        connections: remainingConnections,
      };
    
    case 'ADD_MESSAGE':
      const newMessages = [action.payload, ...state.messages.slice(0, 999)]; // Keep last 1000 messages
      return {
        ...state,
        messages: newMessages,
      };
    
    case 'CLEAR_MESSAGES':
      return {
        ...state,
        messages: action.payload 
          ? state.messages.filter(msg => msg.connectionId !== action.payload)
          : [],
      };
    
    case 'ADD_SUBSCRIPTION':
      return {
        ...state,
        subscriptions: { ...state.subscriptions, [action.payload.id]: action.payload },
      };
    
    case 'UPDATE_SUBSCRIPTION':
      const subscription = state.subscriptions[action.payload.id];
      if (!subscription) return state;
      
      return {
        ...state,
        subscriptions: {
          ...state.subscriptions,
          [action.payload.id]: { ...subscription, ...action.payload.updates },
        },
      };
    
    case 'REMOVE_SUBSCRIPTION':
      const { [action.payload]: removedSub, ...remainingSubs } = state.subscriptions;
      return {
        ...state,
        subscriptions: remainingSubs,
      };
    
    case 'UPDATE_GLOBAL_STATUS':
      const connections = Object.values(state.connections);
      let globalStatus: WebSocketState['globalStatus'] = 'disconnected';
      
      if (connections.length === 0) {
        globalStatus = 'disconnected';
      } else if (connections.every(conn => conn.status === 'connected')) {
        globalStatus = 'connected';
      } else if (connections.some(conn => conn.status === 'connected')) {
        globalStatus = 'partial';
      } else if (connections.some(conn => conn.status === 'error')) {
        globalStatus = 'error';
      }
      
      return { ...state, globalStatus };
    
    default:
      return state;
  }
}

// Context
interface WebSocketContextType {
  state: WebSocketState;
  
  // Connection management
  connect: (id: string, url: string, options?: { maxReconnectAttempts?: number; reconnectDelay?: number }) => void;
  disconnect: (id: string) => void;
  reconnect: (id: string) => void;
  
  // Subscription management
  subscribe: (connectionId: string, channel: string, callback: (data: any) => void, symbol?: string) => string;
  unsubscribe: (subscriptionId: string) => void;
  
  // Message handling
  sendMessage: (connectionId: string, message: any) => void;
  clearMessages: (connectionId?: string) => void;
  
  // Utilities
  getConnection: (id: string) => WebSocketConnection | undefined;
  getActiveSubscriptions: (connectionId: string) => WebSocketSubscription[];
  isConnected: (connectionId: string) => boolean;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

// Provider component
interface WebSocketProviderProps {
  children: ReactNode;
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const [state, dispatch] = useReducer(webSocketReducer, initialState);
  const connectionsRef = useRef<Record<string, WebSocket>>({});
  const reconnectTimeoutsRef = useRef<Record<string, NodeJS.Timeout>>({});

  const connect = useCallback((id: string, url: string, options?: { maxReconnectAttempts?: number; reconnectDelay?: number }) => {
    // Close existing connection if any
    if (connectionsRef.current[id]) {
      connectionsRef.current[id].close();
      delete connectionsRef.current[id];
    }

    const connection: WebSocketConnection = {
      id,
      url,
      status: 'connecting',
      reconnectAttempts: 0,
      maxReconnectAttempts: options?.maxReconnectAttempts || 5,
      reconnectDelay: options?.reconnectDelay || 1000,
      subscriptions: [],
    };

    dispatch({ type: 'ADD_CONNECTION', payload: connection });

    try {
      const ws = new WebSocket(url);
      connectionsRef.current[id] = ws;

      ws.onopen = () => {
        dispatch({
          type: 'UPDATE_CONNECTION',
          payload: {
            id,
            updates: {
              status: 'connected',
              lastConnected: new Date(),
              reconnectAttempts: 0,
            },
          },
        });
        dispatch({ type: 'UPDATE_GLOBAL_STATUS' });

        // Resubscribe to active subscriptions
        const activeSubscriptions = Object.values(state.subscriptions).filter(
          sub => sub.connectionId === id && sub.active
        );
        activeSubscriptions.forEach(sub => {
          ws.send(JSON.stringify({
            method: 'SUBSCRIBE',
            params: [sub.channel],
            id: sub.id,
          }));
        });
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          const message: WebSocketMessage = {
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            connectionId: id,
            type: data.e || data.method || 'unknown',
            data,
            timestamp: new Date(),
          };

          dispatch({ type: 'ADD_MESSAGE', payload: message });

          // Handle subscription callbacks
          Object.values(state.subscriptions).forEach(subscription => {
            if (subscription.connectionId === id && subscription.active) {
              // Check if message matches subscription
              if (data.stream && data.stream.includes(subscription.channel)) {
                subscription.callback(data.data || data);
              }
            }
          });
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        dispatch({
          type: 'UPDATE_CONNECTION',
          payload: {
            id,
            updates: {
              status: 'disconnected',
              lastDisconnected: new Date(),
            },
          },
        });
        dispatch({ type: 'UPDATE_GLOBAL_STATUS' });

        // Attempt reconnection if not manually closed
        if (event.code !== 1000 && connection.reconnectAttempts < connection.maxReconnectAttempts) {
          const delay = connection.reconnectDelay * Math.pow(2, connection.reconnectAttempts);
          
          reconnectTimeoutsRef.current[id] = setTimeout(() => {
            dispatch({
              type: 'UPDATE_CONNECTION',
              payload: {
                id,
                updates: { reconnectAttempts: connection.reconnectAttempts + 1 },
              },
            });
            connect(id, url, options);
          }, delay);
        }

        delete connectionsRef.current[id];
      };

      ws.onerror = (error) => {
        dispatch({
          type: 'UPDATE_CONNECTION',
          payload: {
            id,
            updates: { status: 'error' },
          },
        });
        dispatch({ type: 'UPDATE_GLOBAL_STATUS' });
        dispatch({ type: 'SET_ERROR', payload: `WebSocket connection error for ${id}` });
      };

    } catch (error) {
      dispatch({
        type: 'UPDATE_CONNECTION',
        payload: {
          id,
          updates: { status: 'error' },
        },
      });
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to connect' });
    }
  }, [state.subscriptions]);

  const disconnect = useCallback((id: string) => {
    if (connectionsRef.current[id]) {
      connectionsRef.current[id].close(1000, 'Manual disconnect');
      delete connectionsRef.current[id];
    }

    if (reconnectTimeoutsRef.current[id]) {
      clearTimeout(reconnectTimeoutsRef.current[id]);
      delete reconnectTimeoutsRef.current[id];
    }

    dispatch({ type: 'REMOVE_CONNECTION', payload: id });
    dispatch({ type: 'UPDATE_GLOBAL_STATUS' });
  }, []);

  const reconnect = useCallback((id: string) => {
    const connection = state.connections[id];
    if (connection) {
      disconnect(id);
      setTimeout(() => {
        connect(id, connection.url, {
          maxReconnectAttempts: connection.maxReconnectAttempts,
          reconnectDelay: connection.reconnectDelay,
        });
      }, 100);
    }
  }, [state.connections, disconnect, connect]);

  const subscribe = useCallback((connectionId: string, channel: string, callback: (data: any) => void, symbol?: string) => {
    const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const subscription: WebSocketSubscription = {
      id: subscriptionId,
      connectionId,
      channel,
      symbol,
      callback,
      active: true,
    };

    dispatch({ type: 'ADD_SUBSCRIPTION', payload: subscription });

    // Send subscription message if connection is active
    const ws = connectionsRef.current[connectionId];
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        method: 'SUBSCRIBE',
        params: [channel],
        id: subscriptionId,
      }));
    }

    return subscriptionId;
  }, []);

  const unsubscribe = useCallback((subscriptionId: string) => {
    const subscription = state.subscriptions[subscriptionId];
    if (subscription) {
      const ws = connectionsRef.current[subscription.connectionId];
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          method: 'UNSUBSCRIBE',
          params: [subscription.channel],
          id: subscriptionId,
        }));
      }
    }

    dispatch({ type: 'REMOVE_SUBSCRIPTION', payload: subscriptionId });
  }, [state.subscriptions]);

  const sendMessage = useCallback((connectionId: string, message: any) => {
    const ws = connectionsRef.current[connectionId];
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    } else {
      dispatch({ type: 'SET_ERROR', payload: `Connection ${connectionId} is not available` });
    }
  }, []);

  const clearMessages = useCallback((connectionId?: string) => {
    dispatch({ type: 'CLEAR_MESSAGES', payload: connectionId });
  }, []);

  const getConnection = useCallback((id: string) => {
    return state.connections[id];
  }, [state.connections]);

  const getActiveSubscriptions = useCallback((connectionId: string) => {
    return Object.values(state.subscriptions).filter(
      sub => sub.connectionId === connectionId && sub.active
    );
  }, [state.subscriptions]);

  const isConnected = useCallback((connectionId: string) => {
    const connection = state.connections[connectionId];
    return connection?.status === 'connected';
  }, [state.connections]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      Object.values(connectionsRef.current).forEach(ws => ws.close());
      Object.values(reconnectTimeoutsRef.current).forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  const contextValue: WebSocketContextType = {
    state,
    connect,
    disconnect,
    reconnect,
    subscribe,
    unsubscribe,
    sendMessage,
    clearMessages,
    getConnection,
    getActiveSubscriptions,
    isConnected,
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
}

// Hook to use the context
export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}
