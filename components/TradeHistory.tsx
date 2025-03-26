'use client';

import { useEffect, useState } from 'react';

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
    <div className="bg-gray-50 p-6 rounded shadow my-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-5">Lịch sử giao dịch</h2>
      {loading && <p className="text-blue-500">Đang tải...</p>}
      {error && <p className="text-red-500">Lỗi: {error}</p>}
      {trades.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full text-center mx-auto">
            <thead className="bg-gray-200">
              <tr>
                <th className="py-3 px-4 border">ID</th>
                <th className="py-3 px-4 border">Thời gian</th>
                <th className="py-3 px-4 border">Giá mua</th>
                <th className="py-3 px-4 border">Số lượng</th>
                <th className="py-3 px-4 border">Giá hiện tại</th>
                <th className="py-3 px-4 border">% Thay đổi</th>
                <th className="py-3 px-4 border">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {trades.map((trade) => (
                <tr key={trade.id} className="border-b hover:bg-gray-100">
                  <td className="py-2 px-3">{trade.id}</td>
                  <td className="py-2 px-3">{new Date(trade.datetime).toLocaleString()}</td>
                  <td className="py-2 px-3">{trade.price}</td>
                  <td className="py-2 px-3">{trade.amount}</td>
                  <td className="py-2 px-3">{trade.currentPrice}</td>
                  <td className="py-2 px-3">
                    {(((trade.currentPrice - trade.price) / trade.price) * 100).toFixed(2)}%
                  </td>
                  <td className="py-2 px-3">
                    <button
                      onClick={() => sellBitcoin(trade)}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Bán
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        !loading && <p>Không có lịch sử giao dịch nào.</p>
      )}
    </div>
  );
}
