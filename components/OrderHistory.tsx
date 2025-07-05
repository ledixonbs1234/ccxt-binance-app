// File: components/OrderHistory.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { ListBulletIcon, ArrowPathIcon, XMarkIcon, BanknotesIcon, ExclamationTriangleIcon, InformationCircleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { XCircleIcon as XCircleSolid } from '@heroicons/react/20/solid';
import { generateUniqueId } from '../lib/utils';
import VSCodeCard from './VSCodeCard';

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
    return dateTimeString;
  }
};

export default function OrderHistory({ currentPrice, onBalanceUpdate }: OrderHistoryProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  // --- Notification Handling ---
  const addNotification = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    const id = generateUniqueId();
    setNotifications(prev => [...prev, { message, type, id }].slice(-3));
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
      setOrders([]);
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
        body: JSON.stringify({ orderId, symbol }),
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || `Lỗi khi hủy lệnh ${orderId}`);
      }
      addNotification(`Đã hủy lệnh ${orderId} (${symbol}) thành công`, 'success');
      await fetchOrderHistory(false);
      onBalanceUpdate();
    } catch (err: any) {
      console.error(`Cancel order ${orderId} error:`, err);
      setError(err.message);
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
    if (processingIds.has(order.id)) return;

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
          amount: order.filled,
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
    fetchOrderHistory(true);
  }, [fetchOrderHistory]);

  // --- Render Helper for Status Badge ---
  const renderStatusBadge = (status: string) => {
    let colorClass = 'badge-muted';
    let dotClass = 'badge-dot';

    switch (status?.toLowerCase()) {
      case 'open':
        colorClass = 'badge-info';
        dotClass = 'badge-dot animate-pulse';
        break;
      case 'closed':
      case 'filled':
        colorClass = 'badge-success';
        dotClass = 'badge-dot';
        break;
      case 'canceled':
      case 'cancelled':
        colorClass = 'badge-warning';
        dotClass = 'badge-dot';
        break;
      case 'rejected':
      case 'expired':
        colorClass = 'badge-error';
        dotClass = 'badge-dot';
        break;
    }

    return (
      <span className={`badge ${colorClass}`}>
        <span className={dotClass}></span>
        {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'N/A'}
      </span>
    );
  };

  // --- Render Helper for P/L Percentage ---
  const renderPLPercentage = (order: Order) => {
    if (order.side !== 'buy' || order.status !== 'closed' || !currentPrice || order.price <= 0) {
      return <span className="text-muted">N/A</span>;
    }
    const pl = ((currentPrice - order.price) / order.price) * 100;
    const colorClass = pl >= 0 ? 'text-success' : 'text-error';
    return <span className={`${colorClass} font-medium`}>{pl.toFixed(2)}%</span>;
  };

  return (
    <div className="space-y-4">
      {/* Notifications */}
      <div className="fixed top-4 right-4 z-50 w-full max-w-xs space-y-2">
        {notifications.map((n) => (
          <div key={n.id} className={`notification ${
            n.type === 'success' ? 'notification-success' :
            n.type === 'error' ? 'notification-error' :
            'notification-info'
          }`}>
            {n.type === 'success' ? <CheckCircleIcon className="h-5 w-5 mr-2 flex-shrink-0" /> :
             n.type === 'error' ? <ExclamationTriangleIcon className="h-5 w-5 mr-2 flex-shrink-0" /> :
             <InformationCircleIcon className="h-5 w-5 mr-2 flex-shrink-0" />}
            <span className="flex-1">{n.message}</span>
            <button 
              onClick={() => removeNotification(n.id)} 
              className="ml-2 p-0.5 rounded-full text-muted hover:text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
              aria-label="Đóng"
            >
              <XCircleSolid className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <VSCodeCard>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <ListBulletIcon className="w-5 h-5 text-accent" />
            Lịch sử 10 lệnh gần nhất
          </h2>
          <button
            onClick={() => fetchOrderHistory(true)}
            disabled={loading}
            className="btn btn-secondary btn-sm"
          >
            <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="space-y-2 animate-pulse">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-10 bg-panel rounded-md"></div>
            ))}
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="panel-error">
            <ExclamationTriangleIcon className="w-5 h-5 mr-2 text-error" />
            <div>
              <span className="font-medium">Lỗi tải lịch sử:</span> {error}
            </div>
          </div>
        )}

        {/* Order Table */}
        {!loading && !error && orders.length > 0 && (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Thời gian</th>
                  <th>Cặp</th>
                  <th>Loại</th>
                  <th>Giá</th>
                  <th>Số lượng</th>
                  <th>Trạng thái</th>
                  <th>+/- Hiện tại</th>
                  <th className="text-right">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const isProcessing = processingIds.has(order.id);
                  const isBuy = order.side === 'buy';
                  const isOpen = order.status === 'open';
                  const isClosedBuy = isBuy && order.status === 'closed';

                  return (
                    <tr key={order.id}>
                      <td className="text-sm text-muted">{formatDateTime(order.datetime)}</td>
                      <td className="font-medium">{order.symbol}</td>
                      <td className={`capitalize ${isBuy ? 'text-success' : 'text-error'}`}>
                        {order.side} <span className="text-muted text-xs">({order.type})</span>
                      </td>
                      <td>{formatNum(order.price, 4)}</td>
                      <td>{formatNum(order.amount)} ({formatNum(order.filled)})</td>
                      <td>{renderStatusBadge(order.status)}</td>
                      <td>{renderPLPercentage(order)}</td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isOpen && (
                            <button
                              onClick={() => cancelOrder(order.id, order.symbol)}
                              disabled={isProcessing}
                              className="btn btn-sm btn-error"
                              title="Hủy lệnh"
                            >
                              {isProcessing ? 
                                <ArrowPathIcon className="h-4 w-4 animate-spin" /> : 
                                <XMarkIcon className="h-4 w-4" />
                              }
                            </button>
                          )}
                          {isClosedBuy && (
                            <button
                              onClick={() => sellPosition(order)}
                              disabled={isProcessing}
                              className="btn btn-sm btn-success"
                              title={`Bán ${order.filled} ${order.symbol.split('/')[0]} theo giá thị trường`}
                            >
                              {isProcessing ? 
                                <ArrowPathIcon className="h-4 w-4 animate-spin" /> : 
                                <BanknotesIcon className="h-4 w-4" />
                              }
                            </button>
                          )}
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
          <div className="text-center py-8 text-muted">
            Không có lệnh nào trong lịch sử gần đây.
          </div>
        )}
      </VSCodeCard>
    </div>
  );
}