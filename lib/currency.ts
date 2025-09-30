// Currency types and utilities
export type Currency = 'AUD' | 'USD' | 'EUR' | 'GBP' | 'CAD';

export interface CurrencyRate {
  currency: Currency;
  rate: number;
  symbol: string;
  name: string;
}

// Default currency rates (will be updated with live data)
export const CURRENCY_RATES: Record<Currency, CurrencyRate> = {
  AUD: { currency: 'AUD', rate: 1, symbol: 'A$', name: 'Australian Dollar' },
  USD: { currency: 'USD', rate: 0.65, symbol: '$', name: 'US Dollar' },
  EUR: { currency: 'EUR', rate: 0.60, symbol: '€', name: 'Euro' },
  GBP: { currency: 'GBP', rate: 0.52, symbol: '£', name: 'British Pound' },
  CAD: { currency: 'CAD', rate: 0.89, symbol: 'C$', name: 'Canadian Dollar' },
};

// Convert amount from AUD to target currency
export function convertFromAUD(amount: number, targetCurrency: Currency): number {
  const rate = CURRENCY_RATES[targetCurrency].rate;
  return Math.round(amount * rate * 100) / 100;
}

// Convert amount from target currency back to AUD
export function convertToAUD(amount: number, fromCurrency: Currency): number {
  const rate = CURRENCY_RATES[fromCurrency].rate;
  return Math.round(amount / rate * 100) / 100;
}

// Format currency amount
export function formatCurrency(amount: number, currency: Currency): string {
  const rate = CURRENCY_RATES[currency];
  return `${rate.symbol}${amount.toFixed(2)}`;
}

// Get currency symbol
export function getCurrencySymbol(currency: Currency): string {
  return CURRENCY_RATES[currency].symbol;
}

// Fetch live exchange rates from API
export async function fetchLiveRates(): Promise<Record<Currency, number>> {
  try {
    // Using a free exchange rate API
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/AUD');
    const data = await response.json();
    
    return {
      AUD: 1,
      USD: data.rates.USD || 0.65,
      EUR: data.rates.EUR || 0.60,
      GBP: data.rates.GBP || 0.52,
      CAD: data.rates.CAD || 0.89,
    };
  } catch (error) {
    console.error('Failed to fetch live rates:', error);
    // Return default rates if API fails
    return {
      AUD: 1,
      USD: 0.65,
      EUR: 0.60,
      GBP: 0.52,
      CAD: 0.89,
    };
  }
}

// Update currency rates with live data
export function updateCurrencyRates(rates: Record<Currency, number>) {
  Object.entries(rates).forEach(([currency, rate]) => {
    if (CURRENCY_RATES[currency as Currency]) {
      CURRENCY_RATES[currency as Currency].rate = rate;
    }
  });
}


