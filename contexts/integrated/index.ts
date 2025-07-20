// File: contexts/integrated/index.ts

// Export all integrated contexts
export { UserProvider, useUser } from './UserContext';
export type { User, UserPreferences, UserState } from './UserContext';

export { MarketProvider, useMarket } from './MarketContext';
export type { CoinData, MarketOverview, MarketTrend, MarketState } from './MarketContext';

export { BacktestProvider, useBacktest } from './BacktestContext';
export type { 
  BacktestStrategy, 
  BacktestConfiguration, 
  BacktestResult, 
  BacktestTrade, 
  BacktestState 
} from './BacktestContext';

export { EnhancedTradingProvider, useEnhancedTrading } from './EnhancedTradingContext';
export type { 
  Order, 
  Position, 
  TradingAccount, 
  EnhancedTradingState 
} from './EnhancedTradingContext';

export { NotificationProvider, useNotification } from './NotificationContext';
export type { 
  NotificationItem, 
  PriceAlert, 
  NotificationSettings, 
  NotificationState 
} from './NotificationContext';

export { WebSocketProvider, useWebSocket } from './WebSocketContext';
export type { 
  WebSocketConnection, 
  WebSocketMessage, 
  WebSocketSubscription, 
  WebSocketState 
} from './WebSocketContext';
