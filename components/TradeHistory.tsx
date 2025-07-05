'use client';

import { useEffect, useState } from 'react';
import { ChartBarIcon, ArrowPathIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import VSCodeCard from './VSCodeCard';

type Trade = {
  id: string;
  datetime: string;
  price: number;
  amount: number;
  currentPrice: number;
};

export default function TradeHistory() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTradeHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/trade-history');
      if (!res.ok) {
        throw new Error('Lỗi khi lấy lịch sử giao dịch');
      }
      const data = await res.json();
      setTrades(data.slice(0, 5)); // Display only the 5 most recent trades
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const sellBitcoin = async (trade: Trade) => {
    setLoading(true);
    try {
      const res = await fetch('/api/sell-bitcoin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount: trade.amount }),
      });
      if (!res.ok) {
        throw new Error('Lỗi khi bán Bitcoin');
      }
      fetchTradeHistory();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTradeHistory();
  }, []);

  return (
    <VSCodeCard>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <ChartBarIcon className="w-5 h-5 text-accent" />
          Lịch sử giao dịch
        </h2>
        <button
          onClick={fetchTradeHistory}
          disabled={loading}
          className="btn btn-secondary btn-sm"
        >
          <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      {loading && (
        <div className="space-y-2 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-10 bg-panel rounded-md"></div>
          ))}
        </div>
      )}

      {error && (
        <div className="panel-error">
          <ExclamationTriangleIcon className="w-5 h-5 mr-2 text-error" />
          <span>Lỗi: {error}</span>
        </div>
      )}

      {trades.length > 0 ? (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Thời gian</th>
                <th>Giá mua</th>
                <th>Số lượng</th>
                <th>Giá hiện tại</th>
                <th>% Thay đổi</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {trades.map((trade) => {
                const priceChange = ((trade.currentPrice - trade.price) / trade.price) * 100;
                const isProfit = priceChange >= 0;
                
                return (
                  <tr key={trade.id}>
                    <td>{trade.id}</td>
                    <td className="text-sm text-muted">{new Date(trade.datetime).toLocaleString()}</td>
                    <td>{trade.price}</td>
                    <td>{trade.amount}</td>
                    <td>{trade.currentPrice}</td>
                    <td className={isProfit ? 'text-success' : 'text-error'}>
                      {priceChange.toFixed(2)}%
                    </td>
                    <td>
                      <button
                        onClick={() => sellBitcoin(trade)}
                        className="btn btn-sm btn-error"
                        disabled={loading}
                      >
                        Bán
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        !loading && (
          <div className="text-center py-8 text-muted">
            Không có lịch sử giao dịch nào.
          </div>
        )
      )}
    </VSCodeCard>
  );
}
