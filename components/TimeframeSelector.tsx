'use client';

import React from 'react';
import { Segmented, Select, Space, Typography } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';
import { Timeframe } from '../contexts/TradingContext';
import { useTranslations } from '../contexts/LanguageContext';

const { Text } = Typography;

interface TimeframeSelectorProps {
  value: Timeframe;
  onChange: (timeframe: Timeframe) => void;
  size?: 'small' | 'middle' | 'large';
  variant?: 'segmented' | 'select';
  showLabel?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const TIMEFRAME_OPTIONS: Timeframe[] = ['1m', '5m', '15m', '1h', '4h', '1d'];

export default function TimeframeSelector({
  value,
  onChange,
  size = 'middle',
  variant = 'segmented',
  showLabel = true,
  className,
  style
}: TimeframeSelectorProps) {
  const t = useTranslations();

  // Prepare options for Ant Design components
  const segmentedOptions = TIMEFRAME_OPTIONS.map(tf => ({
    label: t.trading.timeframes[tf],
    value: tf,
    icon: <ClockCircleOutlined />
  }));

  const selectOptions = TIMEFRAME_OPTIONS.map(tf => ({
    label: (
      <Space>
        <ClockCircleOutlined />
        <span>{t.trading.timeframes[tf]}</span>
      </Space>
    ),
    value: tf
  }));

  const handleChange = (newValue: string | Timeframe) => {
    onChange(newValue as Timeframe);
  };

  if (variant === 'select') {
    return (
      <Space direction="vertical" size="small" className={className} style={style}>
        {showLabel && (
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {t.trading.timeframe}
          </Text>
        )}
        <Select
          value={value}
          onChange={handleChange}
          options={selectOptions}
          size={size}
          style={{ minWidth: 120 }}
          suffixIcon={<ClockCircleOutlined />}
          popupClassName="timeframe-selector-dropdown"
        />
      </Space>
    );
  }

  return (
    <Space direction="vertical" size="small" className={className} style={style}>
      {showLabel && (
        <Text type="secondary" style={{ fontSize: '12px' }}>
          {t.trading.timeframe}
        </Text>
      )}
      <Segmented
        value={value}
        onChange={handleChange}
        options={segmentedOptions}
        size={size}
        className="timeframe-segmented"
      />
    </Space>
  );
}

// Compact version for use in tight spaces
export function CompactTimeframeSelector({
  value,
  onChange,
  className,
  style
}: Omit<TimeframeSelectorProps, 'variant' | 'showLabel' | 'size'>) {
  const t = useTranslations();

  const compactOptions = TIMEFRAME_OPTIONS.map(tf => ({
    label: tf.toUpperCase(),
    value: tf
  }));

  return (
    <Segmented
      value={value}
      onChange={(newValue) => onChange(newValue as Timeframe)}
      options={compactOptions}
      size="small"
      className={`timeframe-compact ${className || ''}`}
      style={style}
    />
  );
}

// Inline version for chart overlays
export function InlineTimeframeSelector({
  value,
  onChange,
  className,
  style
}: Omit<TimeframeSelectorProps, 'variant' | 'showLabel' | 'size'>) {
  const t = useTranslations();

  return (
    <div
      className={`chart-overlay-controls inline-flex items-center gap-1 rounded-lg p-1 ${className || ''}`}
      style={style}
    >
      <Text
        type="secondary"
        style={{
          fontSize: '11px',
          marginRight: '4px'
        }}
        className="text-muted"
      >
        {t.trading.timeframe}:
      </Text>
      {TIMEFRAME_OPTIONS.map((tf) => (
        <button
          key={tf}
          onClick={() => onChange(tf)}
          className={`px-2 py-1 text-xs font-medium rounded transition-all duration-200 hover:scale-105 active:scale-95 ${
            value === tf
              ? 'bg-accent text-black-20 shadow-md'
              : 'text-blue-200 hover:bg-hover hover:text-foreground border border-transparent hover:border-accent/30'
          }`}
          style={{
            pointerEvents: 'auto',
            position: 'relative',
            zIndex: 1002,
            minWidth: '28px'
          }}
          title={t.trading.timeframes[tf]}
        >
          {tf}
        </button>
      ))}
    </div>
  );
}
