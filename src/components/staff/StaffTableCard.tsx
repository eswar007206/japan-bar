/**
 * Staff Table Card
 * Displays table status with session info and actions
 */

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Square, 
  Plus, 
  Users, 
  Clock, 
  AlertTriangle,
  ChevronRight 
} from 'lucide-react';
import { formatJPY, calculateCardTaxAmount, isCardTaxApplicable } from '@/types/billing';
import type { FloorTable } from '@/types/cast';
import type { TableSession } from '@/types/staff';
import { SEATING_TYPE_LABELS } from '@/types/staff';

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: '現金',
  card: 'カード',
  qr: 'QR決済',
  contactless: 'タッチ',
  split: '現金+カード',
};

interface TableWithSession extends FloorTable {
  bill?: TableSession | null;
}

interface StaffTableCardProps {
  table: TableWithSession;
  onStartSession: (tableId: string) => void;
  onEndSession: (billId: string) => void;
  onExtendTime: (billId: string) => void;
  onViewDetails: (table: TableWithSession) => void;
}

export default function StaffTableCard({
  table,
  onStartSession,
  onEndSession,
  onExtendTime,
  onViewDetails,
}: StaffTableCardProps) {
  const session = table.bill;
  const hasSession = !!session;
  const isLowTime = hasSession && session.remaining_minutes !== undefined && session.remaining_minutes <= 5;
  const isOverdue = hasSession && session.remaining_minutes !== undefined && session.remaining_minutes <= 0;

  // Determine status color
  const getStatusStyles = () => {
    if (!hasSession) return 'border-border bg-card';
    if (isOverdue) return 'border-destructive bg-destructive/10';
    if (isLowTime) return 'border-orange-500 bg-orange-500/10';
    return 'border-primary bg-primary/5';
  };

  return (
    <Card
      className={`relative transition-all ${getStatusStyles()} cursor-pointer hover:shadow-md ${isOverdue ? 'animate-pulse-border' : ''}`}
      onClick={() => onViewDetails(table)}
    >
      <CardContent className="p-3">
        {/* Table Label & Status */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold">{table.label}</span>
            {hasSession && (
              <Badge 
                variant={isOverdue ? 'destructive' : isLowTime ? 'outline' : 'default'}
                className="text-[10px]"
              >
                {SEATING_TYPE_LABELS[session.seating_type]}
              </Badge>
            )}
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>

        {hasSession ? (
          <>
            {/* Session Info */}
            <div className="space-y-1.5 mb-3">
              {/* Time */}
              <div className="flex items-center gap-1.5">
                <Clock className={`h-3.5 w-3.5 ${isOverdue ? 'text-destructive' : isLowTime ? 'text-orange-500' : 'text-muted-foreground'}`} />
                <span className={`text-sm font-medium ${isOverdue ? 'text-destructive font-bold' : isLowTime ? 'text-orange-500' : ''}`}>
                  {isOverdue
                    ? `-${Math.abs(session.remaining_minutes!)}分`
                    : `残 ${session.remaining_minutes}分`
                  }
                </span>
                {isOverdue && <AlertTriangle className="h-3.5 w-3.5 text-destructive animate-pulse" />}
              </div>

              {/* Amount - colored based on payment method */}
              {(() => {
                const pm = session.payment_method;
                const baseAmount = session.current_total || 0;
                const hasCardTax = isCardTaxApplicable(pm as any);
                const displayAmount = hasCardTax ? calculateCardTaxAmount(baseAmount) : baseAmount;
                const amountColor = pm && pm !== 'cash' ? 'text-red-600' : 'text-foreground';

                return (
                  <div>
                    <div className={`text-lg font-bold ${amountColor}`}>
                      {formatJPY(displayAmount)}
                    </div>
                    {pm && (
                      <div className={`text-[10px] font-medium ${pm !== 'cash' ? 'text-red-500' : 'text-muted-foreground'}`}>
                        {PAYMENT_METHOD_LABELS[pm] || pm}
                        {hasCardTax && ' (税込)'}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Extension count indicator (for auto-upgrade tracking) */}
              {session.seating_type === 'free' && session.extension_count !== undefined && session.extension_count > 0 && (
                <div className={`text-xs font-medium ${session.extension_count >= 2 ? 'text-pink-500' : 'text-muted-foreground'}`}>
                  延長{session.extension_count}回目 
                  {session.extension_count === 2 && ' → 次で本指名昇格！'}
                </div>
              )}

              {/* Cast assignments */}
              {session.assigned_casts && session.assigned_casts.length > 0 && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground min-w-0">
                  <Users className="h-3 w-3 shrink-0" />
                  <span className="truncate">{session.assigned_casts.map(c => c.cast_name).join(', ')}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-1.5">
              <Button 
                size="sm" 
                variant="outline" 
                className="flex-1 h-8 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  onExtendTime(session.id);
                }}
              >
                <Plus className="h-3 w-3 mr-1" />
                延長
              </Button>
              <Button 
                size="sm" 
                variant="destructive" 
                className="flex-1 h-8 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  onEndSession(session.id);
                }}
              >
                <Square className="h-3 w-3 mr-1" />
                会計
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* Empty state */}
            <div className="py-4 text-center">
              <p className="text-sm text-muted-foreground mb-3">空席</p>
              <Button 
                size="sm" 
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  onStartSession(table.id);
                }}
              >
                <Play className="h-3.5 w-3.5 mr-1" />
                セッション開始
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
