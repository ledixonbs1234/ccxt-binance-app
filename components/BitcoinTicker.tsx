// File: components/BitcoinTicker.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { CurrencyDollarIcon, ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

type BitcoinTickerProps = {
    onPriceChange: (price: number) => void;
};

// Định dạng giá (giữ nguyên)
const formatPrice = (price: number | null): string => {
    if (price === null) return '---.--';
    return price.toLocaleString('en-US', { // Sử dụng 'en-US' cho định dạng USD chuẩn
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
};

export default function BitcoinTicker({ onPriceChange }: BitcoinTickerProps) {
    const [price, setPrice] = useState<number | null>(null);
    // Phân biệt loading ban đầu và loading refresh
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false); // Chỉ cho refresh thủ công
    const [error, setError] = useState<string | null>(null);
    const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);

    const fetchTicker = useCallback(async (isManualRefresh = false) => {
        // Chỉ set isRefreshing khi là refresh thủ công
        if (isManualRefresh) {
            setIsRefreshing(true);
        }
        // Không set loading=true cho interval updates

        // Luôn xóa lỗi cũ trước khi fetch
        setError(null);

        try {
            const res = await fetch('/api/ticker');
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || 'Lỗi khi lấy giá BTC');
            }
            const data = await res.json();
            const newPrice = data.last;

            if (typeof newPrice === 'number') {
                 // Chỉ cập nhật state và gọi callback nếu giá thực sự thay đổi
                 // (Sử dụng closure để so sánh với giá trị state hiện tại)
                 setPrice(currentPrice => {
                     if (newPrice !== currentPrice) {
                         onPriceChange(newPrice); // Gọi callback khi giá thay đổi
                         setLastUpdateTime(new Date()); // Cập nhật thời gian khi có giá mới
                         return newPrice;
                     }
                     return currentPrice; // Giữ nguyên giá nếu không đổi
                 });
                 // setError(null); // Xóa lỗi nếu thành công (đã làm ở đầu hàm)
            } else {
                // Nếu API trả về không phải số, coi như lỗi nhẹ
                console.warn("Received non-numeric price data:", data);
                // Không ném lỗi nhưng có thể hiển thị cảnh báo nhẹ nếu muốn
                 setError("Dữ liệu giá không hợp lệ.");
            }

        } catch (err: any) {
            console.error("Fetch ticker error:", err);
            setError(err.message);
            // Quan trọng: Không set price = null ở đây để giữ giá trị cũ hiển thị
        } finally {
            // Tắt loading ban đầu sau lần fetch đầu tiên (thành công hay thất bại)
            if (isInitialLoading) {
                setIsInitialLoading(false);
            }
            // Tắt loading refresh chỉ khi là refresh thủ công
            if (isManualRefresh) {
                setIsRefreshing(false);
            }
        }
    }, [onPriceChange, isInitialLoading]); // Thêm isInitialLoading để nó biết khi nào cần tắt loading ban đầu

    useEffect(() => {
        fetchTicker(); // Fetch lần đầu (không đánh dấu là manual refresh)
        const interval = setInterval(() => fetchTicker(false), 10000); // Cập nhật mỗi 10 giây
        return () => clearInterval(interval);
    }, []); // Chỉ phụ thuộc vào fetchTicker (đã ổn định với useCallback)

    const displayPrice = price !== null ? formatPrice(price) : '---.--';
    const priceColor = error
        ? 'text-gray-500 dark:text-gray-400' // Màu nhạt hơn khi có lỗi (giá có thể cũ)
        : 'text-gray-900 dark:text-gray-50'; // Màu bình thường

    return (
        <div className="bg-white dark:bg-gray-800 p-5 md:p-6 rounded-lg shadow-md mb-6 border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-start mb-2">
                <h2 className="text-lg md:text-xl font-semibold text-gray-800 dark:text-gray-100 flex items-center">
                    <CurrencyDollarIcon className="w-5 h-5 md:w-6 md:h-6 mr-2 text-yellow-500 dark:text-yellow-400" />
                    Giá Bitcoin (BTC/USDT)
                </h2>
                 <button
                  onClick={() => fetchTicker(true)} // Đánh dấu là manual refresh
                  disabled={isRefreshing} // Disable khi đang refresh thủ công
                  className={`p-1.5 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-colors duration-150 ${isRefreshing ? 'cursor-not-allowed' : ''}`}
                  aria-label="Làm mới giá"
                >
                  {/* Icon quay khi đang refresh thủ công */}
                  <ArrowPathIcon className={`w-4 h-4 md:w-5 md:h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Chỉ hiển thị Skeleton khi đang loading ban đầu và chưa có giá */}
            {isInitialLoading && price === null && (
                 <div className="animate-pulse">
                    <div className="h-8 w-40 bg-gray-300 dark:bg-gray-600 rounded-md mt-1 mb-2"></div>
                    <div className="h-3 w-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
                 </div>
            )}

            {/* Hiển thị giá (luôn hiển thị nếu đã có giá, kể cả khi đang refresh hoặc lỗi) */}
            {/* Chỉ ẩn khi đang loading ban đầu */}
            {!isInitialLoading && (
                <div className="mt-1">
                    <p className={`text-2xl md:text-3xl font-bold ${priceColor}`}>
                        {displayPrice}
                    </p>
                     {lastUpdateTime && !error && (
                         <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                             Cập nhật lúc: {lastUpdateTime.toLocaleTimeString()}
                         </p>
                    )}
                    {/* Hiển thị lỗi KÈM THEO giá (nếu có) */}
                    {error && (
                         <div className="mt-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/30 text-red-700 dark:text-red-300 px-3 py-2 rounded-md flex items-center gap-2 text-sm">
                            <ExclamationTriangleIcon className="w-4 h-4 flex-shrink-0" />
                            <span>Lỗi: {error} (Giá hiển thị có thể đã cũ)</span>
                        </div>
                    )}
                     {!error && price === null && !isInitialLoading && ( // Trường hợp fetch xong nhưng ko có data và ko lỗi
                        <p className="text-gray-500 dark:text-gray-400 mt-2">Không có dữ liệu giá.</p>
                     )}
                </div>
            )}
        </div>
    );
}