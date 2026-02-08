/**
 * Offline Warning Component
 * Soft warning when connection is lost
 */

import { WifiOff } from 'lucide-react';

interface OfflineWarningProps {
  message?: string;
}

export function OfflineWarning({ 
  message = '接続が失われました。スタッフにお知らせください。' 
}: OfflineWarningProps) {
  return (
    <div className="animate-soft-pulse fixed inset-x-0 top-0 z-50 bg-destructive/90 px-4 py-3">
      <div className="flex items-center justify-center gap-3">
        <WifiOff className="h-5 w-5 text-destructive-foreground" />
        <p className="text-sm font-medium text-destructive-foreground">
          {message}
        </p>
      </div>
    </div>
  );
}
