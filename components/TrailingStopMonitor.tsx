// File: components/TrailingStopMonitor.tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { AdjustmentsHorizontalIcon, ArrowPathIcon, ExclamationTriangleIcon, CheckCircleIcon, InformationCircleIcon, ClockIcon, TrashIcon } from '@heroicons/react/24/outline';
import { XCircleIcon as XCircleSolid } from '@heroicons/react/20/solid';
import { generateUniqueId } from '../lib/utils';
import VSCodeCard from './VSCodeCard';
import { formatSmartPrice, isMicroCapToken } from '../lib/priceFormatter';

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
    buyOrderId?: string; // ID lệnh mua ban đầu
    sellOrderId?: string; // ID lệnh bán
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

// --- ENHANCED formatCurrency với Smart Precision ---
const formatCurrency = (value: number | undefined | null, currency = 'USD', digits = 2) => {
    if (value === undefined || value === null || isNaN(value)) return '___';

    // Sử dụng smart formatting cho micro-cap tokens
    if (isMicroCapToken(value)) {
        return formatSmartPrice(value, { includeSymbol: true });
    }

    // Chuẩn hóa mã tiền tệ: Nếu là USDT hoặc các stablecoin tương tự, dùng USD
    let displayCurrency = currency.toUpperCase();
    if (['USDT', 'USDC', 'BUSD', 'TUSD', 'DAI'].includes(displayCurrency)) {
        displayCurrency = 'USD';
    }

    try {
        return value.toLocaleString('en-US', {
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
// --- KẾT THÚC ENHANCED formatCurrency ---

export default function TrailingStopMonitor({ onSimulationTriggered }: TrailingStopMonitorProps) {
    const [simulations, setSimulations] = useState<ActiveSimulation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const prevSimulationsRef = useRef<Map<string, ActiveSimulation>>(new Map());
    // Thêm state để theo dõi ID đang bị xóa
    const [deletingKey, setDeletingKey] = useState<string | null>(null);
    // Thêm notification
    const addNotification = useCallback((message: string, type: 'success' | 'error' | 'info') => {
        const id = generateUniqueId();
        setNotifications(prev => [...prev, { id, message, type }]);

        // Tự động xóa thông báo sau 5 giây
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 5000);
    }, []);
 // Hàm để xóa notification
 const removeNotification = useCallback((id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
}, []);
    // Cập nhật phần fetchActiveSimulations để xử lý dữ liệu từ Supabase
    const fetchActiveSimulations = useCallback(async (showLoading = false) => {
        if (showLoading) setIsLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/active-simulations');
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || 'Lỗi khi lấy danh sách Trailing Stop');
            }

            const data: ActiveSimulation[] = await res.json();
            console.log('[Monitor] Fetched simulations:', data); // Debug log

            // Update UI with the latest data
            const currentSimulationsMap = new Map<string, ActiveSimulation>(
                data.map(sim => [sim.stateKey, sim])
            );

            // Compare with previous simulations and update notifications
            currentSimulationsMap.forEach((currentSim, key) => {
                const prevSim = prevSimulationsRef.current.get(key);
                if (!prevSim || currentSim.highestPrice !== prevSim.highestPrice) {
                    console.log(`[Monitor] Updated highest price for ${currentSim.symbol}: ${currentSim.highestPrice}`);
                }
            });

            setSimulations(data);
            prevSimulationsRef.current = currentSimulationsMap;
        } catch (err: any) {
            console.error("[Monitor] Error fetching simulations:", err);
            
            // Set user-friendly error message based on error type
            let errorMessage = 'Không thể tải dữ liệu trailing stop';
            if (err.message.includes('fetch failed')) {
                errorMessage = 'Lỗi kết nối - Ứng dụng hoạt động ở chế độ offline';
            } else if (err.message.includes('HTTP 500')) {
                errorMessage = 'Lỗi server - Vui lòng thử lại sau';
            }
            
            setError(errorMessage);
            
            // Don't clear existing simulations on error, just show error message
            // setSimulations([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Ensure the interval is set up properly
    useEffect(() => {
        console.log('[Monitor] Setting up fetch interval');
        fetchActiveSimulations(true); // Initial fetch with loading
        const intervalId = setInterval(() => {
            console.log('[Monitor] Fetching updates...');
            fetchActiveSimulations(false);
        }, 7000);

        return () => {
            console.log('[Monitor] Cleaning up interval');
            clearInterval(intervalId);
        };
    }, [fetchActiveSimulations]);

    // Tính giá stop loss hiện tại
    const calculateCurrentStopPrice = (highestPrice: number, trailingPercent: number): number => {
        return highestPrice * (1 - trailingPercent / 100);
    };

    // --- Hàm Xóa Simulation ---
    const cancelSimulation = useCallback(async (stateKey: string, symbol: string) => {
        if (deletingKey) return; // Ngăn chặn xóa nhiều lần cùng lúc

        setDeletingKey(stateKey); // Đánh dấu đang xóa
        addNotification(`Đang hủy theo dõi ${symbol}...`, 'info');

        try {
            const res = await fetch('/api/cancel-simulation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ stateKey }),
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || `Lỗi ${res.status} khi hủy`);
            }

            addNotification(`Đã hủy theo dõi ${symbol} thành công.`, 'success');
            // Xóa simulation khỏi state cục bộ ngay lập tức để UI cập nhật nhanh
            setSimulations(prev => prev.filter(sim => sim.stateKey !== stateKey));
        } catch (err: any) {
            console.error(`Error cancelling simulation ${stateKey}:`, err);
            addNotification(`Lỗi hủy theo dõi ${symbol}: ${err.message}`, 'error');
        } finally {
            setDeletingKey(null); // Bỏ đánh dấu đang xóa
        }
    }, [addNotification, deletingKey]); // Phụ thuộc addNotification và deletingKey


    return (
        <div className="space-y-4">
            {/* Notifications */}
            <div className="fixed top-4 right-4 z-50 max-w-xs space-y-2">
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
                        <AdjustmentsHorizontalIcon className="w-5 h-5 text-accent" />
                        Trailing Stop Đang Hoạt Động
                    </h2>
                    <button
                        onClick={() => fetchActiveSimulations(true)}
                        disabled={isLoading}
                        className="btn btn-secondary btn-sm"
                    >
                        <ArrowPathIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                        Làm mới
                    </button>
                </div>

                {/* Loading State */}
                {isLoading && simulations.length === 0 && (
                    <div className="space-y-2 animate-pulse">
                        {[...Array(2)].map((_, i) => (
                            <div key={i} className="h-10 bg-panel rounded-md"></div>
                        ))}
                    </div>
                )}

                {/* Error State */}
                {!isLoading && error && (
                    <div className="panel-error">
                        <ExclamationTriangleIcon className="w-5 h-5 mr-2 text-error" />
                        <div>
                            <span className="font-medium">Lỗi tải danh sách:</span> {error}
                        </div>
                    </div>
                )}

                {/* Simulation Table */}
                {!isLoading && !error && simulations.length > 0 && (
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Symbol</th>
                                    <th>Số lượng</th>
                                    <th>Giá vào/Kích hoạt</th>
                                    <th>Trailing %</th>
                                    <th>Giá cao nhất</th>
                                    <th>Giá Stop / Trạng thái</th>
                                    <th>Lệnh</th>
                                    <th className="text-right">Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {simulations.map((sim) => {
                                    const isPending = sim.status === 'pending_activation';
                                    const isActive = sim.status === 'active';
                                    const isTriggered = sim.status === 'triggered';
                                    const isError = sim.status === 'error';
                                    const isBeingDeleted = deletingKey === sim.stateKey;
                                    const quoteCurrency = sim.symbol.split('/')[1]?.toUpperCase() || 'USD';

                                    return (
                                        <tr key={sim.stateKey} className={`
                                            ${isTriggered || isError ? 'opacity-50' : ''} 
                                            ${isPending ? 'opacity-80' : ''} 
                                            ${isBeingDeleted ? 'opacity-40 bg-warning/10' : ''}
                                        `}>
                                            <td className="font-medium">{sim.symbol}</td>
                                            <td>{formatNum(sim.quantity)}</td>
                                            <td>
                                                {formatCurrency(sim.entryPrice, quoteCurrency, 2)}
                                                {sim.activationPrice && (
                                                    <span className="block text-xs text-accent">
                                                        (K.hoạt: {formatCurrency(sim.activationPrice, quoteCurrency, 2)})
                                                    </span>
                                                )}
                                            </td>
                                            <td>{formatNum(sim.trailingPercent, 1)}%</td>
                                            <td className={`font-semibold ${isPending ? 'text-muted' : 'text-accent'}`}>
                                                {isPending ? '---' : formatCurrency(sim.highestPrice, quoteCurrency, 2)}
                                            </td>
                                            <td>
                                                {isPending && (
                                                    <span className="badge badge-muted">
                                                        <ClockIcon className="w-3 h-3 mr-1" />
                                                        Chờ kích hoạt
                                                    </span>
                                                )}
                                                {isActive && (
                                                    <span className="font-semibold text-error">
                                                        {formatCurrency(calculateCurrentStopPrice(sim.highestPrice, sim.trailingPercent), quoteCurrency, 2)}
                                                    </span>
                                                )}
                                                {isTriggered && (
                                                    <span className="badge badge-success" title={`Lệnh bán ID: ${sim.sellOrderId}`}>
                                                        <CheckCircleIcon className="w-3 h-3 mr-1" />
                                                        Đã bán @ {formatNum(sim.triggerPrice, 4)}
                                                    </span>
                                                )}
                                                {isError && (
                                                    <span className="badge badge-error" title={sim.errorMessage}>
                                                        <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
                                                        Lỗi đặt lệnh
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                <div className="text-xs space-y-1">
                                                    {sim.buyOrderId && (
                                                        <div className="badge badge-success badge-sm">
                                                            Mua: {sim.buyOrderId.substring(0, 8)}...
                                                        </div>
                                                    )}
                                                    {sim.sellOrderId && (
                                                        <div className="badge badge-info badge-sm">
                                                            Bán: {sim.sellOrderId.substring(0, 8)}...
                                                        </div>
                                                    )}
                                                    {isPending && !sim.buyOrderId && (
                                                        <div className="badge badge-muted badge-sm">
                                                            Chờ mua
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="text-right">
                                                {(isActive || isPending) && (
                                                    <button
                                                        onClick={() => cancelSimulation(sim.stateKey, sim.symbol)}
                                                        disabled={isBeingDeleted || !!deletingKey}
                                                        className={`btn btn-sm ${isBeingDeleted ? 'btn-disabled' : 'btn-error'}`}
                                                        title="Hủy theo dõi Trailing Stop này"
                                                    >
                                                        {isBeingDeleted ? (
                                                            <ArrowPathIcon className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <TrashIcon className="h-4 w-4" />
                                                        )}
                                                    </button>
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
                    <div className="text-center py-8 text-muted">
                        Không có lệnh Trailing Stop nào đang hoạt động.
                    </div>
                )}
                
                <p className="text-xs text-muted mt-3">
                    * Dữ liệu được làm mới tự động sau mỗi 7 giây.
                </p>
            </VSCodeCard>
        </div>
    );
}