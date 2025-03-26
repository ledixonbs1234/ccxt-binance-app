// File: components/OrderForm.tsx
'use client';

import { useState, ChangeEvent, FormEvent, useEffect, useCallback } from 'react';
import { PencilSquareIcon, CheckCircleIcon, ExclamationCircleIcon, InformationCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { XCircleIcon } from '@heroicons/react/20/solid'; // Icon nhỏ hơn cho nút close notification

type Order = any;
// Thêm prop type
type OrderFormProps = {
  onSimulationStartSuccess: () => void; // Callback để báo cho parent
};
type FormData = {
  symbol: string; // Thêm symbol, ví dụ: 'BTC/USDT'
  type: 'market' | 'limit' | 'trailing-stop';
  side: 'buy' | 'sell';
  amount: number;
  price: number; // Dùng cho Limit và làm Giá tham chiếu cho Trailing Stop
  trailingPercent: number; // Đổi tên từ callback
};

type Notification = {
  message: string;
  type: 'success' | 'error';
  id: number;
};
// Hàm định dạng số lượng, giá
const formatNumberInput = (value: string | number): number => {
  if (typeof value === 'string') {
    return parseFloat(value) || 0;
  }
  return value;
};


export default function OrderForm({ onSimulationStartSuccess }: OrderFormProps) {
  const [orderResult, setOrderResult] = useState<Order | null>(null);
  const [simulationStatus, setSimulationStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [formData, setFormData] = useState<FormData>({
    symbol: 'BTC/USDT',
    type: 'market',
    side: 'buy',
    amount: 0,
    price: 0,
    trailingPercent: 1.0,
  });

  // Notification Handling (useCallback để tối ưu)
  const addNotification = useCallback((message: string, type: 'success' | 'error') => {
    const id = Date.now();
    setNotifications(prev => {
      // Giới hạn số lượng notification hiển thị cùng lúc (ví dụ: 3)
      const newNotifications = [...prev, { message, type, id }];
      return newNotifications.slice(-3);
    });
    // Tự động xóa sau 5 giây
    setTimeout(() => {
      removeNotification(id);
    }, 5000);
  }, []);

  const removeNotification = useCallback((id: number) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  // Input Change Handling
  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? formatNumberInput(value) : value,
    }));
  };

  // Auto switch side for Trailing Stop
  useEffect(() => {
    if (formData.type === 'trailing-stop' && formData.side !== 'sell') {
      setFormData(prev => ({ ...prev, side: 'sell' }));
    }
  }, [formData.type, formData.side]);


  const submitOrder = async (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError(null);
    setOrderResult(null);
    setSimulationStatus(null);

    // Xác định endpoint và payload cơ bản
    const isTrailingStop = formData.type === 'trailing-stop';
    const apiEndpoint = isTrailingStop ? '/api/simulate-trailing-stop' : '/api/order';
    let payload: any = {}; // Sử dụng any để linh hoạt hoặc tạo type cụ thể hơn
    let successMessagePrefix = '';

    try {
      // --- Validate Inputs ---
      if (!formData.symbol) throw new Error('Vui lòng nhập Symbol.');
      if (formData.amount <= 0) throw new Error('Số lượng phải lớn hơn 0.');

      // --- Logic riêng cho từng loại lệnh ---
      if (isTrailingStop) {
          // Validate trailing stop
          if (formData.side === 'buy') throw new Error('Trailing Stop chỉ hỗ trợ lệnh Bán (Stop Loss).');
          if (formData.price <= 0) throw new Error('Giá tham chiếu ban đầu phải lớn hơn 0.');
          if (formData.trailingPercent <= 0 || formData.trailingPercent > 10) throw new Error('Trailing Percent phải từ 0.1% đến 10%.');

          // Chuẩn bị payload và thông báo
          payload = {
            symbol: formData.symbol,
            quantity: formData.amount,
            trailingPercent: formData.trailingPercent,
            entryPrice: formData.price,
          };
          successMessagePrefix = `Bắt đầu theo dõi Trailing Stop Loss ${formData.trailingPercent}%`;

          // --- API Call ***CHỈ*** cho Trailing Stop ---
          console.log(`[${formData.symbol}] Sending request to ${apiEndpoint}`); // Log trước khi fetch
          const res = await fetch(apiEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          const data = await res.json();
          console.log(`[${formData.symbol}] Received response from ${apiEndpoint}`, data); // Log kết quả

          if (!res.ok) {
            throw new Error(data.message || data.error || `Lỗi ${res.status} từ API`);
          }

          // Xử lý thành công cho Trailing Stop
          onSimulationStartSuccess(); // Gọi callback
          setSimulationStatus(data.message || 'Yêu cầu đã được gửi.');
          const successMessage = `${successMessagePrefix} cho ${formData.amount} ${formData.symbol.split('/')[0]}.`;
          addNotification(successMessage, 'success');

      } else { // Market or Limit
          // Validate limit price
          if (formData.type === 'limit' && formData.price <= 0) throw new Error('Giá giới hạn phải lớn hơn 0.');

          // Chuẩn bị payload và thông báo
          payload = {
            symbol: formData.symbol,
            type: formData.type,
            side: formData.side,
            amount: formData.amount,
            price: formData.type === 'limit' ? formData.price : undefined,
          };
          const actionType = formData.side === 'buy' ? 'Mua' : 'Bán';
          const orderType = formData.type;
          successMessagePrefix = `${actionType} thành công (${orderType})`;

          // --- API Call ***CHỈ*** cho Market/Limit ---
          console.log(`[${formData.symbol}] Sending request to ${apiEndpoint}`); // Log trước khi fetch
          const res = await fetch(apiEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          const data = await res.json();
          console.log(`[${formData.symbol}] Received response from ${apiEndpoint}`, data); // Log kết quả

          if (!res.ok) {
            throw new Error(data.message || data.error || `Lỗi ${res.status} từ API`);
          }

          // Xử lý thành công cho Market/Limit
          setOrderResult(data);
          const successMessage = `${successMessagePrefix} cho ${formData.amount} ${formData.symbol.split('/')[0]}.`;
          addNotification(successMessage, 'success');
          // Có thể gọi callback refresh khác ở đây nếu cần cập nhật Balance/History ngay
      }

      // --- Logic chung sau khi một trong các lệnh gọi API thành công ---
      // Reset Form
      setFormData(prev => ({
        ...prev,
        amount: 0,
        price: (prev.type === 'limit' || prev.type === 'trailing-stop') ? 0 : prev.price,
      }));

    } catch (err: any) {
      console.error("Order submission error:", err);
      const errorMessage = err.message || 'Đã xảy ra lỗi không mong muốn.';
      setError(errorMessage);
      addNotification(`Lỗi đặt lệnh: ${errorMessage}`, 'error');
    } finally {
      setLoading(false);
    }
  };


  // Input/Select shared classes
  const inputBaseClasses = "block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed";
  const labelBaseClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";


  return (
    <div className="bg-white dark:bg-gray-800 p-5 md:p-6 rounded-lg shadow-md mb-6 border border-gray-200 dark:border-gray-700 relative">
      {/* Notifications */}
      <div className="fixed top-4 right-4 z-50 w-full max-w-xs space-y-2">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`relative flex items-start p-3 rounded-md shadow-lg text-sm ${notification.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/40 border border-green-200 dark:border-green-700/50 text-green-800 dark:text-green-200'
              : 'bg-red-50 dark:bg-red-900/40 border border-red-200 dark:border-red-700/50 text-red-800 dark:text-red-200'
              }`}
          >
            {notification.type === 'success' ? (
              <CheckCircleIcon className="h-5 w-5 mr-2 flex-shrink-0 text-green-500" aria-hidden="true" />
            ) : (
              <ExclamationCircleIcon className="h-5 w-5 mr-2 flex-shrink-0 text-red-500" aria-hidden="true" />
            )}
            <span className="flex-1">{notification.message}</span>
            <button
              onClick={() => removeNotification(notification.id)}
              className="ml-2 p-0.5 rounded-full text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-inset focus:ring-gray-500"
              aria-label="Đóng thông báo"
            >
              <XCircleIcon className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Header */}
      <h2 className="text-lg md:text-xl font-semibold text-gray-800 dark:text-gray-100 mb-5 flex items-center">
        <PencilSquareIcon className="w-5 h-5 md:w-6 md:h-6 mr-2 text-blue-600 dark:text-blue-400" />
        Đặt lệnh giao dịch
      </h2>

      <form onSubmit={submitOrder} className="space-y-4">
        {/* Symbol */}
        <div>
          <label htmlFor="symbol" className={labelBaseClasses}>Symbol:</label>
          <input
            type="text"
            id="symbol"
            name="symbol"
            value={formData.symbol}
            onChange={handleInputChange}
            required
            className={inputBaseClasses}
            placeholder="Ví dụ: BTC/USDT"
          />
        </div>

        {/* Order Type and Side */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="type" className={labelBaseClasses}>Loại lệnh:</label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              className={inputBaseClasses}
            >
              <option value="market">Market</option>
              <option value="limit">Limit</option>
              <option value="trailing-stop">Trailing Stop (Loss)</option>
            </select>
          </div>
          <div>
            <label htmlFor="side" className={labelBaseClasses}>Mua/Bán:</label>
            <select
              id="side"
              name="side"
              value={formData.side}
              onChange={handleInputChange}
              className={inputBaseClasses}
              disabled={formData.type === 'trailing-stop'} // Disable khi là trailing stop
            >
              <option value="buy">Mua</option>
              <option value="sell">Bán</option>
            </select>
            {formData.type === 'trailing-stop' && (
              <p className="mt-1 text-xs text-orange-600 dark:text-orange-400">
                Tự động chọn Bán cho Trailing Stop.
              </p>
            )}
          </div>
        </div>

        {/* Amount */}
        <div>
          <label htmlFor="amount" className={labelBaseClasses}>Số lượng ({formData.symbol.split('/')[0]}):</label>
          <input
            type="number"
            id="amount"
            name="amount"
            step="any" // Cho phép số thập phân linh hoạt
            min="0" // Không cho nhập số âm
            value={formData.amount} // Hiển thị rỗng nếu là 0
            onChange={handleInputChange}
            required
            className={inputBaseClasses}
            placeholder="0.0000"
          />
        </div>

        {/* Price (for Limit) */}
        {formData.type === 'limit' && (
          <div>
            <label htmlFor="price" className={labelBaseClasses}>Giá ({formData.symbol.split('/')[1]}):</label>
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price > 0 ? formData.price : ''}
              onChange={handleInputChange}
              required
              step="any"
              min="0"
              className={inputBaseClasses}
              placeholder="0.00"
            />
          </div>
        )}

        {/* Trailing Stop Fields */}
        {formData.type === 'trailing-stop' && (
          <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4">
            {/* Entry Price / Initial Reference Price */}
            <div>
              <label htmlFor="ts-price" className={labelBaseClasses}>Giá tham chiếu ban đầu ({formData.symbol.split('/')[1]}):</label>
              <input
                type="number"
                id="ts-price"
                name="price" // Vẫn dùng name="price"
                value={formData.price > 0 ? formData.price : ''}
                onChange={handleInputChange}
                required
                step="any"
                className={inputBaseClasses}
                placeholder="Giá mua vào hoặc giá bắt đầu theo dõi"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Giá cao nhất sẽ được tính từ mức này.
              </p>
            </div>

            {/* Trailing Percent */}
            <div>
              <label htmlFor="trailingPercent" className={labelBaseClasses}>Trailing Percent (%):</label>
              <input
                type="number"
                id="trailingPercent"
                name="trailingPercent"
                value={formData.trailingPercent > 0 ? formData.trailingPercent : ''}
                onChange={handleInputChange}
                required
                step="0.1"
                min="0.1"
                max="10"
                className={inputBaseClasses}
                placeholder="1.0"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Khoảng cách % từ giá cao nhất để kích hoạt Stop Loss (0.1% - 10%).
              </p>
              {/* Info Box */}
              <div className="mt-3 text-xs text-blue-700 dark:text-blue-300 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-md border border-blue-200 dark:border-blue-800/50">
                <p className="font-medium flex items-center"><InformationCircleIcon className="w-4 h-4 mr-1" />Trailing Stop Loss (Giả lập)</p>
                <p className="mt-1">Khi giá giảm <span className="font-semibold">{formData.trailingPercent || '___'}%</span> từ mức cao nhất (kể từ giá <span className="font-semibold">{formData.price > 0 ? formData.price : '___'}</span>), một lệnh <span className="font-semibold">Market Sell</span> sẽ tự động được đặt ở phía server.</p>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full flex justify-center items-center px-4 py-2.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors duration-150
                        ${formData.side === 'buy' && formData.type !== 'trailing-stop'
              ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
              : formData.side === 'sell' // Bao gồm cả trailing stop (vì nó là sell)
                ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                : 'bg-gray-600' // Fallback
            }
                        ${loading ? 'opacity-70 cursor-wait' : 'hover:opacity-90'}
                    `}
        >
          {loading && <ArrowPathIcon className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />}
          <span>
            {loading
              ? 'Đang xử lý...'
              : formData.type === 'trailing-stop'
                ? `Bắt đầu Trailing Stop ${formData.trailingPercent}%`
                : `${formData.side === 'buy' ? 'Mua' : 'Bán'} ${formData.symbol.split('/')[0]}`}
          </span>
        </button>
      </form>

      {/* Status/Result Display Area */}
      <div className="mt-5 space-y-3">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/30 text-red-700 dark:text-red-300 px-4 py-3 rounded-md flex items-center gap-3 text-sm">
            <ExclamationCircleIcon className="w-5 h-5" />
            <span className="font-medium">Lỗi:</span> {error}
          </div>
        )}
        {simulationStatus && !orderResult && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 text-blue-700 dark:text-blue-300 px-4 py-3 rounded-md flex items-center gap-3 text-sm">
            <InformationCircleIcon className="w-5 h-5" />
            <span>{simulationStatus}</span>
          </div>
        )}
        {orderResult && !simulationStatus && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700/50 text-green-800 dark:text-green-200 px-4 py-3 rounded-md text-sm">
            <h3 className="font-medium mb-2 flex items-center"><CheckCircleIcon className="w-5 h-5 mr-2" />Lệnh đã đặt thành công:</h3>
            <div className="bg-gray-50 dark:bg-gray-900 p-2 rounded max-h-40 overflow-y-auto text-xs">
              <pre className="whitespace-pre-wrap break-words">
                {JSON.stringify(orderResult, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}