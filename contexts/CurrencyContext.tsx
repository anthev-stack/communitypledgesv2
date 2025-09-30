'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Currency, CURRENCY_RATES, convertFromAUD, formatCurrency, fetchLiveRates, updateCurrencyRates } from '@/lib/currency';

interface CurrencyContextType {
  selectedCurrency: Currency;
  setSelectedCurrency: (currency: Currency) => void;
  convertAmount: (amount: number) => number;
  formatAmount: (amount: number) => string;
  getCurrencySymbol: () => string;
  isLoading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>('AUD');
  const [isLoading, setIsLoading] = useState(false);

  // Fetch live rates on mount
  useEffect(() => {
    const loadRates = async () => {
      setIsLoading(true);
      try {
        const rates = await fetchLiveRates();
        updateCurrencyRates(rates);
      } catch (error) {
        console.error('Failed to load currency rates:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadRates();
  }, []);

  const convertAmount = (amount: number): number => {
    return convertFromAUD(amount, selectedCurrency);
  };

  const formatAmount = (amount: number): string => {
    const convertedAmount = convertAmount(amount);
    return formatCurrency(convertedAmount, selectedCurrency);
  };

  const getCurrencySymbol = (): string => {
    return CURRENCY_RATES[selectedCurrency].symbol;
  };

  const value: CurrencyContextType = {
    selectedCurrency,
    setSelectedCurrency,
    convertAmount,
    formatAmount,
    getCurrencySymbol,
    isLoading,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}


