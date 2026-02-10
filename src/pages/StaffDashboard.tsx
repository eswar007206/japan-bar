/**
 * Staff Dashboard Page
 * Real-time operation dashboard for managing both stores
 * Features: Table control, session management, order management, cast tracking
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStaffAuth } from '@/contexts/StaffAuthContext';
import { useStores } from '@/hooks/useCastData';
import { useStaffFloorTables, useStartSession, useEndSession, useActiveCasts, useDailySalesStats } from '@/hooks/useStaffData';
import { useSettings } from '@/hooks/useSettings';
import { useAutoSaveDailyReport } from '@/hooks/useAutoSaveDailyReport';
import { usePendingShiftApprovals } from '@/hooks/useShiftApprovals';
import CastPerformanceSummary from '@/components/staff/CastPerformanceSummary';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  LogOut,
  Store,
  Users,
  Clock,
  DollarSign,
  RefreshCw,
  Settings,
  FileText,
  Banknote,
  CreditCard,
  QrCode,
  Smartphone,
  Wallet,
  ChevronDown,
  ChevronUp,
  UserCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatJPY } from '@/types/billing';
import StaffTableCard from '@/components/staff/StaffTableCard';
import StartSessionDialog from '@/components/staff/StartSessionDialog';
import SessionDetailDialog from '@/components/staff/SessionDetailDialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { SeatingType } from '@/types/staff';
import type { FloorTable } from '@/types/cast';
import type { TableSession } from '@/types/staff';

interface TableWithSession extends FloorTable {
  bill?: TableSession | null;
}

export default function StaffDashboard() {
  const navigate = useNavigate();
  const { staffMember, logout, isLoading: authLoading, isAuthenticated } = useStaffAuth();
  const { data: stores, isLoading: storesLoading } = useStores();
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);
  
  const { data: tables, isLoading: tablesLoading, refetch, isFetching } = useStaffFloorTables(selectedStoreId);
  const { data: activeCasts } = useActiveCasts();
  const { data: dailySales } = useDailySalesStats(selectedStoreId);
  const { data: settings } = useSettings();
  const { data: pendingShifts } = usePendingShiftApprovals();

  // Auto-save daily report whenever session data changes
  useAutoSaveDailyReport(selectedStoreId, settings);

  const startSession = useStartSession();
  const endSession = useEndSession();

  // Dialog states
  const [startDialogOpen, setStartDialogOpen] = useState(false);
  const [selectedTableForStart, setSelectedTableForStart] = useState<string | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedTableForDetail, setSelectedTableForDetail] = useState<TableWithSession | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [endingBillId, setEndingBillId] = useState<string | null>(null);
  const [showCastPerf, setShowCastPerf] = useState(false);

  // Auto-select first store
  useEffect(() => {
    if (stores && stores.length > 0 && !selectedStoreId) {
      setSelectedStoreId(stores[0].id);
    }
  }, [stores, selectedStoreId]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/staff/login');
    }
  }, [authLoading, isAuthenticated, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate('/staff/login');
  };

  const handleStartSession = (tableId: string) => {
    setSelectedTableForStart(tableId);
    setStartDialogOpen(true);
  };

  const handleConfirmStartSession = async (seatingType: SeatingType, baseMinutes: number) => {
    if (!selectedTableForStart || !selectedStoreId) return;
    
    try {
      await startSession.mutateAsync({
        tableId: selectedTableForStart,
        storeId: selectedStoreId,
        seatingType,
        baseMinutes,
      });
      toast.success('セッションを開始しました');
    } catch (error) {
      console.error('Start session error:', error);
      toast.error('セッション開始に失敗しました');
      throw error;
    }
  };

  const handleEndSession = async (billId: string) => {
    if (!selectedStoreId) return;
    setEndingBillId(billId);
    setPaymentDialogOpen(true);
  };

  const handleConfirmEndSession = async (paymentMethod: string) => {
    if (!selectedStoreId || !endingBillId) return;

    try {
      await endSession.mutateAsync({
        billId: endingBillId,
        storeId: selectedStoreId,
        paymentMethod,
      });
      toast.success('会計を終了しました');
    } catch (error) {
      console.error('End session error:', error);
      toast.error('会計終了に失敗しました');
    } finally {
      setPaymentDialogOpen(false);
      setEndingBillId(null);
    }
  };

  const handleExtendTime = (billId: string) => {
    // Open detail dialog with extension options
    const table = tables?.find(t => t.bill?.id === billId);
    if (table) {
      setSelectedTableForDetail(table);
      setDetailDialogOpen(true);
    }
  };

  const handleViewDetails = (table: TableWithSession) => {
    if (table.bill) {
      setSelectedTableForDetail(table);
      setDetailDialogOpen(true);
    }
  };

  // Calculate summary stats
  const openSessions = tables?.filter(t => t.bill) || [];
  const lowTimeTables = openSessions.filter(t => t.bill?.remaining_minutes !== undefined && t.bill.remaining_minutes <= 5);

  // Get selected table for start dialog
  const selectedTable = tables?.find(t => t.id === selectedTableForStart);

  if (authLoading || storesLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-secondary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Staff Header */}
      <header className="border-b border-border bg-card px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-secondary/20 flex items-center justify-center">
              <Store className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <h1 className="font-bold text-foreground">スタッフダッシュボード</h1>
              <p className="text-xs text-muted-foreground">
                ログイン中: {staffMember?.name} ({staffMember?.role})
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
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 border-b border-border bg-muted/30">
        <Card className="p-3 overflow-hidden">
          <div className="flex items-center gap-2 min-w-0">
            <Users className="h-4 w-4 text-primary shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground">営業中</p>
              <p className="text-lg font-bold">{openSessions.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-3 overflow-hidden">
          <div className="flex items-center gap-2 min-w-0">
            <DollarSign className="h-4 w-4 text-primary shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground">本日売上</p>
              <p className="text-lg font-bold truncate">{formatJPY(dailySales?.totalSales || 0)}</p>
              {dailySales && dailySales.closedBills > 0 && (
                <p className="text-[10px] text-muted-foreground">{dailySales.closedBills}組会計済</p>
              )}
            </div>
          </div>
        </Card>
        <Card className="p-3 overflow-hidden">
          <div className="flex items-center gap-2 min-w-0">
            <Clock className="h-4 w-4 text-orange-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground">残5分以下</p>
              <p className="text-lg font-bold text-orange-500">{lowTimeTables.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-3 overflow-hidden">
          <div className="flex items-center gap-2 min-w-0">
            <Users className="h-4 w-4 text-secondary shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground">出勤中</p>
              <p className="text-lg font-bold">{activeCasts?.length || 0}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Store Tabs */}
      <Tabs 
        value={selectedStoreId?.toString() || ''} 
        onValueChange={(v) => setSelectedStoreId(parseInt(v))}
        className="flex-1"
      >
        <div className="px-4 pt-4">
          <TabsList className="w-full justify-start">
            {stores?.map((store) => (
              <TabsTrigger key={store.id} value={store.id.toString()} className="flex-1">
                {store.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {stores?.map((store) => (
          <TabsContent key={store.id} value={store.id.toString()} className="p-4">
            {tablesLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {/* Table Grid - Group by section */}
                <div className="space-y-6">
                  {/* A Tables */}
                  {tables?.filter(t => t.label.startsWith('A')).length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-3">A卓</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        {tables
                          ?.filter(t => t.label.startsWith('A'))
                          .sort((a, b) => a.label.localeCompare(b.label))
                          .map((table) => (
                            <StaffTableCard
                              key={table.id}
                              table={table}
                              onStartSession={handleStartSession}
                              onEndSession={handleEndSession}
                              onExtendTime={handleExtendTime}
                              onViewDetails={handleViewDetails}
                            />
                          ))}
                      </div>
                    </div>
                  )}

                  {/* B Tables */}
                  {tables?.filter(t => t.label.startsWith('B')).length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-3">B卓</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        {tables
                          ?.filter(t => t.label.startsWith('B'))
                          .sort((a, b) => a.label.localeCompare(b.label))
                          .map((table) => (
                            <StaffTableCard
                              key={table.id}
                              table={table}
                              onStartSession={handleStartSession}
                              onEndSession={handleEndSession}
                              onExtendTime={handleExtendTime}
                              onViewDetails={handleViewDetails}
                            />
                          ))}
                      </div>
                    </div>
                  )}

                  {/* C Tables */}
                  {tables?.filter(t => t.label.startsWith('C')).length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-3">C卓</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        {tables
                          ?.filter(t => t.label.startsWith('C'))
                          .sort((a, b) => a.label.localeCompare(b.label))
                          .map((table) => (
                            <StaffTableCard
                              key={table.id}
                              table={table}
                              onStartSession={handleStartSession}
                              onEndSession={handleEndSession}
                              onExtendTime={handleExtendTime}
                              onViewDetails={handleViewDetails}
                            />
                          ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Realtime indicator */}
                <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-secondary opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-secondary"></span>
                  </span>
                  リアルタイム更新中
                </div>
              </>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Cast Performance Panel */}
      <div className="border-t border-border">
        <button
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
          onClick={() => setShowCastPerf(!showCastPerf)}
        >
          <span className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            キャスト実績
          </span>
          {showCastPerf ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        {showCastPerf && selectedStoreId && (
          <div className="px-4 pb-4">
            <CastPerformanceSummary storeId={selectedStoreId} settings={settings} />
          </div>
        )}
      </div>

      {/* Other Features */}
      <div className="border-t border-border p-4">
        <p className="text-xs text-muted-foreground mb-2">その他の機能</p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/staff/reports')}
          >
            <FileText className="h-3.5 w-3.5 mr-1" />
            日報
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/staff/approvals')}
            className="relative"
          >
            <UserCheck className="h-3.5 w-3.5 mr-1" />
            出退勤承認
            {pendingShifts && pendingShifts.length > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 min-w-[20px] px-1 text-[10px]">
                {pendingShifts.length}
              </Badge>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/staff/qr-codes')}
          >
            <QrCode className="h-3.5 w-3.5 mr-1" />
            QRコード
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/staff/cast-management')}
          >
            <Users className="h-3.5 w-3.5 mr-1" />
            キャスト管理
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/staff/settings')}
          >
            <Settings className="h-3.5 w-3.5 mr-1" />
            設定
          </Button>
        </div>
      </div>

      {/* Dialogs */}
      <StartSessionDialog
        open={startDialogOpen}
        onOpenChange={setStartDialogOpen}
        tableLabel={selectedTable?.label || ''}
        onConfirm={handleConfirmStartSession}
      />

      <SessionDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        table={selectedTableForDetail}
        storeId={selectedStoreId || 1}
        onCompleteSession={handleEndSession}
      />

      {/* Payment Method Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={(open) => {
        setPaymentDialogOpen(open);
        if (!open) setEndingBillId(null);
      }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>お支払い方法</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <Button
              variant="outline"
              className="h-20 flex-col gap-2"
              onClick={() => handleConfirmEndSession('cash')}
              disabled={endSession.isPending}
            >
              <Banknote className="h-6 w-6" />
              <span className="text-sm">現金</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex-col gap-2"
              onClick={() => handleConfirmEndSession('card')}
              disabled={endSession.isPending}
            >
              <CreditCard className="h-6 w-6" />
              <span className="text-sm">カード</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex-col gap-2"
              onClick={() => handleConfirmEndSession('qr')}
              disabled={endSession.isPending}
            >
              <QrCode className="h-6 w-6" />
              <span className="text-sm">QR決済</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex-col gap-2"
              onClick={() => handleConfirmEndSession('contactless')}
              disabled={endSession.isPending}
            >
              <Smartphone className="h-6 w-6" />
              <span className="text-sm">タッチ決済</span>
            </Button>
            <Button
              variant="outline"
              className="col-span-2 h-20 flex-col gap-2"
              onClick={() => handleConfirmEndSession('split')}
              disabled={endSession.isPending}
            >
              <Wallet className="h-6 w-6" />
              <span className="text-sm">現金+カード</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
