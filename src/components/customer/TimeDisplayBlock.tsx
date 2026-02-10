/**
 * Time Display Block Component
 * Shows start time and remaining time
 * Displays negative time as "-X分" with red warning styling
 */

import { formatStartTime, formatMinutes } from '@/types/billing';

interface TimeDisplayBlockProps {
  startTime: string;
  elapsedMinutes: number;
  remainingMinutes: number;
}

export function TimeDisplayBlock({
  startTime,
  remainingMinutes,
}: TimeDisplayBlockProps) {
  const isOverdue = remainingMinutes < 0;
  const isWarning = remainingMinutes <= 5;

  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-6">
      {/* Start Time */}
      <div className="text-center">
        <p className="bill-time-label mb-1">ご着席</p>
        <p className="bill-time-value">{formatStartTime(startTime)}</p>
      </div>

      {/* Remaining Time */}
      <div className="text-center">
        <p className="bill-time-label mb-1">残り時間</p>
        <p
          className={`bill-time-value ${
            isOverdue ? 'text-destructive font-bold' : isWarning ? 'bill-time-warning' : ''
          }`}
        >
          {formatMinutes(remainingMinutes)}
        </p>
      </div>
    </div>
  );
}
