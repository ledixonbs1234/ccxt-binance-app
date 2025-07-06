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
            <WalletIcon className="w-5 h-5 text-accent" />
            <h3 className="text-lg font-semibold text-foreground">Số dư khả dụng</h3>
          </div>
          <button
            onClick={fetchBalance}
            disabled={loading}
            className={`px-3 py-1.5 text-sm font-medium rounded-button bg-secondary-bg text-foreground border border-border hover:bg-hover transition-colors ${loading ? 'animate-spin' : ''}`}
            aria-label="Refresh balance"
          >
            <ArrowPathIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Error State */}
        {!loading && error && (
          <div className="notification notification-error">
            <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0" />
            <div>
              <p className="font-medium text-sm">Cannot load balance</p>
              <p className="text-xs opacity-75">{error}</p>
            </div>
          </div>
        )}

        {/* Balance List */}
        {!loading && !error && balance && (
          <div className="space-y-2">
            {filteredBalanceList.length > 0 ? (
              <div className="bg-card border border-border rounded-card p-0 shadow-custom">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-4 text-sm font-medium text-muted">Tài sản</th>
                      <th className="text-right p-4 text-sm font-medium text-muted">Khả dụng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBalanceList.map((coin) => (
                      <tr key={coin.symbol} className="border-b border-border last:border-b-0 hover:bg-hover transition-colors">
                        <td className="p-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-secondary-bg flex items-center justify-center text-sm font-semibold text-foreground">
                              {coin.icon}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-foreground">{coin.symbol}</p>
                              <p className="text-xs text-muted truncate">{coin.name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="text-right p-4">
                          <span className="font-mono text-foreground">
                            {formatAmount(coin.amount, coin.symbol)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-card border border-border rounded-card p-8 text-center shadow-custom">
                <p className="text-muted">Không tìm thấy số dư đáng kể.</p>
              </div>
            )}
          </div>
        )}
        {!loading && !error && !balance && (
          <div className="bg-card border border-border rounded-card p-8 text-center shadow-custom">
            <p className="text-muted">Không có dữ liệu số dư.</p>
          </div>
        )}
      </div>
    </LoadingOverlay>
  );
}