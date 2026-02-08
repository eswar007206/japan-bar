/**
 * Extension Preview Component
 * Shows the projected total after extension (when remaining time ≤ 5 min)
 */

import { formatJPY } from '@/types/billing';

interface ExtensionPreviewProps {
  extensionTotal: number;
}

export function ExtensionPreview({ extensionTotal }: ExtensionPreviewProps) {
  return (
    <div className="animate-fade-slide-in rounded-xl bg-secondary/20 p-4 sm:p-6 text-center">
      <div className="flex items-center justify-center gap-2 mb-2">
        <span className="text-sm font-medium text-muted-foreground">御延長後</span>
      </div>
      <p className="bill-extension-display">
        {formatJPY(extensionTotal)}
      </p>
      <p className="text-xs text-muted-foreground mt-3">
        ※表示は目安です。最終金額は店頭での精算と一致します。
      </p>
    </div>
  );
}
