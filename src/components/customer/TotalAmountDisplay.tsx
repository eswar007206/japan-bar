/**
 * Total Amount Display Component
 * Large, high-contrast display of current bill total
 */

import { formatJPY } from '@/types/billing';

interface TotalAmountDisplayProps {
  amount: number;
  label?: string;
}

export function TotalAmountDisplay({ 
  amount, 
  label = '現在の合計金額' 
}: TotalAmountDisplayProps) {
  return (
    <div className="text-center py-6 sm:py-8">
      <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground mb-3">
        {label}
      </p>
      <p className="bill-total-display">
        {formatJPY(amount)}
      </p>
    </div>
  );
}
