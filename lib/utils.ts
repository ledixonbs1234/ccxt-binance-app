/**
 * Utility functions for the trading app
 */

let idCounter = 0;

/**
 * Generate a unique ID for notifications and other components
 * Uses timestamp + counter to ensure uniqueness even for rapid successive calls
 */
export function generateUniqueId(): number {
  return Date.now() + (idCounter++);
}

/**
 * Generate a unique string ID using timestamp and random value
 */
export function generateUniqueStringId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Format number with proper decimal places
 */
export function formatNumber(num: number, decimals: number = 2): string {
  return num.toFixed(decimals);
}

/**
 * Format currency with proper symbols
 */
export function formatCurrency(amount: number, currency: string = 'USDT'): string {
  return `${formatNumber(amount)} ${currency}`;
}

/**
 * Debounce function to prevent excessive API calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
