// File: components/BalanceDisplay.tsx
'use client';

import { useEffect, useState, useCallback } from "react";
import { ArrowPathIcon, WalletIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'; // Sử dụng heroicons cho icon

type Balance = {
  free?: Record<string, number>;
  total?: Record<string, number>;
  [key: string]: any;
};

// Định nghĩa thông tin cơ bản và icon cho các coin phổ biến
const COIN_INFO: Record<string, { name: string; icon: string }> = {
  BTC: { name: "Bitcoin", icon: "₿" }, // Sử dụng ký tự hoặc SVG/ảnh
  USDT: { name: "Tether", icon: "₮" },
  ETH: { name: "Ethereum", icon: "Ξ" },
  BNB: { name: "Binance Coin", icon: "🔶" }, // Thêm coin khác nếu muốn
  // Thêm các coin khác nếu API trả về
};

// Định dạng số với độ chính xác phù hợp
const formatAmount = (amount: number, coin: string): string => {
    const options: Intl.NumberFormatOptions = {
        maximumFractionDigits: coin === 'USDT' ? 2 : 8, // USDT thường có 2 số lẻ, crypto khác nhiều hơn
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
    <div className="bg-white dark:bg-gray-800 p-5 md:p-6 rounded-lg shadow-md mb-6 border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg md:text-xl font-semibold text-gray-800 dark:text-gray-100 flex items-center">
          <WalletIcon className="w-5 h-5 md:w-6 md:h-6 mr-2 text-blue-600 dark:text-blue-400" />
          Số dư khả dụng
        </h2>
        <button
          onClick={fetchBalance}
          disabled={loading}
          className={`p-1.5 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-colors duration-150 ${loading ? 'cursor-not-allowed animate-spin' : ''}`}
          aria-label="Làm mới số dư"
        >
          <ArrowPathIcon className="w-4 h-4 md:w-5 md:h-5" />
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="space-y-3 animate-pulse mt-4">
          {[...Array(3)].map((_, i) => ( // Skeleton cho 3 dòng
            <div key={i} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                <div className="space-y-1.5">
                  <div className="h-3 w-12 rounded bg-gray-300 dark:bg-gray-600"></div>
                  <div className="h-2 w-16 rounded bg-gray-300 dark:bg-gray-600"></div>
                </div>
              </div>
              <div className="h-4 w-20 rounded bg-gray-300 dark:bg-gray-600"></div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/30 text-red-700 dark:text-red-300 px-4 py-3 rounded-md flex items-center gap-3">
          <ExclamationTriangleIcon className="w-5 h-5" />
          <div>
             <p className="font-medium text-sm">Không thể tải số dư</p>
             <p className="text-xs">{error}</p>
          </div>
        </div>
      )}

      {/* Balance List */}
      {!loading && !error && balance && (
        <div className="mt-2 flow-root">
          {filteredBalanceList.length > 0 ? (
            <ul role="list" className="-my-3 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredBalanceList.map((coin) => (
                <li key={coin.symbol} className="flex items-center justify-between py-3">
                  {/* Coin Info */}
                  <div className="flex items-center min-w-0 gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-sm font-semibold text-gray-600 dark:text-gray-300 overflow-hidden">
                      {/* Ưu tiên icon dạng ảnh/svg nếu có, fallback về text */}
                      {coin.icon.length > 1 ? coin.icon : <span className="text-base">{coin.icon}</span>}
                      {/* Ví dụ nếu dùng ảnh: <img src={`/icons/${coin.symbol.toLowerCase()}.png`} alt={coin.symbol} className="w-full h-full object-cover" /> */}
                    </div>
                    <div className="min-w-0 flex-auto">
                      <p className="text-sm font-semibold leading-tight text-gray-900 dark:text-gray-100">
                        {coin.symbol}
                      </p>
                      <p className="text-xs leading-tight text-gray-500 dark:text-gray-400 truncate">
                        {coin.name}
                      </p>
                    </div>
                  </div>
                  {/* Balance Amount */}
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 ml-4 flex-shrink-0">
                    {formatAmount(coin.amount, coin.symbol)}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-4">
              Không có số dư nào đáng kể.
            </p>
          )}
        </div>
      )}
        {!loading && !error && !balance && (
             <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-4">
              Không có dữ liệu số dư.
            </p>
        )}
    </div>
  );
}