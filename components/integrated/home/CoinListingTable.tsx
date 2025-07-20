// File: components/integrated/home/CoinListingTable.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { 
  Table, 
  Tag, 
  Button, 
  Space, 
  Typography, 
  Avatar, 
  Tooltip,
  Progress,
  Input,
  Select,
  Card
} from 'antd';
import { 
  StarOutlined, 
  StarFilled, 
  RiseOutlined, 
  FallOutlined,
  SearchOutlined,
  FilterOutlined
} from '@ant-design/icons';
import { useMarket } from '../../../contexts/integrated/MarketContext';
import { useUser } from '../../../contexts/integrated/UserContext';
import { stateUtils } from '../../../lib/stateSync';

const { Text } = Typography;
const { Option } = Select;

interface CoinListingTableProps {
  onCoinSelect?: (coin: any) => void;
  showFilters?: boolean;
  pageSize?: number;
  height?: number;
}

export default function CoinListingTable({
  onCoinSelect,
  showFilters = true,
  pageSize = 20,
  height = 600,
}: CoinListingTableProps) {
  const { state: marketState, setSearchQuery, setSorting, setFilters, getFilteredCoins } = useMarket();
  const { state: userState } = useUser();
  
  const [favorites, setFavorites] = useState<string[]>([]);
  const [localFilters, setLocalFilters] = useState({
    priceRange: null as [number, number] | null,
    changeFilter: 'all' as 'all' | 'gainers' | 'losers',
    volumeMin: null as number | null,
  });

  // Get filtered and sorted coins
  const filteredCoins = useMemo(() => {
    let coins = getFilteredCoins();
    
    // Apply local filters
    if (localFilters.changeFilter === 'gainers') {
      coins = coins.filter(coin => coin.changePercent24h > 0);
    } else if (localFilters.changeFilter === 'losers') {
      coins = coins.filter(coin => coin.changePercent24h < 0);
    }
    
    if (localFilters.priceRange) {
      const [min, max] = localFilters.priceRange;
      coins = coins.filter(coin => coin.price >= min && coin.price <= max);
    }
    
    if (localFilters.volumeMin) {
      coins = coins.filter(coin => coin.volume24h >= localFilters.volumeMin!);
    }
    
    return coins;
  }, [getFilteredCoins, localFilters]);

  const toggleFavorite = (symbol: string) => {
    setFavorites(prev => 
      prev.includes(symbol) 
        ? prev.filter(s => s !== symbol)
        : [...prev, symbol]
    );
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
  };

  const handleSort = (field: string, order: 'ascend' | 'descend' | null) => {
    if (!order) return;
    
    const sortBy = field as any;
    const sortOrder = order === 'ascend' ? 'asc' : 'desc';
    setSorting(sortBy, sortOrder);
  };

  const columns = [
    {
      title: '#',
      dataIndex: 'rank',
      key: 'rank',
      width: 60,
      sorter: true,
      render: (rank: number) => (
        <Text type="secondary" className="font-mono">
          {rank || '-'}
        </Text>
      ),
    },
    {
      title: '',
      key: 'favorite',
      width: 40,
      render: (_: any, record: any) => (
        <Button
          type="text"
          size="small"
          icon={favorites.includes(record.symbol) ? <StarFilled /> : <StarOutlined />}
          onClick={() => toggleFavorite(record.symbol)}
          className={favorites.includes(record.symbol) ? 'text-yellow-500' : 'text-gray-400'}
        />
      ),
    },
    {
      title: 'Name',
      key: 'name',
      width: 200,
      render: (_: any, record: any) => (
        <div className="flex items-center gap-3">
          <Avatar
            size="small"
            src={record.icon}
            className="bg-gradient-to-br from-blue-500 to-blue-600"
          >
            {record.symbol.charAt(0)}
          </Avatar>
          <div>
            <div className="font-medium">{record.name}</div>
            <Text type="secondary" className="text-xs">
              {record.symbol}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      width: 120,
      sorter: true,
      align: 'right' as const,
      render: (price: number, record: any) => (
        <div className="text-right">
          <div className="font-mono font-medium">
            ${stateUtils.formatPrice(price, record.symbol)}
          </div>
        </div>
      ),
    },
    {
      title: '24h Change',
      dataIndex: 'changePercent24h',
      key: 'change24h',
      width: 120,
      sorter: true,
      align: 'right' as const,
      render: (change: number, record: any) => {
        const isPositive = change >= 0;
        return (
          <div className="text-right">
            <Tag
              color={isPositive ? 'green' : 'red'}
              icon={isPositive ? <RiseOutlined /> : <FallOutlined />}
              className="font-mono"
            >
              {isPositive ? '+' : ''}{change.toFixed(2)}%
            </Tag>
            <div className="text-xs text-gray-500 mt-1">
              ${Math.abs(record.change24h).toFixed(2)}
            </div>
          </div>
        );
      },
    },
    {
      title: '24h Volume',
      dataIndex: 'volume24h',
      key: 'volume24h',
      width: 120,
      sorter: true,
      align: 'right' as const,
      render: (volume: number) => (
        <div className="text-right font-mono">
          <div>${(volume / 1000000).toFixed(1)}M</div>
          <Progress
            percent={Math.min((volume / 1000000000) * 100, 100)}
            showInfo={false}
            size="small"
            className="mt-1"
          />
        </div>
      ),
    },
    {
      title: 'Market Cap',
      dataIndex: 'marketCap',
      key: 'marketCap',
      width: 120,
      sorter: true,
      align: 'right' as const,
      render: (marketCap: number) => (
        <div className="text-right font-mono">
          ${(marketCap / 1000000000).toFixed(1)}B
        </div>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      width: 100,
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="primary"
            size="small"
            onClick={() => onCoinSelect?.(record)}
          >
            Trade
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Card className="w-full">
      {showFilters && (
        <div className="mb-4 space-y-4">
          {/* Search and Quick Filters */}
          <div className="flex flex-wrap gap-4 items-center">
            <Input.Search
              placeholder="Search coins..."
              allowClear
              onSearch={handleSearch}
              className="w-64"
              prefix={<SearchOutlined />}
            />
            
            <Select
              value={localFilters.changeFilter}
              onChange={(value) => setLocalFilters(prev => ({ ...prev, changeFilter: value }))}
              className="w-32"
            >
              <Option value="all">All</Option>
              <Option value="gainers">Gainers</Option>
              <Option value="losers">Losers</Option>
            </Select>
            
            <Button
              icon={<FilterOutlined />}
              onClick={() => {
                // TODO: Open advanced filters modal
                console.log('Open advanced filters');
              }}
            >
              Filters
            </Button>
            
            <div className="ml-auto">
              <Text type="secondary">
                Showing {filteredCoins.length} coins
              </Text>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex gap-6 text-sm">
            <div>
              <Text type="secondary">Gainers: </Text>
              <Text className="text-green-600 font-medium">
                {filteredCoins.filter(c => c.changePercent24h > 0).length}
              </Text>
            </div>
            <div>
              <Text type="secondary">Losers: </Text>
              <Text className="text-red-600 font-medium">
                {filteredCoins.filter(c => c.changePercent24h < 0).length}
              </Text>
            </div>
            <div>
              <Text type="secondary">Favorites: </Text>
              <Text className="text-yellow-600 font-medium">
                {favorites.length}
              </Text>
            </div>
          </div>
        </div>
      )}

      <Table
        columns={columns}
        dataSource={filteredCoins}
        rowKey="symbol"
        loading={marketState.isLoading}
        pagination={{
          pageSize,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => 
            `${range[0]}-${range[1]} of ${total} coins`,
        }}
        scroll={{ y: height }}
        onChange={(pagination, filters, sorter: any) => {
          if (sorter.field && sorter.order) {
            handleSort(sorter.field, sorter.order);
          }
        }}
        onRow={(record) => ({
          onClick: () => onCoinSelect?.(record),
          className: 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800',
        })}
        size="small"
      />
    </Card>
  );
}
