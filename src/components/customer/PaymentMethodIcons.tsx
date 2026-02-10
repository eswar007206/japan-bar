/**
 * Payment Method Selector Component
 * Allows customers to select their payment method
 * Selection is persisted to the database and reflected on staff terminal
 */

import { PaymentMethod } from '@/types/billing';
import { Banknote, CreditCard, QrCode, Smartphone, Wallet } from 'lucide-react';

interface PaymentMethodIconsProps {
  methods: PaymentMethod[];
  selectedMethod?: PaymentMethod | null;
  onSelectMethod?: (method: PaymentMethod) => void;
  isUpdating?: boolean;
}

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cash: '現金',
  card: 'カード',
  qr: 'QR決済',
  contactless: 'タッチ決済',
  split: '現金+カード',
};

const PAYMENT_ICONS: Record<PaymentMethod, React.ComponentType<{ className?: string }>> = {
  cash: Banknote,
  card: CreditCard,
  qr: QrCode,
  contactless: Smartphone,
  split: Wallet,
};

export function PaymentMethodIcons({ methods, selectedMethod, onSelectMethod, isUpdating }: PaymentMethodIconsProps) {
  // All selectable methods including split
  const allMethods: PaymentMethod[] = [...methods, 'split'];

  return (
    <div className="grid grid-cols-2 gap-3">
      {allMethods.map((method) => {
        const Icon = PAYMENT_ICONS[method];
        const label = PAYMENT_LABELS[method];
        const isSelected = selectedMethod === method;

        return (
          <button
            key={method}
            onClick={() => onSelectMethod?.(method)}
            disabled={isUpdating}
            className={`
              flex items-center gap-3 rounded-xl px-4 py-3 transition-all
              ${isSelected
                ? 'bg-primary/15 border-2 border-primary shadow-sm'
                : 'bg-muted/50 border-2 border-transparent hover:bg-muted/80 hover:border-muted-foreground/20'
              }
              ${isUpdating ? 'opacity-50 cursor-wait' : 'cursor-pointer active:scale-[0.97]'}
            `}
          >
            <Icon className={`h-5 w-5 shrink-0 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
            <span className={`text-sm font-medium ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}>
              {label}
            </span>
            {isSelected && (
              <span className="ml-auto text-primary text-xs font-semibold">
                &#10003;
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
