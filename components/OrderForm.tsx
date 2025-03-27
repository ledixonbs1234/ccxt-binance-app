// File: components/OrderForm.tsx
'use client';

import { useState, ChangeEvent, FormEvent, useEffect, useCallback } from 'react';
import { PencilSquareIcon, CheckCircleIcon, ExclamationCircleIcon, InformationCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { XCircleIcon } from '@heroicons/react/20/solid'; // Icon nhỏ hơn cho nút close notification

type Order = any;
// Thêm prop type
// Cập nhật prop type
type OrderFormProps = {
  onSimulationStartSuccess: () => void; // Callback khi bắt đầu TS
  onOrderSuccess: () => void; // Callback khi Market/Limit thành công
};
type FormData = {
  symbol: string;
  type: 'market' | 'limit' | 'trailing-stop';
  side: 'buy' | 'sell';
  amount: string; // <-- Lưu dạng chuỗi
  price: string;  // <-- Lưu dạng chuỗi
  trailingPercent: string; // <-- Lưu dạng chuỗi
  useActivationPrice: boolean;
  activationPrice: string; // <-- Lưu dạng chuỗi
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


export default function OrderForm({ onSimulationStartSuccess, onOrderSuccess }: OrderFormProps) {
  const [orderResult, setOrderResult] = useState<Order | null>(null);
  const [simulationStatus, setSimulationStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [formData, setFormData] = useState<FormData>({
    symbol: 'BTC/USDT',
    type: 'market',
    side: 'buy',
    amount: '', // Bắt đầu rỗng
    price: '',
    trailingPercent: '1.0', // Có thể giữ giá trị mặc định
    useActivationPrice: false,
    activationPrice: '',
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

  // Input Change Handling (Xử lý thêm cho checkbox)
  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;

    // Chỉ kiểm tra ký tự số, dấu chấm, và đảm bảo chỉ có một dấu chấm
    const isValidNumberInput = (val: string) => {
      if (val === '') return true; // Cho phép rỗng
      // Regex: Cho phép số nguyên hoặc số thập phân (có thể bắt đầu bằng 0.)
      return /^(0|[1-9]\d*)(\.\d*)?$/.test(val) || /^0\.$/.test(val);
    }

    setFormData(prev => {
      let newValue = value;
      // Chỉ cho phép nhập số hợp lệ vào các trường number
      if (['amount', 'price', 'trailingPercent', 'activationPrice'].includes(name)) {
        if (!isValidNumberInput(value)) {
          newValue = prev[name as keyof FormData] as string; // Giữ giá trị cũ nếu nhập không hợp lệ
        }
      }

      return {
        ...prev,
        [name]: type === 'checkbox' ? checked : newValue,
      }
    });
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
    // *** PARSE GIÁ TRỊ TRƯỚC KHI GỬI API ***
    const amountNum = parseFloat(formData.amount) || 0;
    const priceNum = parseFloat(formData.price) || 0;
    const trailingPercentNum = parseFloat(formData.trailingPercent) || 0;
    const activationPriceNum = parseFloat(formData.activationPrice) || 0;

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
      if (amountNum <= 0) throw new Error('Số lượng phải lớn hơn 0.');

      // --- Logic riêng cho từng loại lệnh ---
      if (isTrailingStop) {
        // Validate trailing stop với giá trị number
        if (formData.side === 'buy') throw new Error('Trailing Stop chỉ hỗ trợ lệnh Bán (Stop Loss).');
        // Sử dụng priceNum (giá tham chiếu đã parse)
        if (priceNum <= 0) throw new Error('Giá tham chiếu ban đầu phải lớn hơn 0.');
        if (trailingPercentNum <= 0 || trailingPercentNum > 10) throw new Error('Trailing Percent phải từ 0.1% đến 10%.');
        if (formData.useActivationPrice && activationPriceNum <= 0) {
          throw new Error('Giá kích hoạt phải lớn hơn 0.');
        }
        payload = {
          symbol: formData.symbol,
          quantity: amountNum, // Dùng giá trị số
          trailingPercent: trailingPercentNum, // Dùng giá trị số
          entryPrice: priceNum, // Dùng giá trị số
          useActivationPrice: formData.useActivationPrice,
          activationPrice: formData.useActivationPrice ? activationPriceNum : undefined, // Dùng giá trị số
        };
        successMessagePrefix = `Bắt đầu theo dõi Trailing Stop Loss ${formData.trailingPercent}%`;
        if (formData.useActivationPrice) {
          successMessagePrefix += ` (kích hoạt tại ${formData.activationPrice})`;
        }
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

        // Chuẩn bị payload và thông báo
        payload = {
          symbol: formData.symbol,
          type: formData.type,
          side: formData.side,
          amount: amountNum, // Dùng giá trị số
          price: formData.type === 'limit' ? priceNum : undefined, // Dùng giá trị số
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
        // *** GỌI CALLBACK KHI MARKET/LIMIT THÀNH CÔNG ***
        onOrderSuccess(); // Thông báo cho parent để refresh Balance/History
      }

      // --- Logic chung sau khi một trong các lệnh gọi API thành công ---
      // Reset Form
      setFormData(prev => ({
        ...prev,
        amount: '', // Reset về chuỗi rỗng
        price: '',  // Reset về chuỗi rỗng
        activationPrice: '', // Reset về chuỗi rỗng
        // Giữ lại trailingPercent hoặc reset tùy ý
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
  // Thêm hàm định dạng giá tiền (ví dụ: USDT)
  const formatCurrency = (value: number | undefined | null, currency = 'USD', digits = 2) => {
    if (value === undefined || value === null || isNaN(value)) return '___';

    // Chuẩn hóa mã tiền tệ: Nếu là USDT hoặc các stablecoin tương tự, dùng USD
    let displayCurrency = currency.toUpperCase();
    if (['USDT', 'USDC', 'BUSD', 'TUSD', 'DAI'].includes(displayCurrency)) { // Có thể thêm các stablecoin khác
      displayCurrency = 'USD';
    }

    // Kiểm tra xem displayCurrency có phải là mã hợp lệ không (tùy chọn, phòng lỗi)
    // Bạn có thể thêm danh sách các mã hợp lệ nếu muốn kiểm tra kỹ hơn
    // const validIsoCodes = ['USD', 'EUR', 'JPY', 'VND', ...];
    // if (!validIsoCodes.includes(displayCurrency)) {
    //   console.warn(`Invalid currency code for formatting: ${currency}. Falling back to USD.`);
    //   displayCurrency = 'USD';
    // }

    try {
      return value.toLocaleString('en-US', { // Hoặc 'vi-VN' nếu muốn định dạng Việt Nam
        style: 'currency',
        currency: displayCurrency, // Sử dụng mã đã chuẩn hóa
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      });
    } catch (error) {
      // Nếu vẫn lỗi (ví dụ mã tiền tệ không được hỗ trợ bởi trình duyệt/hệ thống)
      console.error("Error formatting currency:", value, currency, error);
      // Fallback: Hiển thị số và mã gốc
      return `${value.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits })} ${currency}`;
    }
  };
  let trailingAmountDisplay = '___';
  let estimatedStopPriceDisplay = '___';
  const quoteCurrency = formData.symbol.split('/')[1]?.toUpperCase() || 'USD'; // Lấy và viết hoa, fallback về USD
  const priceNumForDisplay = parseFloat(formData.price) || 0;
  const trailingPercentNumForDisplay = parseFloat(formData.trailingPercent) || 0;
  const activationPriceNumForDisplay = parseFloat(formData.activationPrice) || 0;
  if (formData.type === 'trailing-stop' && priceNumForDisplay > 0 && trailingPercentNumForDisplay > 0) {
    // Dùng giá kích hoạt (nếu có và hợp lệ) để tính toán hiển thị
    const refPrice = formData.useActivationPrice && activationPriceNumForDisplay > 0
      ? activationPriceNumForDisplay
      : priceNumForDisplay;
    const trailingAmount = refPrice * (trailingPercentNumForDisplay / 100);
    const estimatedStopPrice = refPrice * (1 - trailingPercentNumForDisplay / 100);

    trailingAmountDisplay = formatCurrency(trailingAmount, quoteCurrency, 2); // Hoặc formatCryptoValue
    estimatedStopPriceDisplay = formatCurrency(estimatedStopPrice, quoteCurrency, 2); // Hoặc formatCryptoValue
  }
  // Định dạng giá tham chiếu để hiển thị
  const formattedReferencePrice = formatCurrency(priceNumForDisplay > 0 ? priceNumForDisplay : null, quoteCurrency, 2);
  // Định dạng giá kích hoạt để hiển thị
  const formattedActivationPrice = formatCurrency(activationPriceNumForDisplay > 0 ? activationPriceNumForDisplay : null, quoteCurrency, 2);

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
            type="text" // ĐỔI THÀNH TEXT để kiểm soát hoàn toàn
            inputMode="decimal" // Gợi ý bàn phím số thập phân trên mobile
            id="amount"
            name="amount"
            value={formData.amount} // Hiển thị giá trị chuỗi
            onChange={handleInputChange}
            required
            className={inputBaseClasses}
            placeholder="0.0000"
          />
        </div>

        {/* Price Input (Limit/Reference) (đổi type="text") */}
        {(formData.type === 'limit' ) && (
          <div>
            <label htmlFor="price" className={labelBaseClasses}>
              {formData.type === 'limit' ? `Giá (${quoteCurrency}):` : `Giá tham chiếu ban đầu (${quoteCurrency}):`}
            </label>
            <input
              type="text"
              inputMode="decimal"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              required
              className={inputBaseClasses}
              placeholder="0.00"
            />
            {/* Chỉ hiển thị stop loss ước tính cho trailing stop */}
            
          </div>
        )}

        {/* Trailing Stop Fields */}
        {formData.type === 'trailing-stop' && (
          <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4">
            {/* Entry Price / Initial Reference Price */}
            <div>
              <label htmlFor="ts-price" className={labelBaseClasses}>Giá tham chiếu ban đầu ({formData.symbol.split('/')[1]}):</label>
              <input
                type="text" // ĐỔI THÀNH TEXT để kiểm soát hoàn toàn
                inputMode="decimal" // Gợi ý bàn phím số thập phân trên mobile
                id="ts-price"
                name="price" // Vẫn dùng name="price"
                value={formData.price}
                onChange={handleInputChange}
                required
                className={inputBaseClasses}
                placeholder="Giá mua vào hoặc giá bắt đầu theo dõi"
              />
              {/* Chỉ hiển thị stop loss ước tính cho trailing stop */}
              {formData.type === 'trailing-stop' && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Ước tính Stop Loss ban đầu: <span className="font-semibold text-red-600 dark:text-red-400">{estimatedStopPriceDisplay}</span> ({formData.useActivationPrice ? 'sau kích hoạt' : 'nếu giá giảm ngay'})
              </p>
            )}
              {/* <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Giá cao nhất sẽ được tính từ mức này.
              </p> */}
            </div>
            {/* --- Thêm Checkbox và Input Giá Kích Hoạt --- */}
            <div className="relative flex items-start">
              <div className="flex h-6 items-center">
                <input
                  id="useActivationPrice"
                  name="useActivationPrice"
                  type="checkbox"
                  checked={formData.useActivationPrice}
                  onChange={handleInputChange}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              <div className="ml-3 text-sm leading-6">
                <label htmlFor="useActivationPrice" className="font-medium text-gray-900 dark:text-gray-100">
                  Sử dụng Giá Kích Hoạt
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">Chỉ bắt đầu theo dõi Trailing Stop khi giá đạt mức này.</p>
              </div>
            </div>

            {/* Input Giá Kích Hoạt (hiển thị có điều kiện, đổi type="text") */}
            {formData.useActivationPrice && (
              <div>
                <label htmlFor="activationPrice" className={labelBaseClasses}>Giá Kích Hoạt ({quoteCurrency}):</label>
                <input
                  type="text"
                  inputMode="decimal"
                  id="activationPrice"
                  name="activationPrice"
                  value={formData.activationPrice}
                  onChange={handleInputChange}
                  required
                  className={inputBaseClasses}
                  placeholder={`Giá ${quoteCurrency} để bắt đầu theo dõi`}
                />
              </div>
            )}
            {/* ----------------------------------------- */}


            {/* Trailing Percent */}
            <div>
              <label htmlFor="trailingPercent" className={labelBaseClasses}>Trailing Percent (%):</label>
              <input
                type="text" // ĐỔI THÀNH TEXT để kiểm soát hoàn toàn
                inputMode="decimal" // Gợi ý bàn phím số thập phân trên mobile
                id="trailingPercent"
                name="trailingPercent"
                value={formData.trailingPercent}
                onChange={handleInputChange}
                required
                className={inputBaseClasses}
                placeholder="1.0"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Khoảng cách Stop: <span className="font-semibold">≈ {trailingAmountDisplay}</span> (tính từ giá {formData.useActivationPrice ? 'kích hoạt' : 'tham chiếu'})
              </p>
              {/* Info Box - Sử dụng giá trị đã định dạng */}
              <div className="mt-3 text-xs text-blue-700 dark:text-blue-300 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-md border border-blue-200 dark:border-blue-800/50">
                <p className="font-medium flex items-center"><InformationCircleIcon className="w-4 h-4 mr-1" />Trailing Stop Loss (Giả lập)</p>
                {formData.useActivationPrice ? (
                  <p className="mt-1">
                    Khi giá thị trường đạt <span className="font-semibold">{formattedActivationPrice}</span>,
                    hệ thống sẽ bắt đầu theo dõi. Nếu giá sau đó giảm <span className="font-semibold">{formData.trailingPercent || '___'}%</span> từ mức cao nhất (tính từ lúc kích hoạt),
                    lệnh <span className="font-semibold">Market Sell</span> sẽ được đặt.
                  </p>
                ) : (
                  <p className="mt-1">
                    Khi giá giảm <span className="font-semibold">{formData.trailingPercent || '___'}%</span> từ mức cao nhất (ban đầu là <span className="font-semibold">{formattedReferencePrice}</span>),
                    một lệnh <span className="font-semibold">Market Sell</span> sẽ được đặt.
                  </p>
                )}
                <p className="mt-1">Giá Stop Loss sẽ tự động điều chỉnh tăng theo giá thị trường.</p>
                <p className="mt-1 text-orange-600 dark:text-orange-400 font-medium">
                  Giá Stop Loss ước tính ban đầu ({formData.useActivationPrice ? 'sau kích hoạt' : 'ngay lập tức'}): <span className="font-bold">{estimatedStopPriceDisplay}</span>.
                </p>
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