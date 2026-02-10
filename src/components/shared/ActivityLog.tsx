/**
 * Activity Log Component
 * Chronological timeline of orders, cancellations, price adjustments, and extensions
 * Used by both cast and staff screens
 */

import { ScrollArea } from '@/components/ui/scroll-area';
import { formatJPY } from '@/types/billing';
import type { Order } from '@/types/cast';
import type { PriceAdjustment } from '@/types/staff';

interface ActivityLogProps {
  orders: Order[];
  adjustments: PriceAdjustment[];
  maxHeight?: string;
}

interface LogEntry {
  timestamp: Date;
  type: 'order_added' | 'order_cancelled' | 'extension' | 'adjustment';
  label: string;
  detail?: string;
  amount?: string;
  amountClass?: string;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

const TYPE_STYLES: Record<LogEntry['type'], { dot: string; label: string }> = {
  order_added: { dot: 'bg-green-500', label: '追加' },
  order_cancelled: { dot: 'bg-red-500', label: 'キャンセル' },
  extension: { dot: 'bg-blue-500', label: '延長' },
  adjustment: { dot: 'bg-amber-500', label: '調整' },
};

export function ActivityLog({ orders, adjustments, maxHeight = '300px' }: ActivityLogProps) {
  const entries: LogEntry[] = [];

  // Order events
  orders.forEach(order => {
    const productName = order.product?.name_jp || '不明';
    const isExtension = order.product?.category === 'extension';

    // Order added event
    entries.push({
      timestamp: new Date(order.created_at),
      type: isExtension ? 'extension' : 'order_added',
      label: productName,
      detail: order.quantity > 1 ? `×${order.quantity}` : undefined,
      amount: formatJPY(order.unit_price * order.quantity),
    });

    // Order cancelled event (separate entry)
    if (order.is_cancelled && order.cancelled_at) {
      entries.push({
        timestamp: new Date(order.cancelled_at),
        type: 'order_cancelled',
        label: productName,
        detail: order.cancel_reason || undefined,
        amount: `-${formatJPY(order.unit_price * order.quantity)}`,
        amountClass: 'text-destructive',
      });
    }
  });

  // Adjustment events
  adjustments.forEach(adj => {
    const isDiscount = adj.adjusted_amount < 0;
    entries.push({
      timestamp: new Date(adj.created_at),
      type: 'adjustment',
      label: adj.reason || (isDiscount ? '値引き' : '追加料金'),
      amount: `${adj.adjusted_amount > 0 ? '+' : ''}${formatJPY(adj.adjusted_amount)}`,
      amountClass: isDiscount ? 'text-destructive' : 'text-green-600',
    });
  });

  // Sort by timestamp ascending (oldest first)
  entries.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  if (entries.length === 0) {
    return (
      <p className="text-center text-sm text-muted-foreground py-8">
        まだログがありません
      </p>
    );
  }

  return (
    <ScrollArea style={{ height: maxHeight }}>
      <div className="space-y-1 pr-2">
        {entries.map((entry, idx) => {
          const style = TYPE_STYLES[entry.type];
          return (
            <div
              key={idx}
              className="flex items-start gap-2 py-1.5 border-b border-border/50 last:border-0"
            >
              {/* Time */}
              <span className="text-[11px] text-muted-foreground tabular-nums shrink-0 pt-0.5">
                {formatTime(entry.timestamp)}
              </span>

              {/* Dot */}
              <span className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${style.dot}`} />

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className={`text-xs font-medium truncate ${entry.type === 'order_cancelled' ? 'line-through opacity-60' : ''}`}>
                    {entry.label}
                  </span>
                  {entry.amount && (
                    <span className={`text-xs tabular-nums shrink-0 ${entry.amountClass || ''}`}>
                      {entry.amount}
                    </span>
                  )}
                </div>
                {entry.detail && (
                  <p className="text-[10px] text-muted-foreground truncate">
                    {entry.detail}
                  </p>
                )}
              </div>

              {/* Type badge */}
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full shrink-0 ${
                entry.type === 'order_cancelled' ? 'bg-red-500/10 text-red-500' :
                entry.type === 'extension' ? 'bg-blue-500/10 text-blue-500' :
                entry.type === 'adjustment' ? 'bg-amber-500/10 text-amber-500' :
                'bg-green-500/10 text-green-500'
              }`}>
                {style.label}
              </span>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
