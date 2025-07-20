// File: components/integrated/trading/OrderForm.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Form, 
  Input, 
  Select, 
  Button, 
  Space, 
  Typography, 
  Slider,
  Switch,
  Alert,
  Divider,
  Row,
  Col,
  Statistic,
  Tag
} from 'antd';
import { 
  DollarOutlined, 
  PercentageOutlined,
  CalculatorOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { useEnhancedTrading } from '../../../contexts/integrated/EnhancedTradingContext';
import { useMarket } from '../../../contexts/integrated/MarketContext';
import { useNotification } from '../../../contexts/integrated/NotificationContext';

const { Text, Title } = Typography;
const { Option } = Select;

interface OrderFormProps {
  selectedCoin?: any;
  onOrderSubmit?: (order: any) => void;
  className?: string;
}

export default function OrderForm({ 
  selectedCoin, 
  onOrderSubmit,
  className = '' 
}: OrderFormProps) {
  const [form] = Form.useForm();
  const { state: tradingState, createOrder } = useEnhancedTrading();
  const { state: marketState } = useMarket();
  const { addNotification } = useNotification();
  
  const [orderType, setOrderType] = useState<'market' | 'limit' | 'stop'>('market');
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState<number>(0);
  const [price, setPrice] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);
  const [usePercentage, setUsePercentage] = useState<boolean>(false);
  const [percentage, setPercentage] = useState<number>(25);
  const [isAdvanced, setIsAdvanced] = useState<boolean>(false);

  // Get current coin data
  const currentCoin = selectedCoin || marketState.selectedCoin;
  const currentPrice = currentCoin?.price || 0;
  const symbol = currentCoin?.symbol || 'BTCUSDT';

  // Calculate available balance
  const availableBalance = side === 'buy' 
    ? tradingState.account.balance 
    : tradingState.positions.find(p => p.symbol === symbol)?.size || 0;

  // Update calculations when values change
  useEffect(() => {
    if (usePercentage) {
      const calculatedAmount = (availableBalance * percentage) / 100;
      if (side === 'buy' && orderType === 'market') {
        setAmount(calculatedAmount / currentPrice);
        setTotal(calculatedAmount);
      } else {
        setAmount(calculatedAmount);
        setTotal(calculatedAmount * (price || currentPrice));
      }
    } else {
      if (amount && (price || currentPrice)) {
        setTotal(amount * (orderType === 'market' ? currentPrice : price));
      }
    }
  }, [amount, price, percentage, usePercentage, side, orderType, currentPrice, availableBalance]);

  const handleOrderTypeChange = (value: 'market' | 'limit' | 'stop') => {
    setOrderType(value);
    if (value === 'market') {
      setPrice(currentPrice);
    }
  };

  const handlePercentageChange = (value: number) => {
    setPercentage(value);
    if (usePercentage) {
      const calculatedAmount = (availableBalance * value) / 100;
      if (side === 'buy' && orderType === 'market') {
        setAmount(calculatedAmount / currentPrice);
      } else {
        setAmount(calculatedAmount);
      }
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      const orderData = {
        symbol,
        side,
        type: orderType,
        amount: amount,
        price: orderType === 'market' ? undefined : price,
        stopPrice: values.stopPrice,
        timeInForce: values.timeInForce || 'GTC',
        reduceOnly: values.reduceOnly || false,
        postOnly: values.postOnly || false,
      };

      await createOrder(orderData);
      
      addNotification({
        type: 'success',
        title: 'Order Submitted',
        message: `${side.toUpperCase()} order for ${amount} ${symbol} submitted successfully`,
        category: 'trading',
        priority: 'high',
        persistent: false,
      });

      onOrderSubmit?.(orderData);
      form.resetFields();
      setAmount(0);
      setTotal(0);
      
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Order Failed',
        message: error.message || 'Failed to submit order',
        category: 'trading',
        priority: 'high',
        persistent: true,
      });
    }
  };

  const quickAmountButtons = [25, 50, 75, 100];

  return (
    <Card 
      title={
        <div className="flex items-center justify-between">
          <Title level={4} className="!mb-0">
            Place Order
          </Title>
          <div className="flex items-center gap-2">
            <Text type="secondary" className="text-sm">
              {symbol}
            </Text>
            <Tag color={side === 'buy' ? 'green' : 'red'}>
              {side.toUpperCase()}
            </Tag>
          </div>
        </div>
      }
      className={`${className}`}
      extra={
        <Switch
          checkedChildren="Advanced"
          unCheckedChildren="Simple"
          checked={isAdvanced}
          onChange={setIsAdvanced}
        />
      }
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          orderType: 'market',
          side: 'buy',
          timeInForce: 'GTC',
        }}
      >
        {/* Order Type and Side Selection */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Order Type" name="orderType">
              <Select value={orderType} onChange={handleOrderTypeChange}>
                <Option value="market">Market</Option>
                <Option value="limit">Limit</Option>
                <Option value="stop">Stop</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Side" name="side">
              <Select value={side} onChange={setSide}>
                <Option value="buy">
                  <span className="text-green-600">Buy</span>
                </Option>
                <Option value="sell">
                  <span className="text-red-600">Sell</span>
                </Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        {/* Price Input (for limit/stop orders) */}
        {orderType !== 'market' && (
          <Form.Item 
            label={`${orderType === 'stop' ? 'Stop ' : ''}Price`}
            name="price"
          >
            <Input
              type="number"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              prefix={<DollarOutlined />}
              placeholder={`Current: $${currentPrice.toFixed(2)}`}
            />
          </Form.Item>
        )}

        {/* Amount Input */}
        <Form.Item label="Amount" name="amount">
          <div className="space-y-3">
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              placeholder="Enter amount"
              suffix={currentCoin?.symbol?.replace('USDT', '') || 'BTC'}
            />
            
            {/* Percentage Toggle */}
            <div className="flex items-center justify-between">
              <Switch
                size="small"
                checked={usePercentage}
                onChange={setUsePercentage}
                checkedChildren={<PercentageOutlined />}
                unCheckedChildren={<CalculatorOutlined />}
              />
              <Text type="secondary" className="text-xs">
                Use percentage of balance
              </Text>
            </div>

            {/* Percentage Slider */}
            {usePercentage && (
              <div className="space-y-2">
                <Slider
                  value={percentage}
                  onChange={handlePercentageChange}
                  marks={{
                    0: '0%',
                    25: '25%',
                    50: '50%',
                    75: '75%',
                    100: '100%'
                  }}
                  tooltip={{
                    formatter: (value) => `${value}%`
                  }}
                />
                <div className="flex gap-2">
                  {quickAmountButtons.map(percent => (
                    <Button
                      key={percent}
                      size="small"
                      type={percentage === percent ? 'primary' : 'default'}
                      onClick={() => handlePercentageChange(percent)}
                    >
                      {percent}%
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Form.Item>

        {/* Advanced Options */}
        {isAdvanced && (
          <>
            <Divider />
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Time in Force" name="timeInForce">
                  <Select defaultValue="GTC">
                    <Option value="GTC">Good Till Cancel</Option>
                    <Option value="IOC">Immediate or Cancel</Option>
                    <Option value="FOK">Fill or Kill</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Stop Price" name="stopPrice">
                  <Input
                    type="number"
                    prefix={<DollarOutlined />}
                    placeholder="Stop loss price"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="reduceOnly" valuePropName="checked">
                  <Switch size="small" /> 
                  <span className="ml-2 text-sm">Reduce Only</span>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="postOnly" valuePropName="checked">
                  <Switch size="small" />
                  <span className="ml-2 text-sm">Post Only</span>
                </Form.Item>
              </Col>
            </Row>
          </>
        )}

        {/* Order Summary */}
        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 space-y-3">
          <div className="flex justify-between items-center">
            <Text type="secondary">Available Balance:</Text>
            <Text strong>
              ${availableBalance.toFixed(2)}
            </Text>
          </div>
          <div className="flex justify-between items-center">
            <Text type="secondary">Estimated Total:</Text>
            <Text strong className={side === 'buy' ? 'text-green-600' : 'text-red-600'}>
              ${total.toFixed(2)}
            </Text>
          </div>
          {total > availableBalance && side === 'buy' && (
            <Alert
              message="Insufficient Balance"
              description="The order total exceeds your available balance"
              type="warning"
              showIcon
              icon={<ExclamationCircleOutlined />}
            />
          )}
        </div>

        {/* Submit Button */}
        <Form.Item className="!mb-0 !mt-4">
          <Button
            type="primary"
            htmlType="submit"
            block
            size="large"
            loading={tradingState.isLoading}
            disabled={!amount || (orderType !== 'market' && !price) || (total > availableBalance && side === 'buy')}
            className={side === 'buy' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
          >
            {side === 'buy' ? 'Buy' : 'Sell'} {currentCoin?.symbol?.replace('USDT', '') || 'BTC'}
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}
