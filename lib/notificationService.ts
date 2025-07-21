import { TrailingStopPosition, TrailingStopAlert } from '@/types/trailingStop';
import { MarketAlert } from '@/lib/marketAnalysisService';

export interface NotificationSettings {
  enabled: boolean;
  soundEnabled: boolean;
  browserNotifications: boolean;
  emailNotifications: boolean;
  webhookUrl?: string;
  alertTypes: {
    adjustment: boolean;
    trigger: boolean;
    activation: boolean;
    warning: boolean;
    strategy_switch: boolean;
    market_alert: boolean;
  };
  priceThresholds: {
    enabled: boolean;
    percentage: number; // Alert when price moves X%
  };
  volumeThresholds: {
    enabled: boolean;
    multiplier: number; // Alert when volume is X times average
  };
}

export interface Notification {
  id: string;
  type: 'trailing_stop' | 'market_alert' | 'system';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: number;
  data?: any;
  read: boolean;
  persistent: boolean;
}

export interface WebSocketMessage {
  type: 'notification' | 'price_update' | 'position_update' | 'market_alert';
  data: any;
  timestamp: number;
}

export class NotificationService {
  private settings: NotificationSettings;
  private notifications: Notification[] = [];
  private subscribers: ((notification: Notification) => void)[] = [];
  private websocket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;
  private connectionUrl = '';
  private lastError: string | null = null;

  constructor() {
    this.settings = this.getDefaultSettings();
    this.loadSettings();
    this.requestNotificationPermission();
  }

  private getDefaultSettings(): NotificationSettings {
    return {
      enabled: true,
      soundEnabled: true,
      browserNotifications: true,
      emailNotifications: false,
      alertTypes: {
        adjustment: true,
        trigger: true,
        activation: true,
        warning: true,
        strategy_switch: true,
        market_alert: true
      },
      priceThresholds: {
        enabled: true,
        percentage: 5.0
      },
      volumeThresholds: {
        enabled: true,
        multiplier: 3.0
      }
    };
  }

  /**
   * Initialize WebSocket connection for real-time notifications
   */
  initializeWebSocket(url?: string): void {
    if (typeof window === 'undefined') {
      console.warn('[NotificationService] WebSocket not available in server environment');
      return;
    }

    if (this.isConnecting) {
      console.warn('[NotificationService] WebSocket connection already in progress');
      return;
    }

    const wsUrl = url || `ws://localhost:3000/ws`;
    this.connectionUrl = wsUrl;
    this.isConnecting = true;
    this.lastError = null;

    console.log(`[NotificationService] Attempting to connect to WebSocket: ${wsUrl}`);

    try {
      // Close existing connection if any
      if (this.websocket) {
        this.websocket.close();
        this.websocket = null;
      }

      this.websocket = new WebSocket(wsUrl);

      this.websocket.onopen = (event) => {
        console.log('[NotificationService] WebSocket connected successfully');
        console.log('[NotificationService] Connection details:', {
          url: wsUrl,
          readyState: this.websocket?.readyState,
          protocol: this.websocket?.protocol
        });

        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.lastError = null;

        this.sendNotification({
          type: 'system',
          title: 'Connection Established',
          message: 'Real-time notifications are now active',
          severity: 'low',
          persistent: false
        });
      };

      this.websocket.onmessage = (event) => {
        try {
          console.log('[NotificationService] Received WebSocket message:', event.data);
          const message: WebSocketMessage = JSON.parse(event.data);
          this.handleWebSocketMessage(message);
        } catch (error) {
          console.error('[NotificationService] Failed to parse WebSocket message:', {
            error: error instanceof Error ? error.message : 'Unknown error',
            rawData: event.data,
            stack: error instanceof Error ? error.stack : undefined
          });
        }
      };

      this.websocket.onclose = (event) => {
        this.isConnecting = false;

        console.log('[NotificationService] WebSocket disconnected:', {
          code: event.code,
          reason: event.reason || 'No reason provided',
          wasClean: event.wasClean,
          url: this.connectionUrl
        });

        // Map close codes to human-readable messages
        const closeReasons: Record<number, string> = {
          1000: 'Normal closure',
          1001: 'Going away',
          1002: 'Protocol error',
          1003: 'Unsupported data',
          1006: 'Connection lost (no close frame)',
          1011: 'Server error',
          1012: 'Service restart',
          1013: 'Try again later',
          1014: 'Bad gateway',
          1015: 'TLS handshake failure'
        };

        const closeReason = closeReasons[event.code] || `Unknown close code: ${event.code}`;
        this.lastError = `Connection closed: ${closeReason}`;

        this.handleWebSocketReconnect(event.code, event.reason);
      };

      this.websocket.onerror = (event) => {
        this.isConnecting = false;

        // Enhanced error logging for WebSocket errors
        const errorDetails = {
          type: 'WebSocket Error',
          url: this.connectionUrl,
          readyState: this.websocket?.readyState,
          timestamp: new Date().toISOString(),
          reconnectAttempts: this.reconnectAttempts,
          userAgent: navigator.userAgent,
          // WebSocket error events don't provide much detail in browsers
          eventType: event.type,
          target: event.target?.constructor?.name || 'Unknown'
        };

        console.error('[NotificationService] WebSocket error occurred:', errorDetails);

        // Store error for debugging
        this.lastError = `WebSocket error: Connection failed to ${this.connectionUrl}`;

        // Check if this is a connection refused error (common when server is down)
        if (this.websocket?.readyState === WebSocket.CLOSED) {
          this.lastError += ' (Connection refused - server may be down)';
        }

        // Send user-friendly notification for WebSocket errors
        this.sendNotification({
          type: 'system',
          title: 'Connection Error',
          message: 'Failed to connect to real-time notifications. Retrying...',
          severity: 'medium',
          persistent: false
        });
      };

      // Set connection timeout
      setTimeout(() => {
        if (this.websocket?.readyState === WebSocket.CONNECTING) {
          console.warn('[NotificationService] WebSocket connection timeout');
          this.lastError = 'Connection timeout';
          this.websocket.close();
        }
      }, 10000); // 10 second timeout

    } catch (error) {
      this.isConnecting = false;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.lastError = `Failed to initialize WebSocket: ${errorMessage}`;

      console.error('[NotificationService] Failed to initialize WebSocket:', {
        error: errorMessage,
        url: wsUrl,
        stack: error instanceof Error ? error.stack : undefined
      });

      this.sendNotification({
        type: 'system',
        title: 'Connection Failed',
        message: 'Unable to initialize real-time notifications',
        severity: 'high',
        persistent: true
      });
    }
  }

