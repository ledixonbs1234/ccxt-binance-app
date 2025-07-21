// File: components/integrated/backtesting/BacktestDashboard.tsx
'use client';

import React, { useState } from 'react';
import { 
  Row, 
  Col, 
  Card, 
  Tabs, 
  Button, 
  Space, 
  Typography, 
  Alert,
  List,
  Tag,
  Modal,
  Tooltip,
  Divider
} from 'antd';
import { 
  ExperimentOutlined,
  HistoryOutlined,
  BarChartOutlined,
  SaveOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { useNotification } from '../../../contexts/integrated/NotificationContext';
import StrategyBuilder from './StrategyBuilder';
import BacktestRunner from './BacktestRunner';
import PerformanceAnalytics from './PerformanceAnalytics';

const { Title, Text } = Typography;

interface BacktestDashboardProps {
  className?: string;
}

export default function BacktestDashboard({ className = '' }: BacktestDashboardProps) {
  const { addNotification } = useNotification();
  
  const [activeTab, setActiveTab] = useState('builder');
  const [currentStrategy, setCurrentStrategy] = useState<any>(null);
  const [backtestResults, setBacktestResults] = useState<any>(null);
  const [savedStrategies, setSavedStrategies] = useState<any[]>([]);
  const [showStrategyModal, setShowStrategyModal] = useState(false);

  const handleStrategyCreate = (strategy: any) => {
    // Save strategy to local storage or send to API
    const updatedStrategies = [...savedStrategies];
    const existingIndex = updatedStrategies.findIndex(s => s.id === strategy.id);
    
    if (existingIndex >= 0) {
      updatedStrategies[existingIndex] = strategy;
    } else {
      updatedStrategies.push(strategy);
    }
    
    setSavedStrategies(updatedStrategies);
    setCurrentStrategy(strategy);
    
    // Save to localStorage
    localStorage.setItem('backtesting_strategies', JSON.stringify(updatedStrategies));
    
    addNotification({
      type: 'success',
      title: 'Strategy Saved',
      message: `Strategy "${strategy.name}" has been saved`,
      category: 'system',
      priority: 'medium',
      persistent: false,
    });
  };

  const handleStrategyTest = (strategy: any) => {
    setCurrentStrategy(strategy);
    setActiveTab('runner');
    
    addNotification({
      type: 'info',
      title: 'Ready to Test',
      message: `Strategy "${strategy.name}" loaded for testing`,
      category: 'system',
      priority: 'medium',
      persistent: false,
    });
  };

  const handleBacktestComplete = (results: any) => {
    setBacktestResults(results);
    setActiveTab('analytics');
    
    addNotification({
      type: 'success',
      title: 'Backtest Complete',
      message: 'View results in the Analytics tab',
      category: 'system',
      priority: 'high',
      persistent: false,
    });
  };

  const loadStrategy = (strategy: any) => {
    setCurrentStrategy(strategy);
    setShowStrategyModal(false);
    setActiveTab('builder');
    
    addNotification({
      type: 'info',
      title: 'Strategy Loaded',
      message: `Strategy "${strategy.name}" loaded for editing`,
      category: 'system',
      priority: 'medium',
      persistent: false,
    });
  };

  const deleteStrategy = (strategyId: string) => {
    const updatedStrategies = savedStrategies.filter(s => s.id !== strategyId);
    setSavedStrategies(updatedStrategies);
    localStorage.setItem('backtesting_strategies', JSON.stringify(updatedStrategies));
    
    if (currentStrategy?.id === strategyId) {
      setCurrentStrategy(null);
    }
    
    addNotification({
      type: 'success',
      title: 'Strategy Deleted',
      message: 'Strategy has been removed',
      category: 'system',
      priority: 'medium',
      persistent: false,
    });
  };

  // Load saved strategies on component mount
  React.useEffect(() => {
    const saved = localStorage.getItem('backtesting_strategies');
    if (saved) {
      try {
        setSavedStrategies(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading saved strategies:', error);
      }
    }
  }, []);

  const tabItems = [
    {
      key: 'builder',
      label: (
        <span>
          <ExperimentOutlined />
          Strategy Builder
        </span>
      ),
      children: (
        <StrategyBuilder
          onStrategyCreate={handleStrategyCreate}
          onStrategyTest={handleStrategyTest}
        />
      ),
    },
    {
      key: 'runner',
      label: (
        <span>
          <PlayCircleOutlined />
          Backtest Runner
        </span>
      ),
      children: (
        <BacktestRunner
          strategy={currentStrategy}
          onBacktestComplete={handleBacktestComplete}
        />
      ),
    },
    {
      key: 'analytics',
      label: (
        <span>
          <BarChartOutlined />
          Performance Analytics
        </span>
      ),
      children: (
        <PerformanceAnalytics
          results={backtestResults}
        />
      ),
    },
  ];

  return (
    <div className={`${className}`}>
      {/* Header */}
      <Card className="mb-4" size="small">
        <div className="flex items-center justify-between">
          <div>
            <Title level={3} className="!mb-1">
              Backtesting System
            </Title>
            <Text type="secondary">
              Build, test, and analyze trading strategies with historical data
            </Text>
          </div>
          
          <Space>
            <Button
              icon={<HistoryOutlined />}
              onClick={() => setShowStrategyModal(true)}
            >
              Saved Strategies ({savedStrategies.length})
            </Button>
            
            {currentStrategy && (
              <Tag color="blue" className="px-3 py-1">
                Current: {currentStrategy.name}
              </Tag>
            )}
          </Space>
        </div>
      </Card>

      {/* Quick Stats */}
      {backtestResults && (
        <Card className="mb-4" size="small">
          <Row gutter={16}>
            <Col xs={8} sm={6} md={4}>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {backtestResults.performance.totalReturn.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-500">Total Return</div>
              </div>
            </Col>
            <Col xs={8} sm={6} md={4}>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {backtestResults.performance.sharpeRatio.toFixed(2)}
                </div>
                <div className="text-sm text-gray-500">Sharpe Ratio</div>
              </div>
            </Col>
            <Col xs={8} sm={6} md={4}>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {Math.abs(backtestResults.performance.maxDrawdown).toFixed(1)}%
                </div>
                <div className="text-sm text-gray-500">Max Drawdown</div>
              </div>
            </Col>
            <Col xs={8} sm={6} md={4}>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {backtestResults.performance.winRate.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-500">Win Rate</div>
              </div>
            </Col>
            <Col xs={8} sm={6} md={4}>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {backtestResults.performance.totalTrades}
                </div>
                <div className="text-sm text-gray-500">Total Trades</div>
              </div>
            </Col>
            <Col xs={8} sm={6} md={4}>
              <div className="text-center">
                <div className="text-2xl font-bold text-teal-600">
                  {backtestResults.performance.profitFactor.toFixed(2)}
                </div>
                <div className="text-sm text-gray-500">Profit Factor</div>
              </div>
            </Col>
          </Row>
        </Card>
      )}

      {/* Main Content */}
      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          size="large"
        />
      </Card>

      {/* Saved Strategies Modal */}
      <Modal
        title="Saved Strategies"
        open={showStrategyModal}
        onCancel={() => setShowStrategyModal(false)}
        footer={null}
        width={800}
      >
        {savedStrategies.length === 0 ? (
          <Alert
            message="No Saved Strategies"
            description="Create and save strategies to see them here"
            type="info"
            showIcon
          />
        ) : (
          <List
            dataSource={savedStrategies}
            renderItem={(strategy) => (
              <List.Item
                actions={[
                  <Tooltip key="load" title="Load Strategy">
                    <Button
                      type="primary"
                      size="small"
                      icon={<SettingOutlined />}
                      onClick={() => loadStrategy(strategy)}
                    >
                      Load
                    </Button>
                  </Tooltip>,
                  <Tooltip key="test" title="Test Strategy">
                    <Button
                      size="small"
                      icon={<PlayCircleOutlined />}
                      onClick={() => {
                        setCurrentStrategy(strategy);
                        setShowStrategyModal(false);
                        setActiveTab('runner');
                      }}
                    >
                      Test
                    </Button>
                  </Tooltip>,
                  <Tooltip key="delete" title="Delete Strategy">
                    <Button
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={() => deleteStrategy(strategy.id)}
                    >
                      Delete
                    </Button>
                  </Tooltip>,
                ]}
              >
                <List.Item.Meta
                  title={
                    <div className="flex items-center gap-2">
                      <span>{strategy.name}</span>
                      <Tag color="blue">
                        {strategy.type.replace('_', ' ')}
                      </Tag>
                    </div>
                  }
                  description={
                    <div>
                      <Text type="secondary">{strategy.description}</Text>
                      <div className="mt-2 text-xs text-gray-400">
                        Entry Conditions: {strategy.entryConditions?.length || 0} | 
                        Exit Conditions: {strategy.exitConditions?.length || 0} |
                        Created: {strategy.createdAt ? new Date(strategy.createdAt).toLocaleDateString() : 'Unknown'}
                      </div>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Modal>
    </div>
  );
}
