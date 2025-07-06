// Price formatting utilities for trading platform
export type CoinSymbol = 'BTC' | 'ETH' | 'PEPE';

/**
 * Format price based on coin type with appropriate precision
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
      // PEPE requires high precision due to very small values
      formattedPrice = price.toFixed(8);
      break;
    case 'BTC':
      // BTC typically shows 2 decimal places
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
 * Format percentage change with appropriate color coding
 * @param change - The percentage change
 * @param includeSign - Whether to include + sign for positive values
 * @returns Object with formatted value and color class
 */
export function formatPercentageChange(change: number | null | undefined, includeSign: boolean = true): {
  value: string;
  colorClass: string;
} {
  if (change === null || change === undefined || isNaN(change)) {
    return {
      value: '0.00%',
      colorClass: 'text-muted'
    };
  }

  const sign = change >= 0 && includeSign ? '+' : '';
  const value = `${sign}${change.toFixed(2)}%`;
  const colorClass = change >= 0 ? 'text-success' : 'text-error';

  return { value, colorClass };
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

  if (volume >= 1e9) {
    return `${(volume / 1e9).toFixed(2)}B`;
  } else if (volume >= 1e6) {
    return `${(volume / 1e6).toFixed(2)}M`;
  } else if (volume >= 1e3) {
    return `${(volume / 1e3).toFixed(2)}K`;
  } else {
    return volume.toLocaleString();
  }
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
