'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';

export type CoinSymbol = 'BTC' | 'ETH' | 'PEPE';
export type Timeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '1d';

export interface CoinData {
  symbol: CoinSymbol;
  pair: string;
  price: number;
  change24h: number;
  volume: number;
  high: number;
  low: number;
}

export interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface TradingContextType {
  selectedCoin: CoinSymbol;
  setSelectedCoin: (coin: CoinSymbol) => void;
  coinsData: Record<CoinSymbol, CoinData>;
  candleData: Record<CoinSymbol, CandleData[]>;
  isLoading: boolean;
  error: string | null;
  timeframe: Timeframe;
  setTimeframe: (timeframe: Timeframe) => void;
  btcData?: CoinData;
  ethData?: CoinData;
  pepeData?: CoinData;
}

const TradingContext = createContext<TradingContextType | undefined>(undefined);

const COIN_PAIRS: Record<CoinSymbol, string> = {
  BTC: 'BTC/USDT',
  ETH: 'ETH/USDT',
  PEPE: 'PEPE/USDT'
};

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function TradingProvider({ children }: { children: ReactNode }) {
  const [selectedCoin, setSelectedCoin] = useState<CoinSymbol>('BTC');
  const [timeframe, setTimeframe] = useState<Timeframe>('1m');
  const [rawCoinsData, setRawCoinsData] = useState<Record<CoinSymbol, CoinData>>({
    BTC: { symbol: 'BTC', pair: 'BTC/USDT', price: 0, change24h: 0, volume: 0, high: 0, low: 0 },
    ETH: { symbol: 'ETH', pair: 'ETH/USDT', price: 0, change24h: 0, volume: 0, high: 0, low: 0 },
    PEPE: { symbol: 'PEPE', pair: 'PEPE/USDT', price: 0, change24h: 0, volume: 0, high: 0, low: 0 }
  });
  const [candleData, setCandleData] = useState<Record<CoinSymbol, CandleData[]>>({
    BTC: [],
    ETH: [],
    PEPE: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Debounce the coins data to prevent flickering (500ms delay)
  const coinsData = useDebounce(rawCoinsData, 500);
  
  const isFirstLoad = useRef(true);

  // Fetch ticker data for all coins using batch API
  const fetchTickerData = useCallback(async () => {
    const wasFirstLoad = isFirstLoad.current;
    try {
      if (wasFirstLoad) {
        setIsLoading(true);
      }
      setError(null);

      const coins = Object.keys(COIN_PAIRS) as CoinSymbol[];
      const symbols = coins.map(coin => COIN_PAIRS[coin]).join(',');

      console.log(`[TradingContext] Fetching batch ticker data for: ${symbols}`);
      const startTime = Date.now();

      const response = await fetch(`/api/batch-ticker?symbols=${encodeURIComponent(symbols)}`);
      if (!response.ok) {
        throw new Error(`Batch ticker API failed: ${response.status} ${response.statusText}`);
      }

      const batchResult = await response.json();
      const endTime = Date.now();

      console.log(`[TradingContext] Batch ticker completed in ${endTime - startTime}ms`);

      if (!batchResult.success) {
        throw new Error(`Batch ticker failed: ${batchResult.error}`);
      }

      // Convert batch results to the expected format
      const results = batchResult.results.map((result: any) => {
        const coin = Object.keys(COIN_PAIRS).find(
          key => COIN_PAIRS[key as CoinSymbol] === result.symbol
        ) as CoinSymbol;
        return { coin, data: result.data };
      });

      setRawCoinsData(prevData => {
        const newCoinsData = { ...prevData };
        results.forEach(({ coin, data }: { coin: CoinSymbol; data: any }) => {
          newCoinsData[coin as CoinSymbol] = {
            symbol: coin,
            pair: COIN_PAIRS[coin as CoinSymbol],
            price: data.last || 0,
            change24h: data.percentage || 0,
            volume: data.quoteVolume || 0,
            high: data.high || 0,
            low: data.low || 0
          };
        });
        return newCoinsData;
      });

      isFirstLoad.current = false;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      if (wasFirstLoad) {
        setIsLoading(false);
      }
    }
  }, []); // Remove dependency to prevent infinite re-renders

  // Fetch candle data for a specific coin
  const fetchCandleData = useCallback(async (coin: CoinSymbol, timeframe: Timeframe) => {
    try {
      const response = await fetch(`/api/candles?symbol=${COIN_PAIRS[coin]}&timeframe=${timeframe}&limit=100`);
      if (!response.ok) throw new Error(`Failed to fetch ${coin} candle data`);

      const result = await response.json();

      // Handle cached response format
      const candleArray = result.data || result;
      const isCached = result.cached || false;

      console.log(`[TradingContext] Candle data for ${coin} ${timeframe} ${isCached ? '(cached)' : '(fresh)'}`);

      const formattedData: CandleData[] = candleArray.map((candle: any) => ({
        time: candle[0],
        open: candle[1],
        high: candle[2],
        low: candle[3],
        close: candle[4],
        volume: candle[5]
      }));

      setCandleData(prev => ({
        ...prev,
        [coin]: formattedData
      }));
    } catch (err) {
      console.error(`Error fetching candle data for ${coin}:`, err);
    }
  }, []);

  // Update prices every 5 seconds with debouncing
  useEffect(() => {
    fetchTickerData();
    const interval = setInterval(fetchTickerData, 5000);
    return () => clearInterval(interval);
  }, [fetchTickerData]);

  // Update candle data every 20 seconds for selected coin
  useEffect(() => {
    fetchCandleData(selectedCoin, timeframe);
    const interval = setInterval(() => fetchCandleData(selectedCoin, timeframe), 20000);
    return () => clearInterval(interval);
  }, [selectedCoin, timeframe, fetchCandleData]);

  return (
    <TradingContext.Provider
      value={{
        selectedCoin,
        setSelectedCoin,
        coinsData,
        candleData,
        isLoading,
        error,
        timeframe,
        setTimeframe,
        btcData: coinsData.BTC,
        ethData: coinsData.ETH,
        pepeData: coinsData.PEPE
      }}
    >
      {children}
    </TradingContext.Provider>
  );
}

export function useTrading() {
  const context = useContext(TradingContext);
  if (context === undefined) {
    throw new Error('useTrading must be used within a TradingProvider');
  }
  return context;
}
