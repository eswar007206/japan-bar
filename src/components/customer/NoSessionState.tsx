/**
 * No Session State Component
 * Shown when a permanent table QR is scanned but no bill is currently open.
 * Auto-refreshes via polling, so it will update when staff starts a session.
 */

import { Clock } from 'lucide-react';

interface NoSessionStateProps {
  tableLabel?: string;
}

export function NoSessionState({ tableLabel }: NoSessionStateProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="text-center space-y-4">
        <div className="mx-auto h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center">
          <Clock className="h-8 w-8 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-semibold">
          {tableLabel ? `${tableLabel}` : 'テーブル'}
        </h1>
        <p className="text-muted-foreground max-w-xs mx-auto">
          現在セッションは開始されていません。
        </p>
        <p className="text-sm text-muted-foreground/70">
          スタッフがセッションを開始すると自動的に表示されます
        </p>
        <div className="flex items-center justify-center gap-2 pt-4">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-secondary opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-secondary"></span>
          </span>
          <span className="text-xs text-muted-foreground">自動更新中</span>
        </div>
      </div>
    </div>
  );
}
