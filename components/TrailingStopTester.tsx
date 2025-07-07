'use client';

import { useState } from 'react';
import VSCodeCard from './VSCodeCard';

export default function TrailingStopTester() {
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const testImmediateBuy = async () => {
        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            const testData = {
                symbol: 'BTCUSDT',
                quantity: 0.001,
                trailingPercent: 2.0,
                entryPrice: 45000,
                useActivationPrice: false
            };

            const response = await fetch('/api/simulate-trailing-stop', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(testData)
            });

            const data = await response.json();
            
            if (response.ok) {
                setResult({
                    success: true,
                    message: 'Test thành công - Lệnh mua ngay lập tức',
                    data: data,
                    testData: testData
                });
            } else {
                setError(`Lỗi API: ${data.message || 'Unknown error'}`);
            }
        } catch (err: any) {
            setError(`Lỗi kết nối: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const testActivationPrice = async () => {
        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            const testData = {
                symbol: 'ETHUSDT',
                quantity: 0.01,
                trailingPercent: 3.0,
                entryPrice: 3000,
                useActivationPrice: true,
                activationPrice: 3100
            };

            const response = await fetch('/api/simulate-trailing-stop', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(testData)
            });

            const data = await response.json();
            
            if (response.ok) {
                setResult({
                    success: true,
                    message: 'Test thành công - Chờ activation price',
                    data: data,
                    testData: testData
                });
            } else {
                setError(`Lỗi API: ${data.message || 'Unknown error'}`);
            }
        } catch (err: any) {
            setError(`Lỗi kết nối: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <VSCodeCard>
            <div className="space-y-4">
                <h2 className="text-xl font-semibold">🧪 Test Trailing Stop System</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                        onClick={testImmediateBuy}
                        disabled={isLoading}
                        className="btn btn-primary"
                    >
                        {isLoading ? 'Đang test...' : 'Test Mua Ngay Lập Tức'}
                    </button>
                    
                    <button
                        onClick={testActivationPrice}
                        disabled={isLoading}
                        className="btn btn-secondary"
                    >
                        {isLoading ? 'Đang test...' : 'Test Activation Price'}
                    </button>
                </div>

                {error && (
                    <div className="alert alert-error">
                        <strong>Lỗi:</strong> {error}
                    </div>
                )}

                {result && (
                    <div className={`alert ${result.success ? 'alert-success' : 'alert-error'}`}>
                        <div>
                            <h3 className="font-semibold">{result.message}</h3>
                            <div className="mt-2 text-sm">
                                <p><strong>State Key:</strong> {result.data?.stateKey}</p>
                                <p><strong>Symbol:</strong> {result.testData?.symbol}</p>
                                <p><strong>Quantity:</strong> {result.testData?.quantity}</p>
                                <p><strong>Trailing %:</strong> {result.testData?.trailingPercent}%</p>
                                {result.testData?.useActivationPrice && (
                                    <p><strong>Activation Price:</strong> ${result.testData?.activationPrice}</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <div className="text-sm text-muted">
                    <h4 className="font-semibold mb-2">Hướng dẫn test:</h4>
                    <ul className="list-disc list-inside space-y-1">
                        <li><strong>Mua Ngay Lập Tức:</strong> Tạo vị thế và thực hiện lệnh mua ngay</li>
                        <li><strong>Activation Price:</strong> Tạo vị thế chờ đến khi giá đạt activation price mới mua</li>
                        <li>Sau khi test, kiểm tra tab "Trailing Stop Monitor" để xem kết quả</li>
                        <li>Kiểm tra console logs để xem chi tiết quá trình thực hiện</li>
                    </ul>
                </div>
            </div>
        </VSCodeCard>
    );
}
