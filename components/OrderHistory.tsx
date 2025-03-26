// File: components/OrderHistory.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { ListBulletIcon, ArrowPathIcon, XMarkIcon, BanknotesIcon, ExclamationTriangleIcon, InformationCircleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { XCircleIcon as XCircleSolid } from '@heroicons/react/20/solid'; // Nút close notification

type Order = {
  id: string;
  datetime: string;
  symbol: string;
  type: string;
  side: string;
  price: number;
  amount: number;
  cost: number;
  filled: number;
  status: string;
  fee: {
  currency: string;
  cost: number;
  } | null;
  currentPrice?: number;
  };
  
  type OrderHistoryProps = {
  currentPrice: number | null;
  onBalanceUpdate: () => void;
  };
  
type Notification = {
  message: string;
  type: 'success' | 'error' | 'info';
  id: number;
  };
// Helper để định dạng số
const formatNum = (num: number | undefined | null, digits = 8) => {
    if (num === undefined || num === null) return 'N/A';
    return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: digits });
};

// Helper để định dạng ngày giờ
const formatDateTime = (dateTimeString: string) => {
    try {
        return new Date(dateTimeString).toLocaleString();
    } catch {
        return dateTimeString; // Trả về chuỗi gốc nếu không parse được
    }
};


export default function OrderHistory({ currentPrice, onBalanceUpdate }: OrderHistoryProps) {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true); // Bắt đầu là true
    const [error, setError] = useState<string | null>(null);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [processingIds, setProcessingIds] = useState<Set<string>>(new Set()); // ID lệnh đang xử lý (hủy, bán)

     // --- Notification Handling ---
     const addNotification = useCallback((message: string, type: 'success' | 'error' | 'info') => {
        const id = Date.now();
        setNotifications(prev => [...prev, { message, type, id }].slice(-3)); // Giới hạn 3
        setTimeout(() => removeNotification(id), 5000);
    }, []);
    const removeNotification = useCallback((id: number) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);


    // --- Fetch Order History ---
    const fetchOrderHistory = useCallback(async (showLoading = true) => {
        if (showLoading) setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/order-history');
            if (!res.ok) {
                 const errData = await res.json().catch(() => ({}));
                 throw new Error(errData.message || 'Lỗi khi lấy lịch sử lệnh');
            }
            const data = await res.json();
            // Sắp xếp và chỉ lấy 10 lệnh gần nhất
            const sortedData = data.sort(
                (a: Order, b: Order) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime()
            );
            setOrders(sortedData.slice(0, 10));
        } catch (err: any) {
            console.error("Fetch history error:", err);
            setError(err.message);
            setOrders([]); // Xóa orders cũ nếu lỗi
        } finally {
            if (showLoading) setLoading(false);
        }
    }, []);


    // --- Cancel Order ---
    const cancelOrder = useCallback(async (orderId: string, symbol: string) => {
        if (processingIds.has(orderId)) return;

        setProcessingIds(prev => new Set(prev).add(orderId));
        try {
            addNotification(`Đang hủy lệnh ${orderId} (${symbol})...`, 'info');
            const res = await fetch(`/api/cancel-order`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId, symbol }), // Gửi cả symbol nếu API cần
            });
             const result = await res.json(); // Parse kết quả
            if (!res.ok) {
                throw new Error(result.message || `Lỗi khi hủy lệnh ${orderId}`);
            }
            addNotification(`Đã hủy lệnh ${orderId} (${symbol}) thành công`, 'success');
            await fetchOrderHistory(false); // Fetch lại không hiển thị loading
            onBalanceUpdate(); // Cập nhật số dư
        } catch (err: any) {
            console.error(`Cancel order ${orderId} error:`, err);
            setError(err.message); // Hiển thị lỗi chung
            addNotification(`Lỗi hủy lệnh ${orderId}: ${err.message}`, 'error');
        } finally {
            setProcessingIds(prev => {
                const updatedSet = new Set(prev);
                updatedSet.delete(orderId);
                return updatedSet;
            });
        }
    }, [processingIds, fetchOrderHistory, onBalanceUpdate, addNotification]);


    // --- Sell Position (Market Order) ---
     const sellPosition = useCallback(async (order: Order) => {
        if (processingIds.has(order.id)) return; // Dùng ID lệnh mua gốc làm key tạm thời

        setProcessingIds(prev => new Set(prev).add(order.id));
         try {
            addNotification(`Đang bán ${order.amount} ${order.symbol.split('/')[0]}...`, 'info');
             const res = await fetch('/api/order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    symbol: order.symbol,
                    type: 'market',
                    side: 'sell',
                    amount: order.filled, // Bán số lượng đã khớp thực tế
                }),
            });
             const result = await res.json();
             if (!res.ok) {
                 throw new Error(result.message || result.error || 'Lỗi khi đặt lệnh bán');
             }
             addNotification(`Đã bán ${order.filled} ${order.symbol.split('/')[0]} thành công`, 'success');
             await fetchOrderHistory(false);
             onBalanceUpdate();
         } catch (err: any) {
             console.error(`Sell position from order ${order.id} error:`, err);
             setError(err.message);
             addNotification(`Lỗi khi bán từ lệnh ${order.id}: ${err.message}`, 'error');
         } finally {
             setProcessingIds(prev => {
                const updatedSet = new Set(prev);
                updatedSet.delete(order.id);
                return updatedSet;
            });
         }
     }, [processingIds, fetchOrderHistory, onBalanceUpdate, addNotification]);


    useEffect(() => {
        fetchOrderHistory(true); // Fetch lần đầu
        // Không cần interval ở đây, dùng nút refresh
    }, [fetchOrderHistory]);


     // --- Render Helper for Status Badge ---
    const renderStatusBadge = (status: string) => {
        let bgColor = 'bg-gray-100 dark:bg-gray-700';
        let textColor = 'text-gray-600 dark:text-gray-300';
        let dotColor = 'bg-gray-400';

        switch (status?.toLowerCase()) {
            case 'open':
                bgColor = 'bg-blue-50 dark:bg-blue-900/30';
                textColor = 'text-blue-700 dark:text-blue-300';
                dotColor = 'bg-blue-500 animate-pulse'; // Nhấp nháy cho lệnh mở
                break;
            case 'closed':
            case 'filled': // Coi filled như closed
                bgColor = 'bg-green-50 dark:bg-green-900/30';
                textColor = 'text-green-700 dark:text-green-300';
                dotColor = 'bg-green-500';
                break;
            case 'canceled':
            case 'cancelled': // Bắt cả 2 kiểu viết
                bgColor = 'bg-yellow-50 dark:bg-yellow-900/30';
                textColor = 'text-yellow-700 dark:text-yellow-400';
                dotColor = 'bg-yellow-500';
                break;
            case 'rejected':
            case 'expired':
                bgColor = 'bg-red-50 dark:bg-red-900/30';
                textColor = 'text-red-700 dark:text-red-300';
                dotColor = 'bg-red-500';
                break;
        }
         return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
                <svg className={`-ml-0.5 mr-1.5 h-2 w-2 ${dotColor}`} fill="currentColor" viewBox="0 0 8 8">
                    <circle cx={4} cy={4} r={3} />
                </svg>
                {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'N/A'}
            </span>
        );
    };

    // --- Render Helper for P/L Percentage ---
    const renderPLPercentage = (order: Order) => {
         if (order.side !== 'buy' || order.status !== 'closed' || !currentPrice || order.price <= 0) {
             return <span className="text-gray-500 dark:text-gray-400">N/A</span>;
         }
        const pl = ((currentPrice - order.price) / order.price) * 100;
        const colorClass = pl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
        return <span className={`${colorClass} font-medium`}>{pl.toFixed(2)}%</span>;
    };


    return (
        <div className="bg-white dark:bg-gray-800 p-5 md:p-6 rounded-lg shadow-md mb-6 border border-gray-200 dark:border-gray-700">
             {/* Notifications */}
             <div className="fixed top-4 right-4 z-50 w-full max-w-xs space-y-2">
                 {notifications.map((n) => (
                    <div key={n.id} className={`relative flex items-start p-3 rounded-md shadow-lg text-sm ${
                        n.type === 'success' ? 'bg-green-50 dark:bg-green-900/40 border border-green-200 dark:border-green-700/50 text-green-800 dark:text-green-200' :
                        n.type === 'error' ? 'bg-red-50 dark:bg-red-900/40 border border-red-200 dark:border-red-700/50 text-red-800 dark:text-red-200' :
                        'bg-blue-50 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-800/50 text-blue-800 dark:text-blue-300' // info
                    }`}>
                         {n.type === 'success' ? <CheckCircleIcon className="h-5 w-5 mr-2 flex-shrink-0 text-green-500" /> :
                          n.type === 'error' ? <ExclamationTriangleIcon className="h-5 w-5 mr-2 flex-shrink-0 text-red-500" /> :
                          <InformationCircleIcon className="h-5 w-5 mr-2 flex-shrink-0 text-blue-500" />}
                         <span className="flex-1">{n.message}</span>
                         <button onClick={() => removeNotification(n.id)} className="ml-2 p-0.5 rounded-full text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-inset focus:ring-gray-500" aria-label="Đóng">
                             <XCircleSolid className="h-4 w-4" />
                         </button>
                    </div>
                 ))}
             </div>

            {/* Header */}
            <div className="flex flex-wrap justify-between items-center gap-3 mb-5">
                <h2 className="text-lg md:text-xl font-semibold text-gray-800 dark:text-gray-100 flex items-center">
                    <ListBulletIcon className="w-5 h-5 md:w-6 md:h-6 mr-2 text-indigo-600 dark:text-indigo-400" />
                    Lịch sử 10 lệnh gần nhất
                </h2>
                <button
                    onClick={() => fetchOrderHistory(true)}
                    disabled={loading}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 shadow-sm text-xs font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 disabled:opacity-50"
                >
                     <ArrowPathIcon className={`w-4 h-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
                     Làm mới
                </button>
            </div>

            {/* Loading State */}
            {loading && (
                 <div className="space-y-2 animate-pulse mt-4">
                     {[...Array(3)].map((_, i) => (
                         <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
                     ))}
                 </div>
            )}

            {/* Error State */}
            {!loading && error && (
                <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/30 text-red-700 dark:text-red-300 px-4 py-3 rounded-md flex items-center gap-3 text-sm">
                    <ExclamationTriangleIcon className="w-5 h-5" />
                    <div><span className="font-medium">Lỗi tải lịch sử:</span> {error}</div>
                </div>
            )}

            {/* Order Table */}
            {!loading && !error && orders.length > 0 && (
                <div className="overflow-x-auto -mx-5 md:-mx-6"> {/* Kéo table ra sát viền card */}
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                {/* Giảm bớt cột hoặc dùng tooltip cho ID */}
                                {/* <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">ID</th> */}
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Thời gian</th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cặp</th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Loại</th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Giá</th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Số lượng</th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Trạng thái</th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">+/- Hiện tại</th>
                                <th scope="col" className="relative px-4 py-3"><span className="sr-only">Hành động</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {orders.map((order) => {
                                const isProcessing = processingIds.has(order.id);
                                const isBuy = order.side === 'buy';
                                const isSell = order.side === 'sell';
                                const isOpen = order.status === 'open';
                                const isClosedBuy = isBuy && order.status === 'closed';

                                return (
                                    <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 text-sm text-gray-700 dark:text-gray-300">
                                        {/* <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400 truncate" title={order.id}>{order.id.substring(0, 8)}...</td> */}
                                        <td className="px-4 py-3 whitespace-nowrap text-xs">{formatDateTime(order.datetime)}</td>
                                        <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900 dark:text-gray-100">{order.symbol}</td>
                                        <td className={`px-4 py-3 whitespace-nowrap capitalize ${isBuy ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                            {order.side} <span className="text-gray-500 dark:text-gray-400 text-xs">({order.type})</span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">{formatNum(order.price, 4)}</td>
                                        <td className="px-4 py-3 whitespace-nowrap">{formatNum(order.amount)} ({formatNum(order.filled)})</td>
                                        <td className="px-4 py-3 whitespace-nowrap">{renderStatusBadge(order.status)}</td>
                                        <td className="px-4 py-3 whitespace-nowrap">{renderPLPercentage(order)}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end space-x-2">
                                                {isOpen && (
                                                    <button
                                                        onClick={() => cancelOrder(order.id, order.symbol)}
                                                        disabled={isProcessing}
                                                        className="inline-flex items-center p-1.5 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-md shadow-sm bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/30 focus:outline-none focus:ring-1 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        title="Hủy lệnh"
                                                    >
                                                        {isProcessing ? <ArrowPathIcon className="h-4 w-4 animate-spin"/> : <XMarkIcon className="h-4 w-4" />}
                                                    </button>
                                                )}
                                                 {isClosedBuy && (
                                                    <button
                                                        onClick={() => sellPosition(order)}
                                                        disabled={isProcessing}
                                                        className="inline-flex items-center p-1.5 border border-green-300 dark:border-green-700 text-green-600 dark:text-green-400 rounded-md shadow-sm bg-white dark:bg-gray-800 hover:bg-green-50 dark:hover:bg-green-900/30 focus:outline-none focus:ring-1 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        title={`Bán ${order.filled} ${order.symbol.split('/')[0]} theo giá thị trường`}
                                                    >
                                                         {isProcessing ? <ArrowPathIcon className="h-4 w-4 animate-spin"/> : <BanknotesIcon className="h-4 w-4" />}
                                                    </button>
                                                )}
                                                 {/* Nút xem chi tiết nếu cần */}
                                                {/* <button className="text-blue-600 hover:text-blue-800"><InformationCircleIcon className="h-4 w-4"/></button> */}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                 </div>
            )}

             {/* Empty State */}
            {!loading && !error && orders.length === 0 && (
                <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-6">
                     Không có lệnh nào trong lịch sử gần đây.
                 </p>
            )}
        </div>
    );
}