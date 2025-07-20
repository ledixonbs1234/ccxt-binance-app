'use client';

import React from 'react';
import { TradingProvider } from '../../contexts/TradingContext';
import { LanguageProvider } from '../../contexts/LanguageContext';
import AdvancedTrailingStopDemo from '../../components/AdvancedTrailingStopDemo';
import AntdLayoutWrapper from '../../components/AntdLayoutWrapper';

export default function AdvancedTrailingStopPage() {
  return (
    <AntdLayoutWrapper>
      <LanguageProvider>
        <TradingProvider>
          <AdvancedTrailingStopDemo />
        </TradingProvider>
      </LanguageProvider>
    </AntdLayoutWrapper>
  );
}
