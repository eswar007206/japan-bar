/**
 * Total Amount Display Component
 * Large, prominent display of the bill's running total on the customer screen
 * Shows card tax (10%, ceil to ¥100) in red for non-cash payments
 */

import { formatJPY, calculateCardTaxAmount, isCardTaxApplicable, type PaymentMethod } from '@/types/billing';

interface TotalAmountDisplayProps {
  amount: number;
  paymentMethod?: PaymentMethod | null;
}

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: '現金',
  card: 'カード',
  qr: 'QR決済',
  contactless: 'タッチ決済',
  split: '現金+カード',
};

export function TotalAmountDisplay({ amount, paymentMethod }: TotalAmountDisplayProps) {
  const hasCardTax = isCardTaxApplicable(paymentMethod);
  const displayAmount = hasCardTax ? calculateCardTaxAmount(amount) : amount;
  const amountColorClass = hasCardTax ? 'text-red-600' : 'text-foreground';

  return (
    <div className="bill-total-container">
      <p className={`bill-total-amount ${amountColorClass}`}>
        {formatJPY(displayAmount)}
      </p>
      {paymentMethod && (
        <p className={`mt-1 text-sm font-medium ${hasCardTax ? 'text-red-500' : 'text-muted-foreground'}`}>
          {PAYMENT_METHOD_LABELS[paymentMethod]}
          {hasCardTax && (
            <span className="ml-2 text-xs">（カード税 10%）</span>
          )}
        </p>
      )}
      {hasCardTax && (
        <p className="mt-0.5 text-xs text-muted-foreground">
          元の金額: {formatJPY(amount)}
        </p>
      )}
    </div>
  );
}
