/**
 * Preparing State Component
 * Shown when no open bill exists for the table
 */

import { Clock } from 'lucide-react';

export function PreparingState() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="text-center space-y-4">
        <Clock className="mx-auto h-12 w-12 text-muted-foreground" />
        <h1 className="text-2xl font-semibold">準備中</h1>
        <p className="text-muted-foreground max-w-xs mx-auto">
          只今、テーブルの準備を行っております。
          しばらくお待ちください。
        </p>
      </div>
    </div>
  );
}
