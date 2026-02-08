/**
 * Auto-Save Daily Report Hook
 * Watches daily report data and auto-saves to daily_reports table
 * with a 2-second debounce to avoid excessive writes.
 */

import { useEffect, useRef } from 'react';
import { useDailyReport, useSaveDailyReport } from '@/hooks/useReportData';
import { getBusinessDate } from '@/lib/timezone';
import { isWeekendOrHoliday, calculateDailyBonus } from '@/types/cast';
import type { SettingsMap } from '@/hooks/useSettings';

export function useAutoSaveDailyReport(
  storeId: number | null,
  settings?: SettingsMap
) {
  const businessDate = getBusinessDate();
  const { data: report } = useDailyReport(storeId || 1, businessDate);
  const saveReport = useSaveDailyReport();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string>('');

  useEffect(() => {
    if (!storeId || !report) return;

    // Build a fingerprint of the reportdata we care about
    const fingerprint = `${report.sales}-${report.groups}-${report.cardSales}`;
    if (fingerprint === lastSavedRef.current) return;

    // Clear existing debounce timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      const isWH = isWeekendOrHoliday(businessDate);
      const bonusSettings = settings ? {
        thresholdWeekday: Number(settings.bonus_threshold_weekday) || 400000,
        thresholdWeekend: Number(settings.bonus_threshold_weekend) || 500000,
        increment: Number(settings.bonus_increment) || 400000,
        baseBonus: Number(settings.bonus_base) || 200,
        maxBonus: Number(settings.bonus_max) || 600,
      } : undefined;

      const { bonusPerPoint } = calculateDailyBonus(
        report.sales,
        0, // points not relevant for report save
        isWH,
        bonusSettings
      );

      // Determine bonus tier from sales
      const baseThreshold = isWH
        ? (bonusSettings?.thresholdWeekend ?? 500000)
        : (bonusSettings?.thresholdWeekday ?? 400000);
      const increment = bonusSettings?.increment ?? 400000;
      const bonusTier = report.sales >= baseThreshold
        ? 1 + Math.floor((report.sales - baseThreshold) / increment)
        : 0;

      saveReport.mutate({
        storeId,
        date: businessDate,
        totalSales: report.sales,
        totalBills: report.groups,
        totalCustomers: report.groups,
        isWeekendHoliday: isWH,
        bonusTier,
        bonusPerPoint,
      });

      lastSavedRef.current = fingerprint;
    }, 2000);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [storeId, report, businessDate, settings, saveReport]);
}
