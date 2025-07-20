// File: components/integrated/home/CoinSearchFilter.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { 
  Input, 
  Select, 
  Button, 
  Space, 
  Drawer, 
  Form, 
  Slider, 
  Switch,
  Typography,
  Divider,
  Tag,
  Card
} from 'antd';
import { 
  SearchOutlined, 
  FilterOutlined, 
  ClearOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { useMarket } from '../../../contexts/integrated/MarketContext';

const { Text, Title } = Typography;
const { Option } = Select;

interface FilterState {
  priceRange: [number, number];
  volumeRange: [number, number];
  changeRange: [number, number];
  marketCapRange: [number, number];
  categories: string[];
  showFavoritesOnly: boolean;
  hideStablecoins: boolean;
}

const defaultFilters: FilterState = {
  priceRange: [0, 100000],
  volumeRange: [0, 10000000000],
  changeRange: [-100, 100],
  marketCapRange: [0, 1000000000000],
  categories: [],
  showFavoritesOnly: false,
  hideStablecoins: false,
};

interface CoinSearchFilterProps {
  onFiltersChange?: (filters: any) => void;
  className?: string;
}

export default function CoinSearchFilter({ 
  onFiltersChange,
  className = '' 
}: CoinSearchFilterProps) {
  const { state: marketState, setSearchQuery, setFilters, clearFilters } = useMarket();
  const [form] = Form.useForm();
  
  const [searchValue, setSearchValue] = useState('');
  const [quickFilter, setQuickFilter] = useState<string>('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [localFilters, setLocalFilters] = useState<FilterState>(defaultFilters);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  // Quick filter options
  const quickFilterOptions = [
    { value: 'all', label: 'All Coins', count: marketState.coins.length },
    { value: 'gainers', label: 'Gainers', count: marketState.coins.filter(c => c.changePercent24h > 0).length },
    { value: 'losers', label: 'Losers', count: marketState.coins.filter(c => c.changePercent24h < 0).length },
    { value: 'volume', label: 'High Volume', count: marketState.coins.filter(c => c.volume24h > 100000000).length },
    { value: 'new', label: 'New Listings', count: 0 }, // TODO: Implement new listings logic
  ];

  // Categories for filtering
  const categories = [
    'DeFi', 'NFT', 'Gaming', 'Metaverse', 'Layer 1', 'Layer 2', 
    'Meme', 'AI', 'Privacy', 'Exchange', 'Stablecoin'
  ];

  // Handle search input
  const handleSearch = (value: string) => {
    setSearchValue(value);
    setSearchQuery(value);
  };

  // Handle quick filter change
  const handleQuickFilterChange = (value: string) => {
    setQuickFilter(value);
    
    // Apply quick filter logic
    switch (value) {
      case 'gainers':
        setFilters({ changeRange: [0, 1000] });
        break;
      case 'losers':
        setFilters({ changeRange: [-1000, 0] });
        break;
      case 'volume':
        setFilters({ volumeRange: [100000000, 10000000000] });
        break;
      case 'all':
      default:
        clearFilters();
        break;
    }
  };

  // Handle advanced filters
  const handleAdvancedFiltersApply = (values: any) => {
    const newFilters = {
      priceRange: values.priceRange,
      volumeRange: values.volumeRange,
      changeRange: values.changeRange,
      marketCapRange: values.marketCapRange,
    };
    
    setLocalFilters(prev => ({ ...prev, ...values }));
    setFilters(newFilters);
    setShowAdvancedFilters(false);
    
    // Count active filters
    let count = 0;
    if (values.priceRange[0] > 0 || values.priceRange[1] < 100000) count++;
    if (values.volumeRange[0] > 0 || values.volumeRange[1] < 10000000000) count++;
    if (values.changeRange[0] > -100 || values.changeRange[1] < 100) count++;
    if (values.marketCapRange[0] > 0 || values.marketCapRange[1] < 1000000000000) count++;
    if (values.categories && values.categories.length > 0) count++;
    if (values.showFavoritesOnly) count++;
    if (values.hideStablecoins) count++;
    
    setActiveFiltersCount(count);
    onFiltersChange?.(values);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchValue('');
    setQuickFilter('all');
    setLocalFilters(defaultFilters);
    setActiveFiltersCount(0);
    form.resetFields();
    clearFilters();
    setSearchQuery('');
  };

  // Format number for display
  const formatNumber = (num: number): string => {
    if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Search and Quick Filters */}
      <Card size="small">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Search Input */}
          <Input.Search
            placeholder="Search coins by name or symbol..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onSearch={handleSearch}
            allowClear
            className="flex-1 min-w-64"
            size="large"
            prefix={<SearchOutlined />}
          />
          
          {/* Quick Filter Dropdown */}
          <Select
            value={quickFilter}
            onChange={handleQuickFilterChange}
            className="w-40"
            size="large"
          >
            {quickFilterOptions.map(option => (
              <Option key={option.value} value={option.value}>
                <div className="flex justify-between items-center">
                  <span>{option.label}</span>
                  <Text type="secondary" className="text-xs ml-2">
                    {option.count}
                  </Text>
                </div>
              </Option>
            ))}
          </Select>
          
          {/* Advanced Filters Button */}
          <Button
            icon={<FilterOutlined />}
            onClick={() => setShowAdvancedFilters(true)}
            size="large"
            className="relative"
          >
            Filters
            {activeFiltersCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </Button>
          
          {/* Clear Filters */}
          {(searchValue || quickFilter !== 'all' || activeFiltersCount > 0) && (
            <Button
              icon={<ClearOutlined />}
              onClick={handleClearFilters}
              size="large"
              type="text"
            >
              Clear
            </Button>
          )}
        </div>
        
        {/* Active Filters Display */}
        {activeFiltersCount > 0 && (
          <div className="mt-3 pt-3 border-t">
            <div className="flex flex-wrap gap-2 items-center">
              <Text type="secondary" className="text-sm">Active filters:</Text>
              {localFilters.showFavoritesOnly && (
                <Tag closable onClose={() => {/* TODO: Remove filter */}}>
                  Favorites Only
                </Tag>
              )}
              {localFilters.hideStablecoins && (
                <Tag closable onClose={() => {/* TODO: Remove filter */}}>
                  Hide Stablecoins
                </Tag>
              )}
              {localFilters.categories.map(category => (
                <Tag key={category} closable onClose={() => {/* TODO: Remove category */}}>
                  {category}
                </Tag>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Advanced Filters Drawer */}
      <Drawer
        title={
          <div className="flex items-center gap-2">
            <SettingOutlined />
            <span>Advanced Filters</span>
          </div>
        }
        placement="right"
        width={400}
        onClose={() => setShowAdvancedFilters(false)}
        open={showAdvancedFilters}
        footer={
          <div className="flex justify-between">
            <Button onClick={handleClearFilters}>
              Clear All
            </Button>
            <Space>
              <Button onClick={() => setShowAdvancedFilters(false)}>
                Cancel
              </Button>
              <Button type="primary" onClick={() => form.submit()}>
                Apply Filters
              </Button>
            </Space>
          </div>
        }
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={localFilters}
          onFinish={handleAdvancedFiltersApply}
        >
          {/* Price Range */}
          <Form.Item label="Price Range" name="priceRange">
            <Slider
              range
              min={0}
              max={100000}
              step={100}
              marks={{
                0: '$0',
                1000: '$1K',
                10000: '$10K',
                100000: '$100K'
              }}
              tooltip={{
                formatter: (value) => `$${formatNumber(value || 0)}`
              }}
            />
          </Form.Item>
          
          <Divider />
          
          {/* Volume Range */}
          <Form.Item label="24h Volume Range" name="volumeRange">
            <Slider
              range
              min={0}
              max={10000000000}
              step={1000000}
              marks={{
                0: '$0',
                1000000000: '$1B',
                5000000000: '$5B',
                10000000000: '$10B'
              }}
              tooltip={{
                formatter: (value) => `$${formatNumber(value || 0)}`
              }}
            />
          </Form.Item>
          
          <Divider />
          
          {/* Change Range */}
          <Form.Item label="24h Change Range" name="changeRange">
            <Slider
              range
              min={-100}
              max={100}
              step={1}
              marks={{
                '-100': '-100%',
                '-50': '-50%',
                0: '0%',
                50: '+50%',
                100: '+100%'
              }}
              tooltip={{
                formatter: (value) => `${value}%`
              }}
            />
          </Form.Item>
          
          <Divider />
          
          {/* Market Cap Range */}
          <Form.Item label="Market Cap Range" name="marketCapRange">
            <Slider
              range
              min={0}
              max={1000000000000}
              step={1000000000}
              marks={{
                0: '$0',
                100000000000: '$100B',
                500000000000: '$500B',
                1000000000000: '$1T'
              }}
              tooltip={{
                formatter: (value) => `$${formatNumber(value || 0)}`
              }}
            />
          </Form.Item>
          
          <Divider />
          
          {/* Categories */}
          <Form.Item label="Categories" name="categories">
            <Select
              mode="multiple"
              placeholder="Select categories"
              allowClear
            >
              {categories.map(category => (
                <Option key={category} value={category}>
                  {category}
                </Option>
              ))}
            </Select>
          </Form.Item>
          
          <Divider />
          
          {/* Special Filters */}
          <Form.Item name="showFavoritesOnly" valuePropName="checked">
            <Switch /> <span className="ml-2">Show favorites only</span>
          </Form.Item>
          
          <Form.Item name="hideStablecoins" valuePropName="checked">
            <Switch /> <span className="ml-2">Hide stablecoins</span>
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}
