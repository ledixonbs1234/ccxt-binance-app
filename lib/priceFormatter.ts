// Price formatting utilities for trading platform
import {
  formatMicroCapPrice,
  isMicroCapToken as isMicroCap,
  formatMicroCapPercentage,
  formatMicroCapVolume,
  formatMicroCapForContext
} from './microCapUtils';

export type CoinSymbol = 'BTC' | 'ETH' | 'PEPE';

/**
 * Smart precision detection for different price ranges
 * @param value - The numeric value to analyze
 * @returns Object with precision settings
 */
export function getSmartPrecision(value: number): {
  precision: number;
  useScientific: boolean;
  displayFormat: 'normal' | 'scientific' | 'compact';
} {
  if (value === 0) return { precision: 2, useScientific: false, displayFormat: 'normal' };

  const absValue = Math.abs(value);

  if (absValue < 0.000001) {
    // Extremely small values - use scientific notation
    return { precision: 2, useScientific: true, displayFormat: 'scientific' };
  } else if (absValue < 0.01) {
    // Micro-cap tokens like PEPE - high precision
    return { precision: 8, useScientific: false, displayFormat: 'normal' };
  } else if (absValue < 1) {
    // Small values - medium precision
    return { precision: 6, useScientific: false, displayFormat: 'normal' };
  } else if (absValue >= 1000) {
    // Large values - standard precision with locale formatting
    return { precision: 2, useScientific: false, displayFormat: 'compact' };
  } else {
    // Standard values - normal precision
    return { precision: 2, useScientific: false, displayFormat: 'normal' };
  }
}

/**
 * Check if a token is considered micro-cap based on price
 * @param price - The token price
 * @returns True if micro-cap token
 */
export function isMicroCapToken(price: number): boolean {
  return isMicroCap(price);
}

/**
 * Format price based on coin type with smart precision detection
 * @param price - The price to format
 * @param symbol - The coin symbol
 * @param includeSymbol - Whether to include $ symbol
 * @returns Formatted price string
 */
export function formatPrice(price: number | null | undefined, symbol: CoinSymbol, includeSymbol: boolean = true): string {
  if (price === null || price === undefined || isNaN(price)) {
    return includeSymbol ? '$0.00' : '0.00';
  }

  let formattedPrice: string;

  switch (symbol) {
    case 'PEPE':
      // PEPE requires smart formatting for very small values
      const pepeFormat = getSmartPrecision(price);
      if (pepeFormat.useScientific) {
        formattedPrice = price.toExponential(pepeFormat.precision);
      } else {
        // Remove trailing zeros for better readability
        formattedPrice = parseFloat(price.toFixed(pepeFormat.precision)).toString();
      }
      break;
    case 'BTC':
      // BTC typically shows 2 decimal places with locale formatting
      formattedPrice = price.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
      break;
    case 'ETH':
    default:
      // ETH and other coins typically show 4 decimal places
      formattedPrice = price.toLocaleString('en-US', {
        minimumFractionDigits: 4,
        maximumFractionDigits: 4
      });
      break;
  }

  return includeSymbol ? `$${formattedPrice}` : formattedPrice;
}

/**
 * Format percentage change with smart precision for micro-cap tokens
 * @param change - The percentage change
 * @param basePrice - The base price to determine if it's a micro-cap token
 * @param includeSign - Whether to include + sign for positive values
 * @returns Object with formatted value, color class, and significance indicator
 */
