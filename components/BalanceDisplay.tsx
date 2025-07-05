// File: components/BalanceDisplay.tsx
'use client';

import { useEffect, useState, useCallback } from "react";
import { ArrowPathIcon, WalletIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import LoadingOverlay from './LoadingOverlay';

type Balance = {
  free?: Record<string, number>;
  total?: Record<string, number>;
  [key: string]: any;
};

// Định nghĩa thông tin cơ bản và icon cho các coin phổ biến
const COIN_INFO: Record<string, { name: string; icon: string }> = {
  BTC: { name: "Bitcoin", icon: "₿" },
  USDT: { name: "Tether", icon: "₮" },
  ETH: { name: "Ethereum", icon: "Ξ" },
  BNB: { name: "Binance Coin", icon: "🔶" },
};

// Định dạng số với độ chính xác phù hợp
const formatAmount = (amount: number, coin: string): string => {
    const options: Intl.NumberFormatOptions = {
        maximumFractionDigits: coin === 'USDT' ? 2 : 8,
        minimumFractionDigits: 2,
    };
    return amount.toLocaleString(undefined, options);
};


export default function BalanceDisplay() {
  const [balance, setBalance] = useState<Balance | null>(null);
  const [loading, setLoading] = useState(true); // Bắt đầu là true
  const [error, setError] = useState<string | null>(null);

  // Sử dụng useCallback để tránh tạo lại hàm fetchBalance mỗi lần render
  const fetchBalance = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/balance');
      if (!res.ok) {
        const errData = await res.json().catch(() => ({})); // Cố gắng parse lỗi json
        throw new Error(errData.message || 'Lỗi khi lấy số dư');
      }
      const data = await res.json();
      setBalance(data);
    } catch (err: any) {
      console.error("Fetch balance error:", err);
      setError(err.message);
      setBalance(null); // Xóa số dư cũ nếu có lỗi
    } finally {
      setLoading(false);
    }
  }, []); // Không có dependency, chỉ tạo 1 lần

  // Lọc và lấy thông tin coin cần hiển thị
  const getFilteredBalance = () => {
    if (!balance || !balance.free) return []; // Trả về mảng rỗng nếu không có dữ liệu

    // Ưu tiên các coin chính, sau đó thêm các coin khác có số dư > 0
    const mainCoins = ["USDT", "BTC", "ETH", "BNB"]; // Các coin muốn hiển thị trước
    const otherCoins = Object.keys(balance.free).filter(coin => !mainCoins.includes(coin) && balance.free![coin] > 0.00001); // Lọc coin khác có số dư

    const allCoinsToShow = [...mainCoins,];

    return allCoinsToShow
      .filter(coin => balance.free?.[coin] !== undefined) // Đảm bảo coin tồn tại trong 'free'
      .map(coin => ({
        symbol: coin,
        amount: balance.free![coin],
        name: COIN_INFO[coin]?.name || coin, // Lấy tên đầy đủ hoặc dùng symbol
        icon: COIN_INFO[coin]?.icon || coin.charAt(0).toUpperCase(), // Lấy icon hoặc chữ cái đầu
      }))
       // Sắp xếp: USDT đầu tiên, sau đó theo giá trị ước tính (nếu có) hoặc alphabet
      .sort((a, b) => {
           if (a.symbol === 'USDT') return -1;
           if (b.symbol === 'USDT') return 1;
           // Thêm logic sort theo giá trị nếu có API giá
           return a.symbol.localeCompare(b.symbol); // Fallback sort theo tên
      });
  };

  const filteredBalanceList = getFilteredBalance();

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]); // Chạy fetchBalance khi component mount

  return (
    <LoadingOverlay isLoading={loading} message="Loading balance..." delay={200}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <WalletIcon className="w-5 h-5 text-[var(--accent)]" />
            <h3 className="text-lg font-semibold text-[var(--foreground)]">Available Balance</h3>
          </div>
          <button
            onClick={fetchBalance}
            disabled={loading}
            className={`vscode-button-secondary p-2 rounded-md ${loading ? 'animate-spin' : ''}`}
            aria-label="Refresh balance"
          >
            <ArrowPathIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Error State */}
        {!loading && error && (
          <div className="vscode-card bg-[var(--error)] bg-opacity-10 border-[var(--error)] border-opacity-30">
            <div className="flex items-center space-x-3">
              <ExclamationTriangleIcon className="w-5 h-5 text-[var(--error)]" />
              <div>
                <p className="font-medium text-sm text-[var(--error)]">Cannot load balance</p>
                <p className="text-xs text-[var(--error)] opacity-75">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Balance List */}
        {!loading && !error && balance && (
          <div className="space-y-2">
            {filteredBalanceList.length > 0 ? (
              <div className="vscode-card p-0">
                <table className="vscode-table">
                  <thead>
                    <tr>
                      <th className="text-left">Asset</th>
                      <th className="text-right">Available</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBalanceList.map((coin) => (
                      <tr key={coin.symbol}>
                        <td>
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-[var(--sidebar)] flex items-center justify-center text-sm font-semibold text-[var(--foreground)]">
                              {coin.icon}
                            </div>
                            <div>
                              <p className="font-semibold text-[var(--foreground)]">{coin.symbol}</p>
                              <p className="text-xs text-[var(--muted)]">{coin.name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="text-right">
                          <span className="font-mono text-[var(--foreground)]">
                            {formatAmount(coin.amount, coin.symbol)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="vscode-card text-center py-8">
                <p className="text-[var(--muted)]">No significant balance found.</p>
              </div>
            )}
          </div>
        )}
        {!loading && !error && !balance && (
          <div className="vscode-card text-center py-8">
            <p className="text-[var(--muted)]">No balance data available.</p>
          </div>
        )}
      </div>
    </LoadingOverlay>
  );
}