/**
 * Daily Report Sheet (日計表)
 * Simplified to show only client-requested fields:
 * - Store name + date
 * - Total sales, group count, avg per customer
 * - Hourly entry breakdown
 * - Payment method breakdown (cash vs card)
 * - Bonus status
 * - Save button
 */

import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatJPY } from '@/types/billing';
import { useDailyReport, useSaveDailyReport } from '@/hooks/useReportData';
import { isWeekendOrHoliday, calculateDailyBonus } from '@/types/cast';
import { toast } from 'sonner';
import type { SettingsMap } from '@/hooks/useSettings';

interface DailyReportSheetProps {
  storeId: number | 'both';
  date: Date;
  settings?: SettingsMap;
}

export default function DailyReportSheet({
  storeId,
  date,
  settings,
}: DailyReportSheetProps) {
  const { data, isLoading } = useDailyReport(storeId, date);
  const saveDailyReport = useSaveDailyReport();

  const dateStr = format(date, 'yyyy年M月d日 (E)', { locale: ja });
  const storeName = storeId === 'both' ? '亀有 Fairy (1号店&2号店)' :
    storeId === 1 ? '亀有 Fairy (1号店)' : '亀有 Fairy (2号店)';

  const isWeekend = isWeekendOrHoliday(date);
  const bonusInfo = data ? calculateDailyBonus(data.sales, 0, isWeekend, {
    thresholdWeekday: settings?.bonus_threshold_weekday,
    thresholdWeekend: settings?.bonus_threshold_weekend,
    increment: settings?.bonus_increment,
    baseBonus: settings?.bonus_base_per_point,
    maxBonus: settings?.bonus_max_per_point,
  }) : null;

  const handleCloseDay = async () => {
    if (storeId === 'both') {
      toast.error('店舗を選択してください');
      return;
    }
    if (!data) return;

    try {
      await saveDailyReport.mutateAsync({
        storeId,
        date,
        totalSales: data.sales,
        totalBills: data.groups,
        totalCustomers: data.groups,
        isWeekendHoliday: isWeekend,
        bonusTier: bonusInfo?.qualified ? 1 : 0,
        bonusPerPoint: bonusInfo?.bonusPerPoint || 0,
      });
      toast.success('日報を保存しました');
    } catch (error) {
      toast.error('日報の保存に失敗しました');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const report = data || {
    groups: 0,
    avgPerCustomer: 0,
    hourlyEntries: {} as Record<string, number>,
    sales: 0,
    cardSales: 0,
    cashSales: 0,
  };

  const cashSales = report.sales - report.cardSales;
  const hours = ['19時', '20時', '21時', '22時', '23時', '0時', '1時', '2時', '3時', '4時'];

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between bg-muted/30 py-3">
        <div>
          <CardTitle className="text-base">{storeName}</CardTitle>
          <p className="text-sm text-muted-foreground">日計表 {dateStr}</p>
        </div>
        <Button
          variant="default"
          size="sm"
          onClick={handleCloseDay}
          disabled={saveDailyReport.isPending || storeId === 'both'}
        >
          <Save className="h-4 w-4 mr-1" />
          日締め保存
        </Button>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* Key Metrics */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border border-border p-3 text-center">
            <p className="text-xs text-muted-foreground">売上</p>
            <p className="text-xl font-bold text-primary">{formatJPY(report.sales)}</p>
          </div>
          <div className="rounded-lg border border-border p-3 text-center">
            <p className="text-xs text-muted-foreground">組数</p>
            <p className="text-xl font-bold">{report.groups}<span className="text-sm font-normal text-muted-foreground ml-1">組</span></p>
          </div>
          <div className="rounded-lg border border-border p-3 text-center">
            <p className="text-xs text-muted-foreground">客単価</p>
            <p className="text-xl font-bold">{formatJPY(report.avgPerCustomer)}</p>
          </div>
        </div>

        {/* Payment Method Breakdown */}
        <div className="rounded-lg border border-border p-3">
          <p className="text-xs text-muted-foreground mb-2">支払方法</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">現金</span>
              <span className="text-sm font-medium">{formatJPY(cashSales)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">カード</span>
              <span className="text-sm font-medium">{formatJPY(report.cardSales)}</span>
            </div>
          </div>
        </div>

        {/* Hourly Entries */}
        <div className="rounded-lg border border-border p-3">
          <p className="text-xs text-muted-foreground mb-2">時間別来客数</p>
          <div className="grid grid-cols-10 gap-1">
            {hours.map(hour => (
              <div key={hour} className="text-center">
                <p className="text-[10px] text-muted-foreground">{hour}</p>
                <p className="text-sm font-medium">
                  {report.hourlyEntries[hour] || 0}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Bonus Status */}
        <div className={`rounded-lg border p-3 ${bonusInfo?.qualified ? 'border-green-500/50 bg-green-50 dark:bg-green-950/20' : 'border-border'}`}>
          <p className="text-xs text-muted-foreground mb-1">大入りステータス</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">
                {isWeekend ? '金土祝前日' : '平日'}ボーダー: {formatJPY(isWeekend
                  ? (settings?.bonus_threshold_weekend ?? 500000)
                  : (settings?.bonus_threshold_weekday ?? 400000)
                )}
              </p>
              {bonusInfo?.qualified && (
                <p className="text-xs text-green-600 dark:text-green-400">
                  大入り達成 — {formatJPY(bonusInfo.bonusPerPoint)}/pt
                </p>
              )}
            </div>
            <span className={`text-lg font-bold ${bonusInfo?.qualified ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
              {bonusInfo?.qualified ? '達成' : '未達成'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
