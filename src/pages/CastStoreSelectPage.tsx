/**
 * Store Selection Page
 * Cast selects which store they're working at, with clock in
 */

import { useNavigate } from 'react-router-dom';
import { useStores, useCurrentShift, useClockIn } from '@/hooks/useCastData';
import { useCastAuth } from '@/contexts/CastAuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, LogOut, Store, User, Coins, Clock, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function CastStoreSelectPage() {
  const navigate = useNavigate();
  const { castMember, logout } = useCastAuth();
  const { data: stores, isLoading, error } = useStores();
  const { data: currentShift } = useCurrentShift(castMember?.id || null);
  const clockIn = useClockIn();

  const handleStoreSelect = async (storeId: number) => {
    // If not clocked in, clock in first
    if (!currentShift && castMember) {
      try {
        await clockIn.mutateAsync({ castId: castMember.id, storeId });
        toast.success('出勤申請を送信しました。スタッフの承認をお待ちください。');
      } catch (error) {
        console.error('Clock in error:', error);
        toast.error('出勤申請に失敗しました');
        return; // Don't navigate if clock in fails
      }
    }

    // Only navigate if approved or if already had a shift
    if (currentShift?.clock_in_status === 'approved' || currentShift) {
      navigate(`/cast/store/${storeId}`);
    } else if (currentShift?.clock_in_status === 'pending') {
      toast.info('スタッフの承認をお待ちください');
    } else if (currentShift?.clock_in_status === 'rejected') {
      toast.error('出勤が却下されました。スタッフに確認してください。');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/cast/login');
  };

  const handleViewEarnings = () => {
    navigate('/cast/earnings');
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

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex flex-1 items-center justify-center py-20">
          <p className="text-destructive">データの読み込みに失敗しました</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Page Header */}
      <header className="border-b border-border bg-card px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            <div>
              <span className="font-medium text-foreground">
                {castMember?.name}
              </span>
              {currentShift && (
                <div className="flex items-center gap-1 text-xs">
                  {currentShift.clock_in_status === 'pending' && (
                    <>
                      <AlertCircle className="h-3 w-3 text-yellow-600" />
                      <span className="text-yellow-600">承認待ち</span>
                    </>
                  )}
                  {currentShift.clock_in_status === 'approved' && (
                    <>
                      <CheckCircle className="h-3 w-3 text-primary" />
                      <span className="text-primary">勤務中</span>
                    </>
                  )}
                  {currentShift.clock_in_status === 'rejected' && (
                    <>
                      <XCircle className="h-3 w-3 text-destructive" />
                      <span className="text-destructive">却下</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleViewEarnings}
            >
              <Coins className="h-4 w-4" />
              <span className="ml-1 hidden sm:inline">売上</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto max-w-lg px-4 py-8">
        <h1 className="mb-6 text-center text-xl font-bold text-foreground">
          店舗を選択
        </h1>

        {/* Status message */}
        {!currentShift && (
          <p className="mb-4 text-center text-sm text-muted-foreground">
            店舗を選択すると出勤申請が送信されます
          </p>
        )}
        {currentShift?.clock_in_status === 'pending' && (
          <Card className="mb-4 border-yellow-200 bg-yellow-50">
            <CardContent className="p-4 text-center">
              <AlertCircle className="mx-auto mb-2 h-8 w-8 text-yellow-600" />
              <p className="font-medium text-yellow-800">出勤申請を送信しました</p>
              <p className="text-sm text-yellow-700">
                スタッフの承認をお待ちください。承認後、テーブルに入れるようになります。
              </p>
            </CardContent>
          </Card>
        )}
        {currentShift?.clock_in_status === 'rejected' && (
          <Card className="mb-4 border-red-200 bg-red-50">
            <CardContent className="p-4 text-center">
              <XCircle className="mx-auto mb-2 h-8 w-8 text-destructive" />
              <p className="font-medium text-destructive">出勤申請が却下されました</p>
              <p className="text-sm text-red-700">
                スタッフに確認してください。
              </p>
            </CardContent>
          </Card>
        )}
        {currentShift?.clock_in_status === 'approved' && (
          <p className="mb-4 text-center text-sm text-primary flex items-center justify-center gap-1">
            <CheckCircle className="h-4 w-4" />
            出勤承認済み - 店舗を選択してください
          </p>
        )}

        <div className="space-y-4">
          {stores?.map((store) => (
            <Card
              key={store.id}
              className="cursor-pointer transition-colors hover:bg-accent/50"
              onClick={() => handleStoreSelect(store.id)}
            >
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Store className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    {store.name}
                  </h2>
                  {store.address && (
                    <p className="text-sm text-muted-foreground">
                      {store.address}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
