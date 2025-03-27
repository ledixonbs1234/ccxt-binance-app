// File: components/TrailingStopMonitor.tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react'; // Thêm useRef
import { AdjustmentsHorizontalIcon, ArrowPathIcon, ExclamationTriangleIcon, CheckCircleIcon, InformationCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import { XCircleIcon as XCircleSolid } from '@heroicons/react/20/solid'; // Cho notification

// Cập nhật interface
interface ActiveSimulation {
    stateKey: string;
    symbol: string;
    quantity: number;
    entryPrice: number; // Giá tham chiếu ban đầu
    activationPrice?: number; // Giá kích hoạt
    trailingPercent: number;
    highestPrice: number;
    status?: 'pending_activation' | 'active' | 'triggered' | 'error';
    triggeredAt?: number;
    triggerPrice?: number;
    sellOrderId?: string;
    errorMessage?: string;
}
// Thêm prop type
type TrailingStopMonitorProps = {
    onSimulationTriggered: () => void;
};
// Interface cho notification (có thể dùng chung từ page.tsx hoặc định nghĩa riêng)
type NotificationItem = {
    id: number;
    message: string;
    type: 'success' | 'error' | 'info';
};

// Định dạng số
const formatNum = (num: number | undefined | null, digits = 8, minDigits = 2) => {
    if (num === undefined || num === null) return 'N/A';

    // Đảm bảo digits không vượt quá giới hạn
    const effectiveDigits = Math.min(digits, MAX_FRACTION_DIGITS);
    // Đảm bảo minDigits không lớn hơn effectiveDigits
    const effectiveMinDigits = Math.min(minDigits, effectiveDigits);

    try { // Thêm try...catch để bắt lỗi tiềm ẩn khác (ít khả năng hơn)
        return num.toLocaleString(undefined, {
            minimumFractionDigits: effectiveMinDigits,
            maximumFractionDigits: effectiveDigits
        });
    } catch (error) {
        console.error("Error formatting number:", num, error);
        // Trả về giá trị fallback nếu có lỗi định dạng
        return num.toString(); // Hoặc 'Error' hoặc giá trị mặc định khác
    }
};
const MAX_FRACTION_DIGITS = 20; // Định nghĩa hằng số

// --- BỔ SUNG HÀM formatCurrency ---
const formatCurrency = (value: number | undefined | null, currency = 'USD', digits = 2) => {
    if (value === undefined || value === null || isNaN(value)) return '___';

    // Chuẩn hóa mã tiền tệ: Nếu là USDT hoặc các stablecoin tương tự, dùng USD
    let displayCurrency = currency.toUpperCase();
    if (['USDT', 'USDC', 'BUSD', 'TUSD', 'DAI'].includes(displayCurrency)) {
        displayCurrency = 'USD';
    }

    try {
        return value.toLocaleString('en-US', { // Hoặc 'vi-VN'
            style: 'currency',
            currency: displayCurrency,
            minimumFractionDigits: digits,
            maximumFractionDigits: digits,
        });
    } catch (error) {
        console.error("Error formatting currency:", value, currency, error);
        // Fallback: Hiển thị số và mã gốc
        return `${value.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits })} ${currency}`;
    }
};
// --- KẾT THÚC BỔ SUNG ---

export default function TrailingStopMonitor({ onSimulationTriggered }: TrailingStopMonitorProps) {
    const [simulations, setSimulations] = useState<ActiveSimulation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const prevSimulationsRef = useRef<Map<string, ActiveSimulation>>(new Map());

    // --- Notification Handling ---
    const addNotification = useCallback((message: string, type: NotificationItem['type']) => {
        const id = Date.now();
        setNotifications(prev => [...prev, { message, type, id }].slice(-3));
        setTimeout(() => removeNotification(id), 6000); // Tăng thời gian hiển thị
    }, []);
    const removeNotification = useCallback((id: number) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);


    const fetchActiveSimulations = useCallback(async (showLoading = false) => {
        if (showLoading) setIsLoading(true); // Chỉ hiện loading khi refresh thủ công
        setError(null);
        try {
            const res = await fetch('/api/active-simulations');
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || 'Lỗi khi lấy danh sách Trailing Stop');
            }


            const data: ActiveSimulation[] = await res.json();
            const currentSimulationsMap = new Map<string, ActiveSimulation>(data.map(sim => [sim.stateKey, sim]));
            const prevSimulationsMap = prevSimulationsRef.current;

            currentSimulationsMap.forEach((currentSim, key) => {
                const prevSim = prevSimulationsMap.get(key);

                // *** Phát hiện TRIGGER THÀNH CÔNG và gọi callback ***
                if (currentSim.status === 'triggered' && currentSim.sellOrderId && // Phải có sellOrderId
                    (!prevSim || prevSim.status === 'active')) {
                    addNotification(`✅ Trailing Stop ${currentSim.symbol} kích hoạt bán!`, 'success');
                    // Gọi callback để báo cho parent component (page.tsx)
                    onSimulationTriggered();
                }
                // Phát hiện lỗi
                else if (currentSim.status === 'error' && (!prevSim || prevSim.status === 'active')) {
                    addNotification(`❌ Lỗi Trailing Stop ${currentSim.symbol}: ${currentSim.errorMessage || 'Lỗi không xác định'}`, 'error');
                    // Không gọi onSimulationTriggered khi có lỗi
                }
            });

            setSimulations(data);
            prevSimulationsRef.current = currentSimulationsMap;
        } catch (err: any) {
            console.error("Error fetching simulations:", err);
            setError(err.message);
            // Giữ lại state cũ khi có lỗi fetch định kỳ
            // setSimulations([]);
        } finally {
            setIsLoading(false); // Luôn tắt loading sau khi fetch xong
        }
    }, [addNotification, onSimulationTriggered]);

    useEffect(() => {
        fetchActiveSimulations(true); // Fetch lần đầu
        const intervalId = setInterval(() => fetchActiveSimulations(false), 7000); // Fetch mỗi 7 giây
        return () => clearInterval(intervalId);
    }, [fetchActiveSimulations]);

    // Tính giá stop loss hiện tại
    const calculateCurrentStopPrice = (highestPrice: number, trailingPercent: number): number => {
        return highestPrice * (1 - trailingPercent / 100);
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-5 md:p-6 rounded-lg shadow-md mb-6 border border-gray-200 dark:border-gray-700 relative">
            {/* Khu vực hiển thị notification riêng cho component này */}
            <div className="absolute top-0 right-0 p-4 space-y-2 max-w-xs z-10">
                {notifications.map((n) => (
                    <div key={n.id} className={`relative flex items-start p-3 rounded-md shadow-lg text-sm ${n.type === 'success' ? 'bg-green-50 dark:bg-green-900/40 border border-green-200 dark:border-green-700/50 text-green-800 dark:text-green-200' :
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
                    <AdjustmentsHorizontalIcon className="w-5 h-5 md:w-6 md:h-6 mr-2 text-purple-600 dark:text-purple-400" />
                    Trailing Stop Đang Hoạt Động
                </h2>
                <button
                    onClick={() => fetchActiveSimulations(true)} // Refresh thủ công
                    disabled={isLoading}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 shadow-sm text-xs font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 disabled:opacity-50"
                >
                    <ArrowPathIcon className={`w-4 h-4 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
                    Làm mới
                </button>
            </div>

            {/* Loading State */}
            {isLoading && simulations.length === 0 && ( // Chỉ hiện skeleton khi chưa có data
                <div className="space-y-2 animate-pulse mt-4">
                    {[...Array(2)].map((_, i) => (
                        <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
                    ))}
                </div>
            )}

            {/* Error State */}
            {!isLoading && error && (
                <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/30 text-red-700 dark:text-red-300 px-4 py-3 rounded-md flex items-center gap-3 text-sm">
                    <ExclamationTriangleIcon className="w-5 h-5" />
                    <div><span className="font-medium">Lỗi tải danh sách:</span> {error}</div>
                </div>
            )}

            {/* Simulation Table */}
            {!isLoading && !error && simulations.length > 0 && (
                <div className="overflow-x-auto -mx-5 md:-mx-6">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Symbol</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Số lượng</th>
                                {/* Gộp Giá vào/Kích hoạt */}
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Giá vào/Kích hoạt</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Trailing %</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Giá cao nhất</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Giá Stop / Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {simulations.map((sim) => {
                                const isPending = sim.status === 'pending_activation';
                                const isActive = sim.status === 'active';
                                const isTriggered = sim.status === 'triggered';
                                const isError = sim.status === 'error';
                                const quoteCurrency = sim.symbol.split('/')[1]?.toUpperCase() || 'USD';

                                return (
                                    <tr key={sim.stateKey}
                                        // Làm mờ nhẹ nếu chờ, mờ hẳn nếu xong/lỗi
                                        className={`text-sm transition-opacity duration-500 ${isTriggered || isError ? 'opacity-50' : ''} ${isPending ? 'opacity-80' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
                                    >
                                        <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900 dark:text-gray-100">{sim.symbol}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-gray-700 dark:text-gray-300">{formatNum(sim.quantity)}</td>
                                        {/* Hiển thị Giá vào và Giá kích hoạt nếu có */}
                                        <td className="px-4 py-3 whitespace-nowrap text-gray-700 dark:text-gray-300">
                                            {formatCurrency(sim.entryPrice, quoteCurrency, 2)}
                                            {sim.activationPrice && (
                                                <span className="block text-xs text-blue-600 dark:text-blue-400">
                                                    (K.hoạt: {formatCurrency(sim.activationPrice, quoteCurrency, 2)})
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-gray-700 dark:text-gray-300">{formatNum(sim.trailingPercent, 1)}%</td>
                                        {/* Giá cao nhất chỉ hiển thị khi active hoặc đã trigger/lỗi */}
                                        <td className={`px-4 py-3 whitespace-nowrap font-semibold ${isPending ? 'text-gray-400 dark:text-gray-500' : 'text-blue-600 dark:text-blue-400'}`}>
                                            {isPending ? '---' : formatCurrency(sim.highestPrice, quoteCurrency, 2)}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            {/* Hiển thị trạng thái */}
                                            {isPending && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                                                    <ClockIcon className="w-3 h-3 mr-1" />
                                                    Chờ kích hoạt
                                                </span>
                                            )}
                                            {isActive && (
                                                <span className="font-semibold text-red-600 dark:text-red-400">
                                                    {formatCurrency(calculateCurrentStopPrice(sim.highestPrice, sim.trailingPercent), quoteCurrency, 2)}
                                                </span>
                                            )}

                                            {isTriggered && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300" title={`Lệnh bán ID: ${sim.sellOrderId}`}>
                                                    <CheckCircleIcon className="w-3 h-3 mr-1" />
                                                    Đã bán @ {formatNum(sim.triggerPrice, 4)}
                                                    {/* Thêm timestamp nếu muốn: {sim.triggeredAt ? `(${new Date(sim.triggeredAt).toLocaleTimeString()})` : ''} */}
                                                </span>
                                            )}
                                            {isError && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300" title={sim.errorMessage}>
                                                    <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
                                                    Lỗi đặt lệnh
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Empty State */}
            {!isLoading && !error && simulations.length === 0 && (
                <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-6">
                    Không có lệnh Trailing Stop nào đang hoạt động.
                </p>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">* Dữ liệu được làm mới tự động sau mỗi 7 giây.</p>
        </div>
    );
}