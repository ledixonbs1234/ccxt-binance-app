// File: components/integrated/layout/ResponsiveGrid.tsx
'use client';

import React, { ReactNode } from 'react';
import { Row, Col } from 'antd';

interface GridProps {
  children: ReactNode;
  gutter?: number | [number, number];
  className?: string;
  align?: 'top' | 'middle' | 'bottom';
  justify?: 'start' | 'end' | 'center' | 'space-around' | 'space-between' | 'space-evenly';
}

interface ColProps {
  children: ReactNode;
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
  xxl?: number;
  span?: number;
  offset?: number;
  order?: number;
  className?: string;
}

// Main Grid Container
export function ResponsiveGrid({
  children,
  gutter = [16, 16],
  className = '',
  align = 'top',
  justify = 'start',
}: GridProps) {
  return (
    <Row
      gutter={gutter}
      align={align}
      justify={justify}
      className={className}
    >
      {children}
    </Row>
  );
}

// Grid Column
export function GridCol({
  children,
  xs = 24,
  sm,
  md,
  lg,
  xl,
  xxl,
  span,
  offset,
  order,
  className = '',
}: ColProps) {
  return (
    <Col
      xs={xs}
      sm={sm}
      md={md}
      lg={lg}
      xl={xl}
      xxl={xxl}
      span={span}
      offset={offset}
      order={order}
      className={className}
    >
      {children}
    </Col>
  );
}

// Predefined layout patterns
export function TwoColumnLayout({
  left,
  right,
  leftSpan = { xs: 24, lg: 16 },
  rightSpan = { xs: 24, lg: 8 },
  gutter = [24, 24],
  className = '',
}: {
  left: ReactNode;
  right: ReactNode;
  leftSpan?: { xs?: number; sm?: number; md?: number; lg?: number; xl?: number };
  rightSpan?: { xs?: number; sm?: number; md?: number; lg?: number; xl?: number };
  gutter?: number | [number, number];
  className?: string;
}) {
  return (
    <ResponsiveGrid gutter={gutter} className={className}>
      <GridCol {...leftSpan}>
        {left}
      </GridCol>
      <GridCol {...rightSpan}>
        {right}
      </GridCol>
    </ResponsiveGrid>
  );
}

export function ThreeColumnLayout({
  left,
  center,
  right,
  leftSpan = { xs: 24, md: 8 },
  centerSpan = { xs: 24, md: 8 },
  rightSpan = { xs: 24, md: 8 },
  gutter = [24, 24],
  className = '',
}: {
  left: ReactNode;
  center: ReactNode;
  right: ReactNode;
  leftSpan?: { xs?: number; sm?: number; md?: number; lg?: number; xl?: number };
  centerSpan?: { xs?: number; sm?: number; md?: number; lg?: number; xl?: number };
  rightSpan?: { xs?: number; sm?: number; md?: number; lg?: number; xl?: number };
  gutter?: number | [number, number];
  className?: string;
}) {
  return (
    <ResponsiveGrid gutter={gutter} className={className}>
      <GridCol {...leftSpan}>
        {left}
      </GridCol>
      <GridCol {...centerSpan}>
        {center}
      </GridCol>
      <GridCol {...rightSpan}>
        {right}
      </GridCol>
    </ResponsiveGrid>
  );
}

export function FourColumnLayout({
  columns,
  gutter = [16, 16],
  className = '',
}: {
  columns: ReactNode[];
  gutter?: number | [number, number];
  className?: string;
}) {
  return (
    <ResponsiveGrid gutter={gutter} className={className}>
      {columns.map((column, index) => (
        <GridCol
          key={index}
          xs={24}
          sm={12}
          lg={6}
        >
          {column}
        </GridCol>
      ))}
    </ResponsiveGrid>
  );
}

// Trading-specific layouts
export function TradingLayout({
  chart,
  orderForm,
  positions,
  orderHistory,
  gutter = [16, 16],
  className = '',
}: {
  chart: ReactNode;
  orderForm: ReactNode;
  positions: ReactNode;
  orderHistory: ReactNode;
  gutter?: number | [number, number];
  className?: string;
}) {
  return (
    <ResponsiveGrid gutter={gutter} className={className}>
      {/* Chart - Full width on mobile, 2/3 on desktop */}
      <GridCol xs={24} lg={16}>
        {chart}
      </GridCol>
      
      {/* Right sidebar - Full width on mobile, 1/3 on desktop */}
      <GridCol xs={24} lg={8}>
        <div className="space-y-4">
          {orderForm}
          {positions}
        </div>
      </GridCol>
      
      {/* Order history - Full width below on all screens */}
      <GridCol xs={24}>
        {orderHistory}
      </GridCol>
    </ResponsiveGrid>
  );
}

export function DashboardLayout({
  widgets,
  gutter = [16, 16],
  className = '',
}: {
  widgets: ReactNode[];
  gutter?: number | [number, number];
  className?: string;
}) {
  return (
    <ResponsiveGrid gutter={gutter} className={className}>
      {widgets.map((widget, index) => (
        <GridCol
          key={index}
          xs={24}
          sm={12}
          md={8}
          lg={6}
        >
          {widget}
        </GridCol>
      ))}
    </ResponsiveGrid>
  );
}

// Homepage market layout
export function MarketLayout({
  overview,
  coinList,
  trends,
  gutter = [24, 24],
  className = '',
}: {
  overview: ReactNode;
  coinList: ReactNode;
  trends: ReactNode;
  gutter?: number | [number, number];
  className?: string;
}) {
  return (
    <ResponsiveGrid gutter={gutter} className={className}>
      {/* Market overview - Full width */}
      <GridCol xs={24}>
        {overview}
      </GridCol>
      
      {/* Coin list - Main content */}
      <GridCol xs={24} lg={16}>
        {coinList}
      </GridCol>
      
      {/* Trends sidebar */}
      <GridCol xs={24} lg={8}>
        {trends}
      </GridCol>
    </ResponsiveGrid>
  );
}

// Backtesting layout
export function BacktestLayout({
  configuration,
  results,
  comparison,
  gutter = [24, 24],
  className = '',
}: {
  configuration: ReactNode;
  results: ReactNode;
  comparison?: ReactNode;
  gutter?: number | [number, number];
  className?: string;
}) {
  return (
    <ResponsiveGrid gutter={gutter} className={className}>
      {/* Configuration panel */}
      <GridCol xs={24} lg={8}>
        {configuration}
      </GridCol>
      
      {/* Results panel */}
      <GridCol xs={24} lg={16}>
        {results}
      </GridCol>
      
      {/* Comparison panel (if provided) */}
      {comparison && (
        <GridCol xs={24}>
          {comparison}
        </GridCol>
      )}
    </ResponsiveGrid>
  );
}