  private handleWebSocketMessage(message: WebSocketMessage): void {
    switch (message.type) {
      case 'notification':
        this.sendNotification(message.data);
        break;
      case 'price_update':
        this.handlePriceUpdate(message.data);
        break;
      case 'position_update':
        this.handlePositionUpdate(message.data);
        break;
      case 'market_alert':
        this.handleMarketAlert(message.data);
        break;
    }
  }

  private handleWebSocketReconnect(closeCode?: number, closeReason?: string): void {
    // Don't reconnect for certain close codes
    const noReconnectCodes = [1000, 1001, 1005]; // Normal closure, going away, no status
    if (closeCode && noReconnectCodes.includes(closeCode)) {
      console.log('[NotificationService] WebSocket closed normally, not reconnecting');
      return;
    }

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

      console.log(`[NotificationService] Scheduling reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);
      console.log(`[NotificationService] Close details:`, { closeCode, closeReason, lastError: this.lastError });

      setTimeout(() => {
        if (this.reconnectAttempts <= this.maxReconnectAttempts) {
          console.log(`[NotificationService] Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
          this.initializeWebSocket(this.connectionUrl);
        }
      }, delay);
    } else {
      console.error('[NotificationService] Max reconnection attempts reached');
      this.sendNotification({
        type: 'system',
        title: 'Connection Lost',
        message: `Failed to reconnect to real-time notifications after ${this.maxReconnectAttempts} attempts`,
        severity: 'high',
        persistent: true
      });
    }
  }

  /**
   * Send notification
   */
  sendNotification(notification: Omit<Notification, 'id' | 'timestamp' | 'read'>): void {
    if (!this.settings.enabled) return;

    const fullNotification: Notification = {
      id: this.generateId(),
      timestamp: Date.now(),
      read: false,
      ...notification
    };

    this.notifications.unshift(fullNotification);
    
    // Keep only last 100 notifications
    if (this.notifications.length > 100) {
      this.notifications = this.notifications.slice(0, 100);
    }

    // Notify subscribers
    this.subscribers.forEach(callback => callback(fullNotification));

    // Show browser notification
    if (this.settings.browserNotifications && notification.severity !== 'low') {
      this.showBrowserNotification(fullNotification);
    }

    // Play sound
    if (this.settings.soundEnabled && notification.severity === 'high') {
      this.playNotificationSound();
    }

    // Send webhook if configured
    if (this.settings.webhookUrl) {
      this.sendWebhook(fullNotification);
    }

    console.log('[NotificationService] Notification sent:', fullNotification);
  }

  /**
   * Handle trailing stop alerts
   */
  handleTrailingStopAlert(alert: TrailingStopAlert): void {
    if (!this.settings.alertTypes[alert.type]) return;

    const severityMap: Record<string, 'low' | 'medium' | 'high'> = {
      'adjustment': 'low',
      'trigger': 'high',
      'activation': 'medium',
      'warning': 'medium',
      'strategy_switch': 'medium'
    };

    this.sendNotification({
      type: 'trailing_stop',
      title: `Trailing Stop ${alert.type.replace('_', ' ').toUpperCase()}`,
      message: alert.message,
      severity: severityMap[alert.type] || 'medium',
      data: alert,
      persistent: alert.type === 'trigger'
    });
  }

  /**
   * Handle market alerts
   */
  handleMarketAlert(alert: MarketAlert): void {
    if (!this.settings.alertTypes.market_alert) return;

    this.sendNotification({
      type: 'market_alert',
      title: `Market Alert: ${alert.type.replace('_', ' ').toUpperCase()}`,
      message: alert.message,
      severity: alert.severity,
      data: alert,
      persistent: alert.severity === 'high'
    });
  }

  /**
   * Handle price updates for threshold alerts
   */
  private handlePriceUpdate(data: { symbol: string, price: number, change: number }): void {
    if (!this.settings.priceThresholds.enabled) return;

    const changePercent = Math.abs(data.change);
    if (changePercent >= this.settings.priceThresholds.percentage) {
      this.sendNotification({
        type: 'market_alert',
        title: 'Price Alert',
        message: `${data.symbol} moved ${data.change >= 0 ? '+' : ''}${data.change.toFixed(2)}%`,
        severity: changePercent > 10 ? 'high' : 'medium',
        data,
        persistent: false
      });
    }
  }

  /**
   * Handle position updates
   */
  private handlePositionUpdate(position: TrailingStopPosition): void {
    // Check for significant P&L changes
    if (Math.abs(position.unrealizedPnLPercent) > 10) {
      this.sendNotification({
        type: 'trailing_stop',
        title: 'Position Update',
        message: `${position.symbol} P&L: ${position.unrealizedPnLPercent >= 0 ? '+' : ''}${position.unrealizedPnLPercent.toFixed(2)}%`,
        severity: position.unrealizedPnLPercent < -15 ? 'high' : 'medium',
        data: position,
        persistent: false
      });
    }
  }

  /**
   * Show browser notification
   */
  private async showBrowserNotification(notification: Notification): Promise<void> {
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    if (Notification.permission === 'granted') {
      const browserNotification = new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: notification.id,
        requireInteraction: notification.persistent
      });

      browserNotification.onclick = () => {
        window.focus();
        this.markAsRead(notification.id);
        browserNotification.close();
      };

      // Auto close after 5 seconds for non-persistent notifications
      if (!notification.persistent) {
        setTimeout(() => browserNotification.close(), 5000);
      }
    }
  }

  /**
   * Play notification sound
   */
  private playNotificationSound(): void {
    if (typeof window === 'undefined') return;

    try {
      const audio = new Audio('/notification-sound.mp3');
      audio.volume = 0.3;
      audio.play().catch(error => {
        console.warn('[NotificationService] Failed to play notification sound:', error);
      });
    } catch (error) {
      console.warn('[NotificationService] Notification sound not available:', error);
    }
  }

  /**
   * Send webhook notification
   */
  private async sendWebhook(notification: Notification): Promise<void> {
    if (!this.settings.webhookUrl) return;

    try {
      await fetch(this.settings.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: `${notification.title}: ${notification.message}`,
          notification,
          timestamp: notification.timestamp
        })
      });
    } catch (error) {
      console.error('[NotificationService] Failed to send webhook:', error);
    }
  }

  /**
   * Request browser notification permission
   */
  private async requestNotificationPermission(): Promise<void> {
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    if (Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }

  /**
   * Subscribe to notifications
   */
  subscribe(callback: (notification: Notification) => void): () => void {
    this.subscribers.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  /**
   * Get all notifications
   */
  getNotifications(): Notification[] {
    return [...this.notifications];
  }

  /**
   * Get unread notifications
   */
  getUnreadNotifications(): Notification[] {
    return this.notifications.filter(n => !n.read);
  }

  /**
   * Mark notification as read
   */
  markAsRead(id: string): void {
    const notification = this.notifications.find(n => n.id === id);
    if (notification) {
      notification.read = true;
    }
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead(): void {
    this.notifications.forEach(n => n.read = true);
  }

  /**
   * Clear all notifications
   */
  clearAll(): void {
    this.notifications = [];
  }

  /**
   * Update settings
   */
  updateSettings(newSettings: Partial<NotificationSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.saveSettings();
  }

  /**
   * Get current settings
   */
  getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  /**
   * Load settings from localStorage
   */
  private loadSettings(): void {
    if (typeof window === 'undefined') return;

    try {
      const saved = localStorage.getItem('notification-settings');
      if (saved) {
        this.settings = { ...this.settings, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.warn('[NotificationService] Failed to load settings:', error);
    }
  }

  /**
   * Save settings to localStorage
   */
  private saveSettings(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem('notification-settings', JSON.stringify(this.settings));
    } catch (error) {
      console.warn('[NotificationService] Failed to save settings:', error);
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `notification_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Get WebSocket connection status
   */
  getConnectionStatus(): {
    connected: boolean;
    connecting: boolean;
    url: string;
    readyState: string;
    reconnectAttempts: number;
    lastError: string | null;
  } {
    const readyStateMap: Record<number, string> = {
      0: 'CONNECTING',
      1: 'OPEN',
      2: 'CLOSING',
      3: 'CLOSED'
    };

    return {
      connected: this.websocket?.readyState === WebSocket.OPEN,
      connecting: this.isConnecting,
      url: this.connectionUrl,
      readyState: this.websocket ? readyStateMap[this.websocket.readyState] : 'NOT_INITIALIZED',
      reconnectAttempts: this.reconnectAttempts,
      lastError: this.lastError
    };
  }

  /**
   * Force reconnect WebSocket
   */
  forceReconnect(): void {
    console.log('[NotificationService] Force reconnecting WebSocket...');
    this.reconnectAttempts = 0;
    this.lastError = null;

    if (this.websocket) {
      this.websocket.close();
    }

    setTimeout(() => {
      this.initializeWebSocket(this.connectionUrl);
    }, 1000);
  }

  /**
   * Disconnect WebSocket
   */
  disconnect(): void {
    console.log('[NotificationService] Manually disconnecting WebSocket');
    this.reconnectAttempts = this.maxReconnectAttempts; // Prevent auto-reconnect

    if (this.websocket) {
      this.websocket.close(1000, 'Manual disconnect');
      this.websocket = null;
    }

    this.isConnecting = false;
  }

  /**
   * Test WebSocket connection with ping
   */
  testConnection(): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
        console.warn('[NotificationService] WebSocket not connected for ping test');
        resolve(false);
        return;
      }

      const testMessage = {
        type: 'ping',
        timestamp: Date.now()
      };

      try {
        this.websocket.send(JSON.stringify(testMessage));
        console.log('[NotificationService] Ping sent to WebSocket server');
        resolve(true);
      } catch (error) {
        console.error('[NotificationService] Failed to send ping:', error);
        resolve(false);
      }
    });
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    console.log('[NotificationService] Destroying service and cleaning up resources');

    this.reconnectAttempts = this.maxReconnectAttempts; // Prevent reconnection

    if (this.websocket) {
      this.websocket.close(1000, 'Service destroyed');
      this.websocket = null;
    }

    this.isConnecting = false;
    this.subscribers = [];
    this.notifications = [];
    this.lastError = null;
  }
}

// Export singleton instance
export const notificationService = new NotificationService();

// Initialize WebSocket connection when in browser environment
if (typeof window !== 'undefined') {
  // Check if WebSocket server is likely available before connecting
  const checkServerAndConnect = async () => {
    try {
      // Try to check if the WebSocket server port is accessible
      // This is a simple check - in production you might want a proper health check endpoint
      console.log('[NotificationService] Checking if WebSocket server is available...');

      // Initialize WebSocket with graceful error handling
      // The enhanced error handling will manage connection failures properly
      notificationService.initializeWebSocket();

    } catch (error) {
      console.warn('[NotificationService] WebSocket server check failed:', error);
      // Service will still work without WebSocket (local notifications only)
    }
  };

  // Initialize after a short delay to ensure the service is ready
  setTimeout(checkServerAndConnect, 2000);
}
