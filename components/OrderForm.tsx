// File: components/OrderForm.tsx
'use client';

import { useState, FormEvent, useEffect, useCallback } from 'react';
import {
  Form,
  Input,
  Select,
  Button,
  Switch,
  InputNumber,
  Space,
  Typography,
  notification,
  Spin,
  Alert,
  Row,
  Col,
  Divider
} from 'antd';
import {
  LineChartOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { useTrading } from '../contexts/TradingContext';
import { useTranslations } from '../contexts/LanguageContext';
import { generateUniqueId } from '../lib/utils';

const { Option } = Select;
const { Text, Title } = Typography;

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
  const { selectedCoin, coinsData } = useTrading();
  const t = useTranslations();
  const [form] = Form.useForm();
  const [orderResult, setOrderResult] = useState<Order | null>(null);
  const [simulationStatus, setSimulationStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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


  // Notification Handling using Ant Design
  const [api, contextHolder] = notification.useNotification();

  const addNotification = useCallback((message: string, type: 'success' | 'error') => {
    if (type === 'success') {
      api.success({
        message: 'Thành công',
        description: message,
        placement: 'topRight',
        duration: 5,
      });
    } else {
      api.error({
        message: 'Lỗi',
        description: message,
        placement: 'topRight',
        duration: 5,
      });
    }
  }, [api]);

  // Form value change handling
  const handleFormChange = (changedValues: any, allValues: any) => {
    setFormData(prev => ({
      ...prev,
      ...allValues
    }));
  };

  // Number input validation
  const isValidNumberInput = (val: string) => {
    if (val === '') return true; // Cho phép rỗng
    // Regex: Cho phép số nguyên hoặc số thập phân (có thể bắt đầu bằng 0.)
    return /^(0|[1-9]\d*)(\.\d*)?$/.test(val) || /^0\.$/.test(val);
  };

  // Auto switch side for Trailing Stop
  useEffect(() => {
    if (formData.type === 'trailing-stop' && formData.side !== 'sell') {
      const newFormData = { ...formData, side: 'sell' as const };
      setFormData(newFormData);
      form.setFieldsValue(newFormData);
    }
  }, [formData.type, formData.side, form]);

  // Update symbol when selectedCoin changes
  useEffect(() => {
    const newFormData = {
      ...formData,
      symbol: `${selectedCoin}/USDT`
    };
    setFormData(newFormData);
    form.setFieldsValue(newFormData);
  }, [selectedCoin, form]);

  const submitOrder = async (values: any) => {
    if (loading) return;
    // *** PARSE GIÁ TRỊ TRƯỚC KHI GỬI API ***
    const amountNum = parseFloat(values.amount) || 0;
    const priceNum = parseFloat(values.price) || 0;
    const trailingPercentNum = parseFloat(values.trailingPercent) || 0;
    const activationPriceNum = parseFloat(values.activationPrice) || 0;

    setLoading(true);
    setError(null);
    setOrderResult(null);
    setSimulationStatus(null);

    // Xác định endpoint và payload cơ bản
    const isTrailingStop = values.type === 'trailing-stop';
    const apiEndpoint = isTrailingStop ? '/api/simulate-trailing-stop' : '/api/order';
    let payload: any = {}; // Sử dụng any để linh hoạt hoặc tạo type cụ thể hơn
    let successMessagePrefix = '';

    try {
      // --- Validate Inputs ---
      if (!values.symbol) throw new Error('Vui lòng nhập Symbol.');
      if (amountNum <= 0) throw new Error('Số lượng phải lớn hơn 0.');

      // --- Logic riêng cho từng loại lệnh ---
      if (isTrailingStop) {
        // Validate trailing stop với giá trị number
        if (values.side === 'buy') throw new Error('Trailing Stop chỉ hỗ trợ lệnh Bán (Stop Loss).');
        // Sử dụng priceNum (giá tham chiếu đã parse)
        if (priceNum <= 0) throw new Error('Giá tham chiếu ban đầu phải lớn hơn 0.');
        if (trailingPercentNum <= 0 || trailingPercentNum > 10) throw new Error('Trailing Percent phải từ 0.1% đến 10%.');
        if (values.useActivationPrice && activationPriceNum <= 0) {
          throw new Error('Giá kích hoạt phải lớn hơn 0.');
        }
        payload = {
          symbol: values.symbol,
          quantity: amountNum, // Dùng giá trị số
          trailingPercent: trailingPercentNum, // Dùng giá trị số
          entryPrice: priceNum, // Dùng giá trị số
          useActivationPrice: values.useActivationPrice,
          activationPrice: values.useActivationPrice ? activationPriceNum : undefined, // Dùng giá trị số
        };
        successMessagePrefix = `Bắt đầu theo dõi Trailing Stop Loss ${values.trailingPercent}%`;
        if (values.useActivationPrice) {
          successMessagePrefix += ` (kích hoạt tại ${values.activationPrice})`;
        }
        // --- API Call ***CHỈ*** cho Trailing Stop ---
        console.log(`[${values.symbol}] Sending request to ${apiEndpoint}`); // Log trước khi fetch
        const res = await fetch(apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        console.log(`[${values.symbol}] Received response from ${apiEndpoint}`, data); // Log kết quả

        if (!res.ok) {
          throw new Error(data.message || data.error || `Lỗi ${res.status} từ API`);
        }

        // Xử lý thành công cho Trailing Stop
        onSimulationStartSuccess(); // Gọi callback
        setSimulationStatus(data.message || 'Yêu cầu đã được gửi.');
        const successMessage = `${successMessagePrefix} cho ${values.amount} ${values.symbol.split('/')[0]}.`;
        addNotification(successMessage, 'success');

      } else { // Market or Limit

        // Chuẩn bị payload và thông báo
        payload = {
          symbol: values.symbol,
          type: values.type,
          side: values.side,
          amount: amountNum, // Dùng giá trị số
          price: values.type === 'limit' ? priceNum : undefined, // Dùng giá trị số
        };
        const actionType = values.side === 'buy' ? 'Mua' : 'Bán';
        const orderType = values.type;
        successMessagePrefix = `${actionType} thành công (${orderType})`;

        // --- API Call ***CHỈ*** cho Market/Limit ---
        console.log(`[${values.symbol}] Sending request to ${apiEndpoint}`); // Log trước khi fetch
        const res = await fetch(apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        console.log(`[${values.symbol}] Received response from ${apiEndpoint}`, data); // Log kết quả

        if (!res.ok) {
          throw new Error(data.message || data.error || `Lỗi ${res.status} từ API`);
        }

        // Xử lý thành công cho Market/Limit
        setOrderResult(data);
        const successMessage = `${successMessagePrefix} cho ${values.amount} ${values.symbol.split('/')[0]}.`;
        addNotification(successMessage, 'success');
        // Có thể gọi callback refresh khác ở đây nếu cần cập nhật Balance/History ngay
        // *** GỌI CALLBACK KHI MARKET/LIMIT THÀNH CÔNG ***
        onOrderSuccess(); // Thông báo cho parent để refresh Balance/History
      }

      // --- Logic chung sau khi một trong các lệnh gọi API thành công ---
      // Reset Form
      form.resetFields(['amount', 'price', 'activationPrice']);
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



  // Thêm hàm định dạng giá tiền (ví dụ: USDT)
  const formatCurrency = (value: number | undefined | null, currency = 'USD', digits = 2) => {
    if (value === undefined || value === null || isNaN(value)) return '___';

    // Chuẩn hóa mã tiền tệ: Nếu là USDT hoặc các stablecoin tương tự, dùng USD
    let displayCurrency = currency.toUpperCase();
    if (['USDT', 'USDC', 'BUSD', 'TUSD', 'DAI'].includes(displayCurrency)) { // Có thể thêm các stablecoin khác
      displayCurrency = 'USD';
    }

    try {
      // Xử lý giá nhỏ cho micro-cap cryptocurrencies như PEPE
      if (value < 0.01) {
        return `$${value.toFixed(8)}`;
      }

      return value.toLocaleString('en-US', { // Hoặc 'vi-VN' nếu muốn định dạng Việt Nam
        style: 'currency',
        currency: displayCurrency, // Sử dụng mã đã chuẩn hóa
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      });
    } catch (error) {
      // Nếu vẫn lỗi (ví dụ mã tiền tệ không được hỗ trợ bởi trình duyệt/hệ thống)
      console.error("Error formatting currency:", value, currency, error);
      // Fallback: Hiển thị số và mã gốc với xử lý giá nhỏ
      if (value < 0.01) {
        return `${value.toFixed(8)} ${currency}`;
      }
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
    <div>
      {contextHolder}

      <Form
        form={form}
        layout="vertical"
        onFinish={submitOrder}
        onValuesChange={handleFormChange}
        initialValues={formData}
        size="middle"
      >
        {/* Symbol */}
        <Form.Item
          label="Trading Pair"
          name="symbol"
          rules={[{ required: true, message: 'Vui lòng nhập Symbol!' }]}
        >
          <Input placeholder="e.g., BTC/USDT" />
        </Form.Item>

        {/* Order Type and Side */}
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              label={t.trading.orderType}
              name="type"
              rules={[{ required: true, message: 'Vui lòng chọn loại lệnh!' }]}
            >
              <Select placeholder="Chọn loại lệnh">
                <Option value="market">{t.trading.market}</Option>
                <Option value="limit">{t.trading.limit}</Option>
                <Option value="trailing-stop">{t.trading.trailingStop}</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              label={t.trading.side}
              name="side"
              rules={[{ required: true, message: 'Vui lòng chọn hướng giao dịch!' }]}
            >
              <Select
                placeholder="Chọn hướng"
                disabled={formData.type === 'trailing-stop'}
              >
                <Option value="buy">{t.trading.buy}</Option>
                <Option value="sell">{t.trading.sell}</Option>
              </Select>
            </Form.Item>
            {formData.type === 'trailing-stop' && (
              <Alert
                message="Tự động chọn Bán cho Trailing Stop."
                type="warning"
                showIcon
                style={{ marginTop: 8, fontSize: '12px' }}
              />
            )}
          </Col>
        </Row>

        {/* Amount */}
        <Form.Item
          label={`${t.trading.amount} (${formData.symbol.split('/')[0]})`}
          name="amount"
          rules={[
            { required: true, message: 'Vui lòng nhập số lượng!' },
            {
              validator: (_, value) => {
                if (!value || isValidNumberInput(value)) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('Vui lòng nhập số hợp lệ!'));
              }
            }
          ]}
        >
          <Input
            placeholder="0.0000"
            inputMode="decimal"
          />
        </Form.Item>

        {/* Price Input (Limit/Reference) */}
        {formData.type === 'limit' && (
          <Form.Item
            label={`${t.trading.price} (${quoteCurrency})`}
            name="price"
            rules={[
              { required: true, message: 'Vui lòng nhập giá!' },
              {
                validator: (_, value) => {
                  if (!value || isValidNumberInput(value)) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Vui lòng nhập số hợp lệ!'));
                }
              }
            ]}
          >
            <Input
              placeholder="0.00"
              inputMode="decimal"
            />
          </Form.Item>
        )}

        {/* Trailing Stop Fields */}
        {formData.type === 'trailing-stop' && (
          <div>
            <Divider orientation="left">Cài đặt Trailing Stop</Divider>

            {/* Entry Price / Initial Reference Price */}
            <Form.Item
              label={`Giá tham chiếu ban đầu (${formData.symbol.split('/')[1]})`}
              name="price"
              rules={[
                { required: true, message: 'Vui lòng nhập giá tham chiếu!' },
                {
                  validator: (_, value) => {
                    if (!value || isValidNumberInput(value)) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Vui lòng nhập số hợp lệ!'));
                  }
                }
              ]}
            >
              <Input
                placeholder="Giá mua vào hoặc giá bắt đầu theo dõi"
                inputMode="decimal"
              />
            </Form.Item>

            {formData.type === 'trailing-stop' && (
              <Alert
                message={
                  <Text style={{ fontSize: 12 }}>
                    Ước tính Stop Loss ban đầu: <Text type="danger" strong>{estimatedStopPriceDisplay}</Text> ({formData.useActivationPrice ? 'sau kích hoạt' : 'nếu giá giảm ngay'})
                  </Text>
                }
                type="info"
                showIcon
                style={{ marginBottom: 16, fontSize: '12px' }}
              />
            )}

            {/* Checkbox và Input Giá Kích Hoạt */}
            <Form.Item
              name="useActivationPrice"
              valuePropName="checked"
            >
              <Space direction="vertical" size="small">
                <Switch
                  checkedChildren="Sử dụng Giá Kích Hoạt"
                  unCheckedChildren="Không sử dụng"
                />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Chỉ bắt đầu theo dõi Trailing Stop khi giá đạt mức này.
                </Text>
              </Space>
            </Form.Item>

            {/* Input Giá Kích Hoạt (hiển thị có điều kiện) */}
            {formData.useActivationPrice && (
              <Form.Item
                label={`Giá Kích Hoạt (${quoteCurrency})`}
                name="activationPrice"
                rules={[
                  { required: true, message: 'Vui lòng nhập giá kích hoạt!' },
                  {
                    validator: (_, value) => {
                      if (!value || isValidNumberInput(value)) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Vui lòng nhập số hợp lệ!'));
                    }
                  }
                ]}
              >
                <Input
                  placeholder={`Giá ${quoteCurrency} để bắt đầu theo dõi`}
                  inputMode="decimal"
                />
              </Form.Item>
            )}
            {/* ----------------------------------------- */}


            {/* Trailing Percent */}
            <Form.Item
              label="Trailing Percent (%)"
              name="trailingPercent"
              rules={[
                { required: true, message: 'Vui lòng nhập phần trăm trailing!' },
                {
                  validator: (_, value) => {
                    if (!value || isValidNumberInput(value)) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Vui lòng nhập số hợp lệ!'));
                  }
                }
              ]}
            >
              <Input
                placeholder="1.0"
                inputMode="decimal"
                suffix="%"
              />
            </Form.Item>

            <Alert
              message={
                <Text style={{ fontSize: 12 }}>
                  Khoảng cách Stop: <Text strong>≈ {trailingAmountDisplay}</Text> (tính từ giá {formData.useActivationPrice ? 'kích hoạt' : 'tham chiếu'})
                </Text>
              }
              type="info"
              showIcon
              style={{ marginBottom: 16, fontSize: '12px' }}
            />

            {/* Info Box */}
            <Alert
              message={
                <Space direction="vertical" size="small">
                  <Text strong style={{ fontSize: 12 }}>
                    <InfoCircleOutlined style={{ marginRight: 4 }} />
                    Trailing Stop Loss (Giả lập)
                  </Text>
                  {formData.useActivationPrice ? (
                    <Text style={{ fontSize: 12 }}>
                      Khi giá thị trường đạt <Text strong>{formattedActivationPrice}</Text>,
                      hệ thống sẽ bắt đầu theo dõi. Nếu giá sau đó giảm <Text strong>{formData.trailingPercent || '___'}%</Text> từ mức cao nhất (tính từ lúc kích hoạt),
                      lệnh <Text strong>Market Sell</Text> sẽ được đặt.
                    </Text>
                  ) : (
                    <Text style={{ fontSize: 12 }}>
                      Khi giá giảm <Text strong>{formData.trailingPercent || '___'}%</Text> từ mức cao nhất (ban đầu là <Text strong>{formattedReferencePrice}</Text>),
                      một lệnh <Text strong>Market Sell</Text> sẽ được đặt.
                    </Text>
                  )}
                  <Text style={{ fontSize: 12 }}>Giá Stop Loss sẽ tự động điều chỉnh tăng theo giá thị trường.</Text>
                  <Text type="warning" strong style={{ fontSize: 12 }}>
                    Giá Stop Loss ước tính ban đầu ({formData.useActivationPrice ? 'sau kích hoạt' : 'ngay lập tức'}): <Text strong>{estimatedStopPriceDisplay}</Text>.
                  </Text>
                </Space>
              }
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
          </div>
        )}

        {/* Submit Button */}
        <Form.Item style={{ marginBottom: 0 }}>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            size="large"
            block
            style={{
              height: 48,
              fontSize: 16,
              fontWeight: 600,
              background: formData.side === 'buy' && formData.type !== 'trailing-stop'
                ? 'linear-gradient(135deg, #10b981, #059669)'
                : formData.side === 'sell'
                  ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                  : 'linear-gradient(135deg, #3b82f6, #2563eb)',
              borderColor: 'transparent',
            }}
            icon={loading ? <ReloadOutlined spin /> : <LineChartOutlined />}
          >
            {loading
              ? 'Đang xử lý...'
              : formData.type === 'trailing-stop'
                ? `Bắt đầu Trailing Stop ${formData.trailingPercent}%`
                : `${formData.side === 'buy' ? 'Mua' : 'Bán'} ${formData.symbol.split('/')[0]}`}
          </Button>
        </Form.Item>
      </Form>

      {/* Status/Result Display Area */}
      <Space direction="vertical" size="middle" style={{ width: '100%', marginTop: 20 }}>
        {error && (
          <Alert
            message="Lỗi"
            description={error}
            type="error"
            showIcon
            closable
            onClose={() => setError(null)}
          />
        )}
        {simulationStatus && !orderResult && (
          <Alert
            message="Thông tin"
            description={simulationStatus}
            type="info"
            showIcon
          />
        )}
        {orderResult && !simulationStatus && (
          <Alert
            message={
              <Space>
                <CheckCircleOutlined />
                <Text strong>Lệnh đã đặt thành công</Text>
              </Space>
            }
            description={
              <div style={{
                backgroundColor: 'rgba(0, 0, 0, 0.02)',
                padding: 8,
                borderRadius: 4,
                maxHeight: 160,
                overflow: 'auto',
                fontSize: 12,
                fontFamily: 'monospace'
              }}>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {JSON.stringify(orderResult, null, 2)}
                </pre>
              </div>
            }
            type="success"
            showIcon={false}
          />
        )}
      </Space>
    </div>
  );
}