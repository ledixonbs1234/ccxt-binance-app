'use client';

import React from 'react';
import { TradingProvider } from '../../contexts/TradingContext';
import { LanguageProvider } from '../../contexts/LanguageContext';
import AdvancedTrailingStopDemo from '../../components/AdvancedTrailingStopDemo';

export default function AdvancedTrailingStopPage() {
  return (
    <LanguageProvider>
      <TradingProvider>
        <AdvancedTrailingStopDemo />
      </TradingProvider>
    </LanguageProvider>
  );
}
