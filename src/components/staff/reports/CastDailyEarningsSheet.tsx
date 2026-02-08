/**
 * Cast Daily Earnings Sheet (キャスト日払い表)
 * Matches the handwritten sheet from Image 4
 * Shows: cast name, clock in/out, time wage, backs by category, drink/champagne, daily pay
 */

import { useState } from 'react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Printer, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatJPY } from '@/types/billing';
import { useDailyCastEarnings } from '@/hooks/useReportData';
import type { SettingsMap } from '@/hooks/useSettings';

interface CastDailyEarningsSheetProps {
  storeId: number;
  date: Date;
  storeName: string;
  settings?: SettingsMap;
}

export default function CastDailyEarningsSheet({
  storeId,
  date,
  storeName,
  settings,
}: CastDailyEarningsSheetProps) {
  const { data, isLoading } = useDailyCastEarnings(storeId, date, settings);
  
  const dateStr = format(date, 'yyyy年M月d日 (E)', { locale: ja });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const totalPayouts = data?.reduce((sum, c) => sum + c.net_payout, 0) || 0;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between bg-muted/30 py-3">
        <div>
          <CardTitle className="text-base">
            {storeName}
          </CardTitle>
          <p className="text-sm text-muted-foreground">{dateStr}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Printer className="h-4 w-4 mr-1" />
            印刷
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {/* Table Header */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-2 py-2 text-left font-medium w-8">#</th>
                <th className="px-2 py-2 text-left font-medium min-w-[60px]">名前</th>
                <th className="px-2 py-2 text-center font-medium">出勤</th>
                <th className="px-2 py-2 text-center font-medium">退勤</th>
                <th className="px-2 py-2 text-right font-medium">分</th>
                <th className="px-2 py-2 text-right font-medium min-w-[70px]">時間給</th>
                {/* Backs by type */}
                <th className="px-1 py-2 text-center font-medium border-l border-border">本20</th>
                <th className="px-1 py-2 text-center font-medium">本40</th>
                <th className="px-1 py-2 text-center font-medium">場内</th>
                <th className="px-1 py-2 text-center font-medium">同伴</th>
                {/* Drinks */}
                <th className="px-1 py-2 text-center font-medium border-l border-border">本S</th>
                <th className="px-1 py-2 text-center font-medium">本M</th>
                <th className="px-1 py-2 text-center font-medium">本L</th>
                <th className="px-1 py-2 text-center font-medium">ショ</th>
                {/* Champagne */}
                <th className="px-1 py-2 text-center font-medium border-l border-border">シャンパン</th>
                {/* Totals */}
                <th className="px-2 py-2 text-right font-medium border-l border-border min-w-[60px]">バック計</th>
                <th className="px-2 py-2 text-right font-medium min-w-[80px]">日払い額</th>
                <th className="px-2 py-2 text-right font-medium min-w-[50px]">P</th>
                <th className="px-2 py-2 text-center font-medium">送り</th>
              </tr>
            </thead>
            <tbody>
              {(!data || data.length === 0) ? (
                <tr>
                  <td colSpan={19} className="px-4 py-8 text-center text-muted-foreground">
                    データがありません
                  </td>
                </tr>
              ) : (
                <>
                  {data.map((cast, index) => (
                    <tr key={cast.cast_id} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="px-2 py-2 text-muted-foreground">{index + 1}</td>
                      <td className="px-2 py-2 font-medium">{cast.cast_name}</td>
                      <td className="px-2 py-2 text-center text-muted-foreground">
                        {cast.clock_in ? format(new Date(cast.clock_in), 'HH:mm') : '-'}
                      </td>
                      <td className="px-2 py-2 text-center text-muted-foreground">
                        {cast.clock_out ? format(new Date(cast.clock_out), 'HH:mm') : '-'}
                      </td>
                      <td className="px-2 py-2 text-right">{cast.work_minutes}</td>
                      <td className="px-2 py-2 text-right font-medium">
                        {formatJPY(cast.time_pay)}
                      </td>
                      {/* Backs by type */}
                      <td className="px-1 py-2 text-center border-l border-border/50">
                        {cast.backs.designation_20 || '-'}
                      </td>
                      <td className="px-1 py-2 text-center">
                        {cast.backs.designation_40 || '-'}
                      </td>
                      <td className="px-1 py-2 text-center">
                        {cast.backs.inhouse || '-'}
                      </td>
                      <td className="px-1 py-2 text-center">
                        {cast.backs.companion || '-'}
                      </td>
                      {/* Drinks */}
                      <td className="px-1 py-2 text-center border-l border-border/50">
                        {cast.drinks.s || '-'}
                      </td>
                      <td className="px-1 py-2 text-center">
                        {cast.drinks.m || '-'}
                      </td>
                      <td className="px-1 py-2 text-center">
                        {cast.drinks.l || '-'}
                      </td>
                      <td className="px-1 py-2 text-center">
                        {cast.drinks.shot || '-'}
                      </td>
                      {/* Champagne */}
                      <td className="px-1 py-2 text-center border-l border-border/50">
                        {cast.champagne_points > 0 ? `${cast.champagne_points}P` : '-'}
                      </td>
                      {/* Totals */}
                      <td className="px-2 py-2 text-right border-l border-border/50">
                        {formatJPY(cast.total_backs)}
                      </td>
                      <td className="px-2 py-2 text-right font-bold text-primary">
                        {formatJPY(cast.net_payout)}
                      </td>
                      <td className="px-2 py-2 text-right text-muted-foreground">
                        {cast.total_points}
                      </td>
                      <td className="px-2 py-2 text-center">
                        {cast.transport_fee > 0 ? '○' : '-'}
                      </td>
                    </tr>
                  ))}
                  {/* Add empty rows to match paper sheet */}
                  {Array.from({ length: Math.max(0, 12 - (data?.length || 0)) }).map((_, i) => (
                    <tr key={`empty-${i}`} className="border-b border-border/30 h-8">
                      <td className="px-2 py-2 text-muted-foreground/50">{(data?.length || 0) + i + 1}</td>
                      <td colSpan={18}></td>
                    </tr>
                  ))}
                </>
              )}
            </tbody>
            <tfoot>
              <tr className="bg-muted/50 font-medium">
                <td colSpan={16} className="px-4 py-2 text-right">合計</td>
                <td className="px-2 py-2 text-right text-lg font-bold text-primary">
                  {formatJPY(totalPayouts)}
                </td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
