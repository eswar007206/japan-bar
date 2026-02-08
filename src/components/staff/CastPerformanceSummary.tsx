/**
 * Cast Performance Summary
 * Shows compact daily stats for each active cast member
 */

import { Loader2, Clock } from 'lucide-react';
import { formatJPY } from '@/types/billing';
import { formatWorkTime } from '@/types/cast';
import { useDailyCastEarnings } from '@/hooks/useReportData';
import { getBusinessDate } from '@/lib/timezone';
import type { SettingsMap } from '@/hooks/useSettings';

interface CastPerformanceSummaryProps {
  storeId: number;
  settings?: SettingsMap;
}

export default function CastPerformanceSummary({ storeId, settings }: CastPerformanceSummaryProps) {
  const businessDate = getBusinessDate();
  const { data: castEarnings, isLoading } = useDailyCastEarnings(storeId, businessDate, settings);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!castEarnings || castEarnings.length === 0) {
    return (
      <p className="text-center text-xs text-muted-foreground py-4">
        本日出勤中のキャストはいません
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {castEarnings.map(cast => (
        <div
          key={cast.cast_id}
          className="flex items-center justify-between rounded-lg border border-border p-2.5"
        >
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{cast.cast_name}</p>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
              <span className="flex items-center gap-0.5">
                <Clock className="h-3 w-3" />
                {formatWorkTime(cast.work_minutes)}
              </span>
              <span>バック: {formatJPY(cast.total_backs)}</span>
              <span>D:{cast.drinks.s + cast.drinks.m + cast.drinks.l + cast.drinks.shot}</span>
            </div>
          </div>
          <div className="text-right ml-2 shrink-0">
            <p className="text-sm font-bold text-primary">{formatJPY(cast.net_payout)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
