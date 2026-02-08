/**
 * Table Layout Page
 * Visual representation of store floor with tables
 * Shows current total and remaining time for each table
 * Uses store-specific layouts matching actual floor plans
 */

import { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStores, useCurrentShift } from '@/hooks/useCastData';
import { useRealtimeFloorTables } from '@/hooks/useRealtimeFloorTables';
import { useCastAuth } from '@/contexts/CastAuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, ArrowLeft, User, Coins, RefreshCw, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import Store1Layout from '@/components/floor/Store1Layout';
import Store2Layout from '@/components/floor/Store2Layout';
import type { FloorTable } from '@/types/cast';
import { formatJPY } from '@/types/billing';

export default function CastTableLayoutPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const navigate = useNavigate();
  const { castMember } = useCastAuth();

  const storeIdNum = storeId ? parseInt(storeId, 10) : null;
  const { data: stores } = useStores();
  const { data: tables, isLoading, error, refetch, isFetching } = useRealtimeFloorTables(storeIdNum);
  const { data: currentShift } = useCurrentShift(castMember?.id || null);

  const store = stores?.find(s => s.id === storeIdNum);

  // Redirect if not approved
  useEffect(() => {
    if (currentShift && currentShift.clock_in_status !== 'approved') {
      toast.error('出勤が承認されていません。承認をお待ちください。');
      navigate('/cast');
    }
  }, [currentShift, navigate]);

  // Track which tables have been notified to avoid duplicate alerts
  const notifiedTables = useRef<Set<string>>(new Set());

  // Set time expiry notification
  useEffect(() => {
    if (!tables) return;

    tables.forEach(table => {
      if (
        table.has_open_bill &&
        table.remaining_minutes !== undefined &&
        table.remaining_minutes <= 0 &&
        !notifiedTables.current.has(table.id)
      ) {
        // Mark as notified
        notifiedTables.current.add(table.id);

        const totalDisplay = table.current_total
          ? formatJPY(Math.floor((table.current_total || 0) / 10) * 10)
          : '';

        toast.warning(
          `${table.label} セット時間終了`,
          {
            description: totalDisplay ? `現在の合計: ${totalDisplay}` : undefined,
            duration: 10000,
          }
        );
      }

      // Reset notification if table becomes free or gets more time
      if (
        !table.has_open_bill ||
        (table.remaining_minutes !== undefined && table.remaining_minutes > 0)
      ) {
        notifiedTables.current.delete(table.id);
      }
    });
  }, [tables]);

  const handleTableClick = (table: FloorTable) => {
    navigate(`/cast/store/${storeId}/table/${table.id}`);
  };

  const handleBack = () => {
    navigate('/cast');
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

  if (error || !tables) {
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
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={handleBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="font-bold text-foreground">
                {store?.name || '店舗'}
              </h1>
              <p className="text-xs text-muted-foreground">
                テーブルを選択してください
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            </Button>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>{castMember?.name}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleViewEarnings}>
              <Coins className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 border-b border-border bg-card/50 px-4 py-2">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded-full border-2 border-primary bg-primary/20" />
          <span className="text-xs text-muted-foreground">会計中</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded-full border-2 border-destructive bg-destructive/20 animate-pulse" />
          <span className="text-xs text-muted-foreground">残5分以下</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded-full border-2 border-border bg-card" />
          <span className="text-xs text-muted-foreground">空席</span>
        </div>
      </div>

      {/* Floor Layout - Store-specific */}
      <main className="p-4">
        {storeIdNum === 1 && (
          <Store1Layout tables={tables} onTableClick={handleTableClick} />
        )}
        {storeIdNum === 2 && (
          <Store2Layout tables={tables} onTableClick={handleTableClick} />
        )}
        {storeIdNum !== 1 && storeIdNum !== 2 && (
          <p className="text-center text-muted-foreground">
            不明な店舗ID: {storeIdNum}
          </p>
        )}
        
        {/* Realtime indicator */}
        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
          </span>
          リアルタイム更新中
        </div>
      </main>
    </div>
  );
}
