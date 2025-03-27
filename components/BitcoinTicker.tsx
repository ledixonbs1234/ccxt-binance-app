// File: components/BitcoinTicker.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { CurrencyDollarIcon, ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

type BitcoinTickerProps = {
    onPriceChange: (price: number) => void;
};

const formatPrice = (price: number | null): string => {
    if (price === null) return '---.--';
    return price.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
};

export default function BitcoinTicker({ onPriceChange }: BitcoinTickerProps) {
    const [price, setPrice] = useState<number | null>(null);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);

    // SỬA LẠI: Chỉ phụ thuộc vào onPriceChange (ổn định từ parent)
    const fetchTicker = useCallback(async (isManualRefresh = false) => {
        if (isManualRefresh) {
            setIsRefreshing(true);
        }
        // Không set isInitialLoading = true ở đây nữa
        setError(null); // Luôn xóa lỗi cũ

        try {
            const res = await fetch('/api/ticker');
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || 'Lỗi khi lấy giá BTC');
            }
            const data = await res.json();
            const newPrice = data.last;

            if (typeof newPrice === 'number') {
                 // Sử dụng functional update để đảm bảo state luôn mới nhất
                 setPrice(currentPrice => {
                     if (newPrice !== currentPrice) {
                         console.log(`BitcoinTicker: Price changed ${currentPrice} -> ${newPrice}, calling onPriceChange`);
                         onPriceChange(newPrice); // Gọi callback khi giá thay đổi
                         setLastUpdateTime(new Date());
                         return newPrice; // Cập nhật state
                     }
                     return currentPrice; // Giữ nguyên state nếu giá không đổi
                 });
            } else {
                console.warn("Received non-numeric price data:", data);
                setError("Dữ liệu giá không hợp lệ.");
            }

        } catch (err: any) {
            console.error("Fetch ticker error:", err);
            setError(err.message);
        } finally {
            // Chỉ isInitialLoading mới được set ở đây, và chỉ một lần
             // Dùng functional update để đảm bảo chỉ set false một lần
             setIsInitialLoading(currentLoading => {
                 if (currentLoading) { // Chỉ thay đổi nếu đang là true
                     return false;
                 }
                 return currentLoading; // Giữ nguyên false nếu đã là false
             });

            if (isManualRefresh) {
                setIsRefreshing(false);
            }
        }
    // SỬA LẠI: Bỏ isInitialLoading khỏi dependency array
    }, [onPriceChange]);

    // SỬA LẠI: useEffect chỉ chạy MỘT LẦN khi mount
    useEffect(() => {
        console.log("BitcoinTicker: Mounting and setting up interval.");
        // Gọi fetchTicker lần đầu
        fetchTicker(); // Không cần (true) vì isInitialLoading mặc định là true

        // Thiết lập interval
        const interval = setInterval(() => {
            console.log("BitcoinTicker: Interval tick, fetching ticker.");
            fetchTicker(false); // Gọi fetch không đánh dấu là manual refresh
        }, 10000); // Cập nhật mỗi 10 giây

        // Cleanup function
        return () => {
            console.log("BitcoinTicker: Unmounting and clearing interval.");
            clearInterval(interval);
        };
    // SỬA LẠI: Mảng dependency rỗng để đảm bảo chỉ chạy khi mount/unmount
    }, [fetchTicker]); // Chỉ phụ thuộc vào fetchTicker (đã ổn định)

    // ... (phần JSX render giữ nguyên như trước) ...
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