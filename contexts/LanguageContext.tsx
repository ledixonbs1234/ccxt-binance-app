// File: contexts/LanguageContext.tsx
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, Translations, getTranslations, getSupportedLanguages } from '../lib/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: Translations;
  supportedLanguages: { code: Language; name: string; flag: string }[];
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
  defaultLanguage?: Language;
}

export function LanguageProvider({ children, defaultLanguage = 'vi' }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>(defaultLanguage);
  const [isLoading, setIsLoading] = useState(true);

  // Load language from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('preferred-language') as Language;
    if (savedLanguage && ['en', 'vi'].includes(savedLanguage)) {
      setLanguageState(savedLanguage);
    }
    setIsLoading(false);
  }, []);

  // Save language to localStorage when changed
  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage);
    localStorage.setItem('preferred-language', newLanguage);
    
    // Update document language attribute
    document.documentElement.lang = newLanguage;
    
    // Dispatch custom event for other components to listen
    window.dispatchEvent(new CustomEvent('languageChanged', { 
      detail: { language: newLanguage } 
    }));
  };

  // Get current translations
  const t = getTranslations(language);
  
  // Get supported languages
  const supportedLanguages = getSupportedLanguages();

  const value: LanguageContextType = {
    language,
    setLanguage,
    t,
    supportedLanguages,
    isLoading,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

// Custom hook to use language context
export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

// Helper hook for translations only
export function useTranslations(): Translations {
  const { t } = useLanguage();
  return t;
}

// Helper hook for current language
export function useCurrentLanguage(): Language {
  const { language } = useLanguage();
  return language;
}

// Utility function to format text with parameters
export function formatTranslation(text: string, params: Record<string, string | number>): string {
  let result = text;
  Object.entries(params).forEach(([key, value]) => {
    result = result.replace(new RegExp(`{${key}}`, 'g'), String(value));
  });
  return result;
}

// Utility function to get nested translation
export function getNestedTranslation(translations: Translations, path: string): string {
  const keys = path.split('.');
  let current: any = translations;
  
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return path; // Return the path if translation not found
    }
  }
  
  return typeof current === 'string' ? current : path;
}

// Component for language switcher
interface LanguageSwitcherProps {
  className?: string;
  showFlag?: boolean;
  showName?: boolean;
  variant?: 'dropdown' | 'buttons';
}

export function LanguageSwitcher({ 
  className = '', 
  showFlag = true, 
  showName = true,
  variant = 'dropdown'
}: LanguageSwitcherProps) {
  const { language, setLanguage, supportedLanguages } = useLanguage();

  if (variant === 'buttons') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {supportedLanguages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={`px-3 py-1.5 text-sm rounded-md transition-all duration-200 flex items-center gap-2 ${
              language === lang.code
                ? 'vscode-button text-white'
                : 'vscode-button-secondary hover:border-[var(--accent)] hover:text-[var(--accent)]'
            }`}
            title={`Switch to ${lang.name}`}
          >
            {showFlag && <span>{lang.flag}</span>}
            {showName && <span>{lang.name}</span>}
          </button>
        ))}
      </div>
    );
  }

  return (
    <select
      value={language}
      onChange={(e) => setLanguage(e.target.value as Language)}
      className={`vscode-input text-sm ${className}`}
      title="Select Language"
    >
      {supportedLanguages.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {showFlag ? `${lang.flag} ` : ''}{showName ? lang.name : lang.code.toUpperCase()}
        </option>
      ))}
    </select>
  );
}

// HOC for components that need translations
export function withTranslations<P extends object>(
  Component: React.ComponentType<P & { t: Translations }>
) {
  return function TranslatedComponent(props: P) {
    const t = useTranslations();
    return <Component {...props} t={t} />;
  };
}

// Hook for date/time formatting based on language
export function useLocalizedDateTime() {
  const { language } = useLanguage();
  
  const formatDateTime = (date: Date, options?: Intl.DateTimeFormatOptions) => {
    const locale = language === 'vi' ? 'vi-VN' : 'en-US';
    return new Intl.DateTimeFormat(locale, options).format(date);
  };
  
  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return language === 'vi' ? 'vừa xong' : 'just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return language === 'vi' ? `${minutes} phút trước` : `${minutes} minutes ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return language === 'vi' ? `${hours} giờ trước` : `${hours} hours ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return language === 'vi' ? `${days} ngày trước` : `${days} days ago`;
    }
  };
  
  return { formatDateTime, formatRelativeTime };
}

// Hook for number formatting based on language
export function useLocalizedNumbers() {
  const { language } = useLanguage();
  
  const formatNumber = (number: number, options?: Intl.NumberFormatOptions) => {
    const locale = language === 'vi' ? 'vi-VN' : 'en-US';
    return new Intl.NumberFormat(locale, options).format(number);
  };
  
  const formatCurrency = (amount: number, currency = 'USD') => {
    const locale = language === 'vi' ? 'vi-VN' : 'en-US';

    // For micro-cap cryptocurrencies like PEPE, use 8 decimal places
    if (amount < 0.01) {
      return `$${amount.toFixed(8)}`;
    }

    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    }).format(amount);
  };
  
  const formatPercentage = (value: number, decimals = 2) => {
    const locale = language === 'vi' ? 'vi-VN' : 'en-US';
    return new Intl.NumberFormat(locale, {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value / 100);
  };
  
  return { formatNumber, formatCurrency, formatPercentage };
}