export function formatPercentageChange(
  change: number | null | undefined,
  basePrice?: number,
  includeSign: boolean = true
): {
  value: string;
  colorClass: string;
  isSignificant: boolean;
} {
  if (change === null || change === undefined || isNaN(change)) {
    return {
      value: '0.00%',
      colorClass: 'text-muted',
      isSignificant: false
    };
  }

  const absChange = Math.abs(change);

  // For micro-cap tokens, even small percentage changes can be significant
  const isSignificant = basePrice && isMicroCapToken(basePrice)
    ? absChange > 0.01
    : absChange > 0.1;

  // Use higher precision for small changes in micro-cap tokens
  const precision = absChange < 0.01 ? 4 : 2;

  const sign = change >= 0 && includeSign ? '+' : '';
  const value = `${sign}${change.toFixed(precision)}%`;
  const colorClass = change >= 0 ? 'text-success' : 'text-error';

  return { value, colorClass, isSignificant };
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use the new formatPercentageChange with basePrice parameter
 */
export function formatPercentageChangeLegacy(change: number | null | undefined, includeSign: boolean = true): {
  value: string;
  colorClass: string;
} {
  const result = formatPercentageChange(change, undefined, includeSign);
  return { value: result.value, colorClass: result.colorClass };
}

/**
 * Smart price formatting that automatically detects the best format
 * @param price - The price to format
 * @param options - Formatting options
 * @returns Formatted price string
 */
export function formatSmartPrice(
  price: number | null | undefined,
  options: {
    includeSymbol?: boolean;
    compact?: boolean;
    maxLength?: number;
  } = {}
): string {
  if (price === null || price === undefined || isNaN(price)) {
    return options.includeSymbol ? '$0.00' : '0.00';
  }

  const { includeSymbol = true, compact = false, maxLength } = options;
  const { precision, useScientific, displayFormat } = getSmartPrecision(price);

  let formatted: string;

  if (useScientific) {
    formatted = price.toExponential(precision);
  } else if (displayFormat === 'compact' && Math.abs(price) >= 1000) {
    formatted = price.toLocaleString('en-US', {
      minimumFractionDigits: precision,
      maximumFractionDigits: precision
    });
  } else {
    // Remove trailing zeros for better readability
    formatted = parseFloat(price.toFixed(precision)).toString();
  }

  // Apply max length constraint if specified
  if (maxLength && formatted.length > maxLength) {
    if (Math.abs(price) < 0.000001) {
      formatted = price.toExponential(1);
    } else {
      const reducedPrecision = Math.max(2, precision - 2);
      formatted = parseFloat(price.toFixed(reducedPrecision)).toString();
    }
  }

  return includeSymbol ? `$${formatted}` : formatted;
}

/**
 * Format volume with appropriate units (K, M, B)
 * @param volume - The volume to format
 * @returns Formatted volume string
 */
export function formatVolume(volume: number | null | undefined): string {
  if (volume === null || volume === undefined || isNaN(volume)) {
    return '0';
  }

  return formatMicroCapVolume(volume);
}

/**
 * Format PnL (Profit and Loss) with appropriate styling
 * @param pnl - The PnL value
 * @param pnlPercent - The PnL percentage
 * @param symbol - The coin symbol for price formatting
 * @returns Object with formatted values and color class
 */
export function formatPnL(
  pnl: number | null | undefined, 
  pnlPercent: number | null | undefined, 
  symbol: CoinSymbol
): {
  value: string;
  percent: string;
  colorClass: string;
} {
  if (pnl === null || pnl === undefined || isNaN(pnl) || 
      pnlPercent === null || pnlPercent === undefined || isNaN(pnlPercent)) {
    return {
      value: '$0.00',
      percent: '0.00%',
      colorClass: 'text-muted'
    };
  }

  const value = formatPrice(pnl, symbol);
  const sign = pnlPercent >= 0 ? '+' : '';
  const percent = `${sign}${pnlPercent.toFixed(2)}%`;
  const colorClass = pnlPercent >= 0 ? 'text-success' : 'text-error';

  return { value, percent, colorClass };
}

/**
 * Format quantity based on coin type
 * @param quantity - The quantity to format
 * @param symbol - The coin symbol
 * @returns Formatted quantity string
 */
export function formatQuantity(quantity: number | null | undefined, symbol: CoinSymbol): string {
  if (quantity === null || quantity === undefined || isNaN(quantity)) {
    return '0';
  }

  switch (symbol) {
    case 'PEPE':
      // PEPE quantities are usually very large
      return quantity.toLocaleString('en-US', { maximumFractionDigits: 0 });
    case 'BTC':
      // BTC quantities are usually small decimals
      return quantity.toLocaleString('en-US', {
        minimumFractionDigits: 4,
        maximumFractionDigits: 8
      });
    case 'ETH':
    default:
      // ETH and other coins
      return quantity.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 6
      });
  }
}

/**
 * Format currency with consistent locale for SSR/client compatibility
 * Prevents hydration mismatch by using explicit locale
 * @param value - The numeric value to format
 * @param options - Formatting options
 * @returns Formatted currency string
 */
export function formatCurrency(
  value: number | null | undefined,
  options: {
    includeSymbol?: boolean;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    locale?: string;
  } = {}
): string {
  if (value === null || value === undefined || isNaN(value)) {
    return options.includeSymbol ? '$0.00' : '0.00';
  }

  const {
    includeSymbol = true,
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
    locale = 'en-US'
  } = options;

  const formatted = value.toLocaleString(locale, {
    minimumFractionDigits,
    maximumFractionDigits
  });

  return includeSymbol ? `$${formatted}` : formatted;
}

/**
 * Format number with consistent locale for SSR/client compatibility
 * Prevents hydration mismatch by using explicit locale
 * @param value - The numeric value to format
 * @param options - Formatting options
 * @returns Formatted number string
 */
export function formatNumber(
  value: number | null | undefined,
  options: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    locale?: string;
  } = {}
): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '0';
  }

  const {
    minimumFractionDigits = 0,
    maximumFractionDigits = 2,
    locale = 'en-US'
  } = options;

  return value.toLocaleString(locale, {
    minimumFractionDigits,
    maximumFractionDigits
  });
}

/**
 * Format date with consistent locale for SSR/client compatibility
 * Prevents hydration mismatch by using explicit locale and options
 * @param date - The date to format
 * @param options - Formatting options
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | string | null | undefined,
  options: {
    locale?: string;
    dateStyle?: 'full' | 'long' | 'medium' | 'short';
    timeStyle?: 'full' | 'long' | 'medium' | 'short';
    year?: 'numeric' | '2-digit';
    month?: 'numeric' | '2-digit' | 'long' | 'short' | 'narrow';
    day?: 'numeric' | '2-digit';
    hour?: 'numeric' | '2-digit';
    minute?: 'numeric' | '2-digit';
    second?: 'numeric' | '2-digit';
    hour12?: boolean;
  } = {}
): string {
  if (!date) {
    return '';
  }

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    return '';
  }

  const {
    locale = 'en-US',
    year = 'numeric',
    month = '2-digit',
    day = '2-digit',
    hour = '2-digit',
    minute = '2-digit',
    hour12 = false,
    ...restOptions
  } = options;

  return dateObj.toLocaleString(locale, {
    year,
    month,
    day,
    hour,
    minute,
    hour12,
    ...restOptions
  });
}
