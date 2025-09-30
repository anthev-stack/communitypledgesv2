'use client';

import { useCurrency } from '@/contexts/CurrencyContext';

interface PriceDisplayProps {
  amount: number; // Amount in AUD
  className?: string;
  showOriginal?: boolean; // Show original AUD amount in small text
}

export default function PriceDisplay({ 
  amount, 
  className = '', 
  showOriginal = false 
}: PriceDisplayProps) {
  const { formatAmount, selectedCurrency, convertAmount } = useCurrency();
  
  const convertedAmount = convertAmount(amount);
  const isAUD = selectedCurrency === 'AUD';

  return (
    <span className={className}>
      {formatAmount(amount)}
      {showOriginal && !isAUD && (
        <span className="text-xs text-gray-400 ml-1">
          (A${amount.toFixed(2)})
        </span>
      )}
    </span>
  );
}


