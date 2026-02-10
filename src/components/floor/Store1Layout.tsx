/**
 * Store 1 (北口) Floor Layout
 * Based on blueprint:
 * - A卓: 9 seats (vertical bar on left, seats 1-9 from bottom to top)
 * - B卓: 3 seats (horizontal bar at top, seats 1-3)
 * - C卓: 3 seats (vertical bar on right, seats 1-3)
 * - Karaoke area (top left)
 * - Darts area (bottom center)
 * - Entrance (right side)
 */

import { formatJPY } from '@/types/billing';
import type { FloorTable } from '@/types/cast';

interface Store1LayoutProps {
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
      <span className="writing-vertical">{label}</span>
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

export default function Store1Layout({ tables, onTableClick }: Store1LayoutProps) {
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
  const cTables = tables.filter(t => t.label.startsWith('C')).sort((a, b) => {
    const numA = parseInt(a.label.slice(1));
    const numB = parseInt(b.label.slice(1));
    return numA - numB;
  });

  return (
    <div className="relative mx-auto w-full max-w-md rounded-xl border border-border bg-card/30 p-4">
      {/* Store name */}
      <div className="absolute -top-3 left-4 bg-background px-2 text-xs font-medium text-muted-foreground">
        北口店
      </div>
      
      <div className="grid grid-cols-12 gap-2" style={{ minHeight: '400px' }}>
        {/* Top Row: Karaoke + B卓 */}
        <AreaLabel label="カラオケ" className="col-span-3 row-span-2 rounded-lg" />
        
        {/* B卓 (horizontal bar with 3 seats below) */}
        <div className="col-span-6 flex flex-col items-center gap-1">
          <CounterBar label="B卓" className="h-8 w-full rounded-lg" />
          <div className="flex gap-2">
            {bTables.map((table) => (
              <TableSeat 
                key={table.id} 
                table={table} 
                onClick={() => onTableClick(table)} 
              />
            ))}
          </div>
        </div>
        
        {/* Empty top right */}
        <div className="col-span-3" />
        
        {/* Main floor area */}
        {/* Left side: A卓 (vertical bar with seats on right) */}
        <div className="col-span-4 row-span-6 flex gap-1">
          <CounterBar label="A卓" className="w-10 h-full rounded-lg [writing-mode:vertical-rl]" />
          <div className="flex flex-col-reverse justify-between py-1">
            {aTables.map((table) => (
              <TableSeat 
                key={table.id} 
                table={table} 
                onClick={() => onTableClick(table)} 
              />
            ))}
          </div>
        </div>
        
        {/* Center area (empty floor space) */}
        <div className="col-span-4 row-span-6" />
        
        {/* Right side: C卓 + Entrance */}
        <div className="col-span-4 row-span-6 flex flex-col gap-2">
          {/* C卓 */}
          <div className="flex flex-1 gap-1">
            <CounterBar label="C卓" className="w-10 rounded-lg [writing-mode:vertical-rl]" />
            <div className="flex flex-col justify-between py-1">
              {cTables.map((table) => (
                <TableSeat 
                  key={table.id} 
                  table={table} 
                  onClick={() => onTableClick(table)} 
                />
              ))}
            </div>
          </div>
          {/* Entrance */}
          <AreaLabel label="入口" className="h-16 rounded-lg" />
        </div>
        
        {/* Bottom Row: Darts */}
        <div className="col-span-4" />
        <AreaLabel label="ダーツ" className="col-span-4 h-12 rounded-lg" />
        <div className="col-span-4" />
      </div>
    </div>
  );
}
