/**
 * Payment Method Icons Component
 * Displays accepted payment methods with icons and labels
 */

import { PaymentMethod } from '@/types/billing';
import { Banknote, CreditCard, QrCode, Smartphone } from 'lucide-react';

interface PaymentMethodIconsProps {
  methods: PaymentMethod[];
}

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cash: '現金',
  card: 'カード',
  qr: 'QR決済',
  contactless: 'タッチ決済',
};

const PAYMENT_ICONS: Record<PaymentMethod, React.ComponentType<{ className?: string }>> = {
  cash: Banknote,
  card: CreditCard,
  qr: QrCode,
  contactless: Smartphone,
};

export function PaymentMethodIcons({ methods }: PaymentMethodIconsProps) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-4">
      {methods.map((method) => {
        const Icon = PAYMENT_ICONS[method];
        const label = PAYMENT_LABELS[method];
        
        return (
          <div
            key={method}
            className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2"
          >
            <Icon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{label}</span>
          </div>
        );
      })}
    </div>
  );
}
