// File: contexts/PriceContext.tsx
'use client';

import React, { createContext, useState, useEffect, useContext, useRef, ReactNode, useCallback } from 'react';

interface PriceContextState {
  price: number | null;
  isConnected: boolean;
  error: string | null;
  symbol: string; // Lưu symbol hiện tại
  setSymbol: (newSymbol: string) => void; // Hàm để đổi symbol
}

const PriceContext = createContext<PriceContextState | undefined>(undefined);

// --- Chọn Stream ---
// '@ticker' - Cập nhật 1 giây/lần với giá cuối, giá bid/ask tốt nhất, khối lượng 24h... (Ít dữ liệu hơn, nhẹ hơn)
// '@trade' - Cập nhật mỗi khi có giao dịch khớp lệnh (Rất nhiều dữ liệu, có thể gây nhiều re-render nếu không cẩn thận)
const STREAM_TYPE = '@ticker'; // Dùng ticker cho đơn giản

export const PriceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [symbol, setSymbolInternal] = useState<string>('btcusdt'); // Symbol mặc định, không có '/' và viết thường
  const [price, setPrice] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);

  const connectWebSocket = useCallback(() => {
    // Đóng kết nối cũ nếu có
    if (ws.current && ws.current.readyState !== WebSocket.CLOSED) {
        console.log(`[WebSocket] Closing existing connection before reconnecting for ${symbol}...`);
        ws.current.close();
    }
     if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
        reconnectTimeout.current = null;
    }


    // Xóa lỗi cũ
    setError(null);
    console.log(`[WebSocket] Connecting to ${symbol.toLowerCase()}${STREAM_TYPE}...`);
    // Binance WebSocket URL: wss://stream.binance.com:9443/ws/<symbol>@<streamName>
    // Hoặc wss://stream.binance.com:9443/stream?streams=<symbol>@<streamName>/<symbol2>@<streamName>... (cho nhiều stream)
    const wsUrl = `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}${STREAM_TYPE}`;
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log(`[WebSocket] Connected to ${symbol}`);
      setIsConnected(true);
      setError(null); // Xóa lỗi nếu kết nối thành công
       if (reconnectTimeout.current) { // Xóa timeout retry nếu kết nối thành công
           clearTimeout(reconnectTimeout.current);
           reconnectTimeout.current = null;
       }
    };

    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        // console.log('[WebSocket] Message received:', data); // Log để debug

        // Dữ liệu từ stream @ticker có dạng { ..., c: "LAST_PRICE", ... }
        if (data && data.e === '24hrTicker' && data.c) {
           const newPrice = parseFloat(data.c);
           if (!isNaN(newPrice)) {
               // Chỉ cập nhật state nếu giá thực sự thay đổi
               setPrice(currentPrice => {
                   if (newPrice !== currentPrice) {
                       // console.log(`[WebSocket] Price updated: ${newPrice}`);
                       return newPrice;
                   }
                   return currentPrice;
               });
           }
        }
        // Nếu dùng stream @trade: data có dạng { ..., p: "PRICE", ... }
        else if (data && data.e === 'trade' && data.p) {
             const newPrice = parseFloat(data.p);
            // ... xử lý tương tự ...
        }

      } catch (e) {
        console.error('[WebSocket] Error parsing message:', e);
      }
    };

    ws.current.onerror = (event) => {
      console.error('[WebSocket] Error:', event);
      setError('Lỗi kết nối WebSocket.');
      setIsConnected(false); // Đánh dấu mất kết nối
    };

    ws.current.onclose = (event) => {
      console.log(`[WebSocket] Disconnected from ${symbol}. Code: ${event.code}, Reason: ${event.reason}`);
      setIsConnected(false);
       // Tự động kết nối lại sau một khoảng trễ (ví dụ: 5 giây) trừ khi đóng chủ động
       if (!event.wasClean) { // Chỉ retry nếu không phải đóng sạch
           console.log('[WebSocket] Attempting to reconnect in 5 seconds...');
           if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current); // Xóa timeout cũ nếu có
           reconnectTimeout.current = setTimeout(connectWebSocket, 5000);
       }
    };

  }, [symbol]); // Phụ thuộc vào symbol để kết nối lại khi symbol thay đổi

  // Hàm để component bên ngoài thay đổi symbol
  const setSymbol = useCallback((newSymbol: string) => {
      // Chuẩn hóa symbol (viết thường, bỏ '/')
      const formattedSymbol = newSymbol.replace('/', '').toLowerCase();
      if (formattedSymbol !== symbol) {
          console.log(`[PriceContext] Symbol changed to: ${formattedSymbol}`);
          // Đóng kết nối cũ trước khi đổi symbol
          if (ws.current && ws.current.readyState === WebSocket.OPEN) {
              console.log("[WebSocket] Closing connection due to symbol change...");
              ws.current.close(1000, "Symbol changed"); // Mã 1000: Normal closure
          }
          if (reconnectTimeout.current) { // Hủy retry nếu đang chờ
            clearTimeout(reconnectTimeout.current);
            reconnectTimeout.current = null;
          }
          setPrice(null); // Reset giá khi đổi symbol
          setIsConnected(false); // Reset trạng thái kết nối
          setSymbolInternal(formattedSymbol);
          // useEffect sẽ tự động gọi connectWebSocket do 'symbol' thay đổi
      }
  }, [symbol, connectWebSocket]); // Thêm connectWebSocket để ESLint không báo warning

  // Effect để quản lý kết nối
  useEffect(() => {
    connectWebSocket(); // Kết nối khi component mount hoặc symbol thay đổi

    // Cleanup function: Đóng kết nối khi unmount
    return () => {
      console.log('[WebSocket] Unmounting PriceProvider, closing connection...');
       if (reconnectTimeout.current) { // Clear timeout nếu có khi unmount
           clearTimeout(reconnectTimeout.current);
       }
      if (ws.current) {
        // Đặt onclose thành null để tránh retry khi unmount
        ws.current.onclose = null;
        ws.current.close(1000, "Component unmounted"); // Đóng sạch
      }
    };
  }, [connectWebSocket]); // Phụ thuộc vào hàm connectWebSocket đã useCallback

  return (
    <PriceContext.Provider value={{ price, isConnected, error, symbol, setSymbol }}>
      {children}
    </PriceContext.Provider>
  );
};

// Hook tùy chỉnh để dễ dàng sử dụng context
export const usePrice = (): PriceContextState => {
  const context = useContext(PriceContext);
  if (context === undefined) {
    throw new Error('usePrice must be used within a PriceProvider');
  }
  return context;
};