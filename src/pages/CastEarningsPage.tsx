/**
 * Cast Earnings Page
 * Shows personal earnings breakdown with full calculation transparency
 * 
 * Formula: (time_pay + backs + bonus) × 0.9 − ¥1,000 − transport
 * Floored to nearest ¥10
 */

import { useNavigate } from 'react-router-dom';
import { useCastEarnings, useCurrentShift, useClockIn, useClockOut } from '@/hooks/useCastData';
import { useCastAuth } from '@/contexts/CastAuthContext';
import { useSettings } from '@/hooks/useSettings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Loader2,
  ArrowLeft,
  Coins,
  Star,
  ShoppingBag,
  Wallet,
  Clock,
  Wine,
  Play,
  Square,
  TrendingUp,
  Users,
  Sparkles,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { formatJPY } from '@/types/billing';
import { formatWorkTime, CATEGORY_LABELS, type ProductCategory } from '@/types/cast';
import { toast } from 'sonner';
import { useState } from 'react';

export default function CastEarningsPage() {
  const navigate = useNavigate();
  const { castMember } = useCastAuth();
  const { data: settingsData } = useSettings();
  const [showDetails, setShowDetails] = useState(false);

  const { data: earnings, isLoading } = useCastEarnings(
    castMember?.id || null,
    castMember?.hourly_rate || 4000,
    castMember?.transport_fee || 0,
    settingsData
  );
  const { data: currentShift } = useCurrentShift(castMember?.id || null);
  const clockIn = useClockIn();
  const clockOut = useClockOut();

  const handleBack = () => {
    navigate('/cast');
  };

  const handleClockIn = async () => {
    if (!castMember) return;

    try {
      // Default to store 1 for clock in from earnings page
      await clockIn.mutateAsync({ castId: castMember.id, storeId: 1 });
      toast.success('出勤申請を送信しました。スタッフの承認をお待ちください。');
    } catch (error) {
      console.error('Clock in error:', error);
      toast.error('出勤に失敗しました');
    }
  };

  const handleClockOut = async () => {
    if (!currentShift) return;

    try {
      await clockOut.mutateAsync({ shiftId: currentShift.id });
      toast.success('退勤申請を送信しました。スタッフの承認をお待ちください。');
    } catch (error) {
      console.error('Clock out error:', error);
      toast.error('退勤に失敗しました');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex flex-1 items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  // Get non-zero back categories
  const activeBackCategories = Object.entries(earnings?.backs_by_category || {})
    .filter(([, value]) => value > 0) as [ProductCategory, number][];

  return (
    <div className="min-h-screen bg-background">
      {/* Page Header */}
      <header className="border-b border-border bg-card px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={handleBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="font-bold text-foreground">本日の売上</h1>
              <p className="text-xs text-muted-foreground">{castMember?.name}</p>
            </div>
          </div>
          {/* Clock In/Out Button */}
          {currentShift ? (
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleClockOut}
              disabled={clockOut.isPending}
            >
              {clockOut.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Square className="mr-1 h-4 w-4" />
                  退勤
                </>
              )}
            </Button>
          ) : (
            <Button 
              size="sm"
              onClick={handleClockIn}
              disabled={clockIn.isPending}
            >
              {clockIn.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Play className="mr-1 h-4 w-4" />
                  出勤
                </>
              )}
            </Button>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto max-w-lg space-y-4 p-4">
        {/* ESTIMATED PAYOUT - HERO CARD */}
        <Card className="border-primary/50 bg-gradient-to-br from-primary/10 to-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Wallet className="h-5 w-5 text-primary" />
              概算支払額
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-primary">
              {formatJPY(earnings?.net_payout || 0)}
            </p>
            {earnings?.referral_bonus > 0 && (
              <p className="mt-1 text-sm text-muted-foreground">
                + 紹介ボーナス {formatJPY(earnings.referral_bonus)}
              </p>
            )}
          </CardContent>
        </Card>

        {/* WORK TIME */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-5 w-5 text-muted-foreground" />
              勤務時間
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <p className="text-2xl font-bold text-foreground">
                {formatWorkTime(earnings?.total_work_minutes || 0)}
              </p>
              <p className="text-lg font-medium text-primary">
                {formatJPY(earnings?.total_time_pay || 0)}
              </p>
            </div>
            {currentShift && (
              <>
                {currentShift.clock_in_status === 'pending' && (
                  <p className="mt-1 text-xs text-yellow-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    出勤承認待ち
                  </p>
                )}
                {currentShift.clock_in_status === 'approved' && (
                  <p className="mt-1 text-xs text-primary flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    勤務中
                  </p>
                )}
                {currentShift.clock_out_status === 'pending' && (
                  <p className="mt-1 text-xs text-yellow-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    退勤承認待ち
                  </p>
                )}
              </>
            )}
            {earnings?.has_late_pickup && (
              <p className="mt-1 text-xs text-secondary">
                ⚡ 復活出勤あり (+¥500/時)
              </p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              時給: {formatJPY(castMember?.hourly_rate || 4000)}/時
            </p>
          </CardContent>
        </Card>

        {/* BACKS (COMMISSIONS) */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Coins className="h-5 w-5 text-primary" />
              バック合計
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">
              {formatJPY(earnings?.total_backs || 0)}
            </p>
            
            {/* Category breakdown */}
            {activeBackCategories.length > 0 && (
              <div className="mt-3 space-y-1">
                {activeBackCategories.map(([category, amount]) => (
                  <div key={category} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {CATEGORY_LABELS[category]}
                    </span>
                    <span className="font-medium">{formatJPY(amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* POINTS */}
        <div className="grid grid-cols-2 gap-3">
          {/* Drink Points */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Star className="h-4 w-4 text-secondary" />
                ドリンクpt
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">
                {earnings?.drink_points || 0}
              </p>
              <p className="text-xs text-muted-foreground">
                {earnings?.drink_s_units || 0} S単位
              </p>
            </CardContent>
          </Card>

          {/* Champagne Points */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Wine className="h-4 w-4 text-secondary" />
                シャンパンpt
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">
                {earnings?.champagne_points || 0}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* BONUS (大入り) */}
        <Card className={earnings?.bonus_qualified ? 'border-secondary/50 bg-secondary/5' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-5 w-5 text-secondary" />
              大入りボーナス
            </CardTitle>
          </CardHeader>
          <CardContent>
            {earnings?.bonus_qualified ? (
              <>
                <p className="text-2xl font-bold text-secondary">
                  {formatJPY(earnings.bonus_amount)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {earnings.total_points} pt × {formatJPY(earnings.bonus_per_point)}/pt
                </p>
              </>
            ) : (
              <>
                <p className="text-lg font-medium text-muted-foreground">未達成</p>
                <p className="text-xs text-muted-foreground">
                  店舗売上が閾値に達していません
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* ORDERS COUNT */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShoppingBag className="h-5 w-5 text-muted-foreground" />
              オーダー数
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">
              {earnings?.orders_count || 0}
              <span className="ml-1 text-lg font-normal text-muted-foreground">件</span>
            </p>
          </CardContent>
        </Card>

        {/* REFERRAL BONUS */}
        {(earnings?.referral_count || 0) > 0 && (
          <Card className="border-accent/50 bg-accent/5">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-5 w-5 text-accent-foreground" />
                紹介ボーナス
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-accent-foreground">
                {formatJPY(earnings?.referral_bonus || 0)}
              </p>
              <p className="text-xs text-muted-foreground">
                紹介した子 {earnings?.referral_count || 0}人 × ¥2,000
              </p>
            </CardContent>
          </Card>
        )}

        {/* CALCULATION BREAKDOWN - EXPANDABLE */}
        <Card>
          <CardHeader className="pb-2">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex w-full items-center justify-between"
            >
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
                計算明細
              </CardTitle>
              {showDetails ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          </CardHeader>
          {showDetails && (
            <CardContent className="space-y-3 pt-0">
              <Separator />
              
              {/* Subtotal */}
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase">
                  小計 (時給 + バック + 大入り)
                </p>
                <div className="flex justify-between text-sm">
                  <span>時給</span>
                  <span>{formatJPY(earnings?.total_time_pay || 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>バック</span>
                  <span>{formatJPY(earnings?.total_backs || 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>大入り</span>
                  <span>{formatJPY(earnings?.bonus_amount || 0)}</span>
                </div>
                <div className="flex justify-between font-medium border-t border-border pt-1">
                  <span>小計</span>
                  <span>{formatJPY(earnings?.subtotal || 0)}</span>
                </div>
              </div>

              <Separator />

              {/* Tax calculation */}
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase">
                  税金計算
                </p>
                <div className="flex justify-between text-sm">
                  <span>× 0.9 (10% 源泉徴収)</span>
                  <span>{formatJPY(earnings?.after_tax || 0)}</span>
                </div>
              </div>

              <Separator />

              {/* Deductions */}
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase">
                  控除
                </p>
                <div className="flex justify-between text-sm">
                  <span>厚生費</span>
                  <span className="text-destructive">-{formatJPY(earnings?.welfare_fee || 1000)}</span>
                </div>
                {(earnings?.transport_fee || 0) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>交通費</span>
                    <span className="text-destructive">-{formatJPY(earnings?.transport_fee || 0)}</span>
                  </div>
                )}
              </div>

              <Separator />

              {/* Final */}
              <div className="flex justify-between text-lg font-bold text-primary">
                <span>手取り (10円単位切捨)</span>
                <span>{formatJPY(earnings?.net_payout || 0)}</span>
              </div>

              <p className="text-[10px] text-muted-foreground text-center">
                計算式: (時給 + バック + 大入り) × 0.9 − 厚生費 − 交通費
              </p>
            </CardContent>
          )}
        </Card>

        {/* DISCLAIMER */}
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-center text-xs text-muted-foreground">
            最終的な給与は締め日に確定します。
            <br />
            詳細はスタッフにお問い合わせください。
          </p>
        </div>
      </main>
    </div>
  );
}
