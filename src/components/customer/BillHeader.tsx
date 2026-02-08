/**
 * Bill Header Component
 * Shows store name and table number
 */

interface BillHeaderProps {
  storeName: string;
  tableLabel: string;
}

export function BillHeader({ storeName, tableLabel }: BillHeaderProps) {
  return (
    <div className="text-center space-y-2">
      <p className="text-sm font-medium text-muted-foreground tracking-wide">
        {storeName}
      </p>
      <p className="text-3xl sm:text-4xl font-bold tracking-tight">
        {tableLabel}
      </p>
    </div>
  );
}
