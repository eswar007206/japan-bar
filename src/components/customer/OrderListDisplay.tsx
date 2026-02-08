/**
 * Order List Display for Customer Bill
 * Shows ordered items with prices (except food and champagne prices per requirements)
 */

import { formatJPY } from '@/types/billing';
import type { CustomerOrderItem } from '@/types/billing';

interface OrderListDisplayProps {
  items: CustomerOrderItem[];
}

export function OrderListDisplay({ items }: OrderListDisplayProps) {
  if (!items || items.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
        ご注文内容
      </p>
      <div className="space-y-1.5">
        {items.map((item, index) => {
          // Hide prices for champagne/bottles per requirements
          const hidePrice = item.category === 'bottles';

          return (
            <div
              key={index}
              className="flex items-center justify-between"
            >
              <span className="text-sm text-foreground">
                {item.name_jp}
                {item.quantity > 1 && (
                  <span className="ml-1 text-muted-foreground">×{item.quantity}</span>
                )}
              </span>
              {!hidePrice && (
                <span className="text-sm font-medium text-foreground">
                  {formatJPY(item.unit_price * item.quantity)}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
