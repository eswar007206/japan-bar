/**
 * Session Log Sheet (来店記録)
 * Matches the handwritten sheet from Image 6
 * Shows: start time, group#, end time, designation, table, extensions, charge, notes
 */

import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatJPY } from '@/types/billing';
import { useSessionLog } from '@/hooks/useReportData';
import { SEATING_TYPE_LABELS } from '@/types/staff';

interface SessionLogSheetProps {
  storeId: number;
  date: Date;
  storeName: string;
}

export default function SessionLogSheet({
  storeId,
  date,
  storeName,
}: SessionLogSheetProps) {
  const { data, isLoading } = useSessionLog(storeId, date);
  
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

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between bg-muted/30 py-3">
        <div>
          <CardTitle className="text-base">{storeName}</CardTitle>
          <p className="text-sm text-muted-foreground">{dateStr}</p>
        </div>
        <Button variant="outline" size="sm">
          <Printer className="h-4 w-4 mr-1" />
          印刷
        </Button>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-2 py-2 text-center font-medium w-8">#</th>
                <th className="px-2 py-2 text-center font-medium">開始</th>
                <th className="px-2 py-2 text-center font-medium">組</th>
                <th className="px-2 py-2 text-center font-medium">終了</th>
                <th className="px-2 py-2 text-center font-medium">指</th>
                <th className="px-2 py-2 text-center font-medium">卓</th>
                {/* Extension columns 1-7 */}
                {[1, 2, 3, 4, 5, 6, 7].map(n => (
                  <th key={n} className="px-1 py-2 text-center font-medium w-8 border-l border-border/50">
                    {n}
                  </th>
                ))}
                <th className="px-2 py-2 text-right font-medium border-l border-border">料金</th>
                <th className="px-2 py-2 text-left font-medium">備考</th>
                <th className="px-2 py-2 text-right font-medium">合計</th>
              </tr>
            </thead>
            <tbody>
              {(!data || data.length === 0) ? (
                <tr>
                  <td colSpan={15} className="px-4 py-8 text-center text-muted-foreground">
                    データがありません
                  </td>
                </tr>
              ) : (
                <>
                  {data.map((session, index) => (
                    <tr key={session.id} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="px-2 py-2 text-center text-muted-foreground">{index + 1}</td>
                      <td className="px-2 py-2 text-center">
                        {format(new Date(session.start_time), 'HH:mm')}
                      </td>
                      <td className="px-2 py-2 text-center font-medium">
                        {session.customer_count || 1}
                      </td>
                      <td className="px-2 py-2 text-center">
                        {session.close_time 
                          ? format(new Date(session.close_time), 'HH:mm')
                          : <span className="text-muted-foreground">-</span>
                        }
                      </td>
                      <td className="px-2 py-2 text-center">
                        <Badge 
                          variant="outline" 
                          className={`text-[10px] px-1 ${
                            session.seating_type === 'designated' 
                              ? 'border-pink-500 text-pink-500' 
                              : session.seating_type === 'inhouse'
                                ? 'border-blue-500 text-blue-500'
                                : ''
                          }`}
                        >
                          {session.seating_type === 'designated' ? '本' :
                           session.seating_type === 'inhouse' ? '場' : 'フ'}
                        </Badge>
                      </td>
                      <td className="px-2 py-2 text-center font-medium">
                        {session.table_label}
                      </td>
                      {/* Extensions 1-7 */}
                      {[0, 1, 2, 3, 4, 5, 6].map(n => (
                        <td key={n} className="px-1 py-2 text-center border-l border-border/30">
                          {session.extensions && session.extensions[n] ? (
                            <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] ${
                              session.extensions[n].type === 'designated'
                                ? 'bg-pink-100 text-pink-700 border border-pink-300'
                                : session.extensions[n].type === 'inhouse'
                                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                                  : 'bg-muted'
                            }`}>
                              {session.extensions[n].minutes}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/30">-</span>
                          )}
                        </td>
                      ))}
                      <td className="px-2 py-2 text-right border-l border-border font-medium">
                        {formatJPY(session.base_charge)}
                      </td>
                      <td className="px-2 py-2 text-left text-muted-foreground text-[10px] max-w-[80px] truncate">
                        {session.notes || '-'}
                      </td>
                      <td className="px-2 py-2 text-right font-bold text-primary">
                        {formatJPY(session.total)}
                      </td>
                    </tr>
                  ))}
                  {/* Empty rows */}
                  {Array.from({ length: Math.max(0, 28 - (data?.length || 0)) }).map((_, i) => (
                    <tr key={`empty-${i}`} className="border-b border-border/30 h-7">
                      <td className="px-2 py-1 text-center text-muted-foreground/50">
                        {(data?.length || 0) + i + 1}
                      </td>
                      <td colSpan={14}></td>
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
