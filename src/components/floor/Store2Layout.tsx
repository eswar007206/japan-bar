/**
 * Store 2 (南口) Floor Layout
 * Based on blueprint:
 * - A卓: 5 seats (vertical bar on right, seats 1-5 from bottom to top)
 * - B卓: 5 seats (vertical bar on left, seats 1-5 from bottom to top)
 * - Karaoke area (top center)
 * - Entrance (top left)
 */

import { formatJPY } from '@/types/billing';
import type { FloorTable } from '@/types/cast';

interface Store2LayoutProps {
  tables: FloorTable[];
  onTableClick: (table: FloorTable) => void;
}

function TableSeat({ 
  table, 
  onClick,
  className = '',
}: { 
  table: FloorTable; 
  onClick: () => void;
  className?: string;
}) {
  const hasOpenBill = table.has_open_bill;
  const isLowTime = hasOpenBill && table.remaining_minutes !== undefined && table.remaining_minutes <= 5;
  const isOverdue = hasOpenBill && table.remaining_minutes !== undefined && table.remaining_minutes < 0;
  
  // Extract seat number from label (e.g., "A1" -> "1")
  const seatNum = table.label.replace(/[A-Z]/g, '');
  
  return (
    <button
      onClick={onClick}
      className={`
        flex h-10 w-10 flex-col items-center justify-center rounded-full 
        border-2 text-xs font-bold transition-all
        hover:scale-110 hover:shadow-lg
        ${hasOpenBill 
          ? isLowTime
            ? 'border-destructive bg-destructive/20 text-destructive animate-pulse' 
            : 'border-primary bg-primary/20 text-primary'
          : 'border-border bg-card text-muted-foreground hover:border-primary/50'
        }
        ${className}
      `}
      title={hasOpenBill ? `${formatJPY(table.current_total || 0)} / ${isOverdue ? `-${Math.abs(table.remaining_minutes!)}分` : `残${table.remaining_minutes}分`}` : table.label}
    >
      <span>{seatNum}</span>
      {hasOpenBill && (
        <span className="text-[8px] leading-none">
          {isOverdue ? `-${Math.abs(table.remaining_minutes!)}` : table.remaining_minutes}分
        </span>
      )}
    </button>
  );
}

function CounterBar({ label, className = '' }: { label: string; className?: string }) {
  return (
    <div className={`flex items-center justify-center bg-muted/50 border border-border text-muted-foreground text-sm font-medium ${className}`}>
      <span>{label}</span>
    </div>
  );
}

function AreaLabel({ label, className = '' }: { label: string; className?: string }) {
  return (
    <div className={`flex items-center justify-center border border-dashed border-border/50 bg-muted/20 text-muted-foreground/70 text-xs ${className}`}>
      {label}
    </div>
  );
}

export default function Store2Layout({ tables, onTableClick }: Store2LayoutProps) {
  // Group tables by section
  const aTables = tables.filter(t => t.label.startsWith('A')).sort((a, b) => {
    const numA = parseInt(a.label.slice(1));
    const numB = parseInt(b.label.slice(1));
    return numA - numB;
  });
  const bTables = tables.filter(t => t.label.startsWith('B')).sort((a, b) => {
    const numA = parseInt(a.label.slice(1));
    const numB = parseInt(b.label.slice(1));
    return numA - numB;
  });

  return (
    <div className="relative mx-auto w-full max-w-md rounded-xl border border-border bg-card/30 p-4">
      {/* Store name */}
      <div className="absolute -top-3 left-4 bg-background px-2 text-xs font-medium text-muted-foreground">
        南口店
      </div>
      
      <div className="grid grid-cols-12 gap-2" style={{ minHeight: '350px' }}>
        {/* Top Row: Entrance + Karaoke */}
        <AreaLabel label="入口" className="col-span-3 h-12 rounded-lg" />
        <AreaLabel label="カラオケ" className="col-span-4 h-12 rounded-lg" />
        <div className="col-span-5" />
        
        {/* Main floor area - two parallel bars */}
        {/* Left side: B卓 */}
        <div className="col-span-5 row-span-5 flex gap-1">
          <CounterBar label="B卓" className="w-12 h-full rounded-lg [writing-mode:vertical-rl]" />
          <div className="flex flex-col-reverse justify-between py-2">
            {bTables.map((table) => (
              <TableSeat 
                key={table.id} 
                table={table} 
                onClick={() => onTableClick(table)} 
              />
            ))}
          </div>
        </div>
        
        {/* Center gap */}
        <div className="col-span-2 row-span-5" />
        
        {/* Right side: A卓 */}
        <div className="col-span-5 row-span-5 flex justify-end gap-1">
          <div className="flex flex-col-reverse justify-between py-2">
            {aTables.map((table) => (
              <TableSeat 
                key={table.id} 
                table={table} 
                onClick={() => onTableClick(table)} 
              />
            ))}
          </div>
          <CounterBar label="A卓" className="w-12 h-full rounded-lg [writing-mode:vertical-rl]" />
        </div>
      </div>
    </div>
  );
}
