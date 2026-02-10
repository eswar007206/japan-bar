/**
 * Session Detail Dialog
 * View and manage a table session (orders, cast, extensions, adjustments, QR)
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  Loader2,
  Clock,
  Plus,
  Minus,
  Trash2,
  Users,
  ShoppingBag,
  QrCode,
  Copy,
  Check,
  Settings2,
  X,
  UserPlus,
  AlertTriangle,
  CheckCircle,
  History,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { formatJPY } from '@/types/billing';
import { useBillOrdersStaff, useCancelOrder, useExtendSession, useBillAdjustments, useAddAdjustment, useCancelSession, useAssignCast, useUnassignCast, useActiveCasts } from '@/hooks/useStaffData';
import { useStaffAuth } from '@/contexts/StaffAuthContext';
import { toast } from 'sonner';
import type { FloorTable, Order } from '@/types/cast';
import type { TableSession } from '@/types/staff';
import { SEATING_TYPE_LABELS } from '@/types/staff';
import { ActivityLog } from '@/components/shared/ActivityLog';

interface TableWithSession extends FloorTable {
  bill?: TableSession | null;
}

interface SessionDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  table: TableWithSession | null;
  storeId: number;
  onCompleteSession?: (billId: string) => void;
}

export default function SessionDetailDialog({
  open,
  onOpenChange,
  table,
  storeId,
  onCompleteSession,
}: SessionDetailDialogProps) {
  const { staffMember } = useStaffAuth();
  const session = table?.bill;
  const { data: orders, isLoading: ordersLoading } = useBillOrdersStaff(session?.id || null);
  const { data: adjustments } = useBillAdjustments(session?.id || null);
  const cancelOrder = useCancelOrder();
  const extendSession = useExtendSession();
  const addAdjustment = useAddAdjustment();
  const cancelSession = useCancelSession();
  const assignCast = useAssignCast();
  const unassignCast = useUnassignCast();
  const { data: activeCasts } = useActiveCasts();
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showAdjustForm, setShowAdjustForm] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null);

  if (!table || !session) return null;

  const handleCancelOrder = async (order: Order) => {
    if (!staffMember) return;

    try {
      await cancelOrder.mutateAsync({
        orderId: order.id,
        staffId: staffMember.id,
        reason: 'スタッフによるキャンセル',
      });
      toast.success('オーダーをキャンセルしました');
    } catch (error) {
      toast.error('キャンセルに失敗しました');
    }
  };

  const handleExtend = async (minutes: number) => {
    try {
      const result = await extendSession.mutateAsync({
        billId: session.id,
        additionalMinutes: minutes,
        storeId,
      });

      if (result.wasUpgraded) {
        toast.success(`${minutes}分延長しました（3回目延長で本指名に昇格！）`, {
          duration: 5000,
        });
      } else {
        toast.success(`${minutes}分延長しました（延長${result.extensionCount}回目）`);
      }
    } catch (error) {
      toast.error('延長に失敗しました');
    }
  };

  const customerUrl = table
    ? `${window.location.origin}/table/${table.id}`
    : null;

  const handleCopyQRLink = () => {
    if (!customerUrl) return;
    navigator.clipboard.writeText(customerUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('URLをコピーしました');
  };

  const handleAddDiscount = async () => {
    if (!staffMember || !adjustAmount) return;
    const amount = parseInt(adjustAmount, 10);
    if (isNaN(amount) || amount <= 0) {
      toast.error('正しい金額を入力してください');
      return;
    }

    try {
      await addAdjustment.mutateAsync({
        billId: session.id,
        staffId: staffMember.id,
        adjustmentType: 'discount',
        originalAmount: session.current_total || 0,
        adjustedAmount: -amount,
        reason: adjustReason || '値引き',
      });
      toast.success(`${formatJPY(amount)} 値引きしました`);
      setAdjustAmount('');
      setAdjustReason('');
      setShowAdjustForm(false);
    } catch (error) {
      toast.error('値引きに失敗しました');
    }
  };

  const handleAddSurcharge = async () => {
    if (!staffMember || !adjustAmount) return;
    const amount = parseInt(adjustAmount, 10);
    if (isNaN(amount) || amount <= 0) {
      toast.error('正しい金額を入力してください');
      return;
    }

    try {
      await addAdjustment.mutateAsync({
        billId: session.id,
        staffId: staffMember.id,
        adjustmentType: 'custom',
        originalAmount: session.current_total || 0,
        adjustedAmount: amount,
        reason: adjustReason || '追加料金',
      });
      toast.success(`${formatJPY(amount)} 追加しました`);
      setAdjustAmount('');
      setAdjustReason('');
      setShowAdjustForm(false);
    } catch (error) {
      toast.error('追加に失敗しました');
    }
  };

  // Calculate total adjustment amount
  const totalAdjustment = adjustments?.reduce((sum, adj) => sum + adj.adjusted_amount, 0) || 0;

  const handleCancelSession = async () => {
    try {
      await cancelSession.mutateAsync({ billId: session.id, storeId });
      toast.success('セッションをキャンセルしました');
      onOpenChange(false);
      setShowCancelConfirm(false);
    } catch (error) {
      toast.error('キャンセルに失敗しました');
    }
  };

  const handleAssignCast = async (castId: string) => {
    try {
      await assignCast.mutateAsync({ billId: session.id, castId });
      toast.success('キャストを割り当てました');
    } catch (error) {
      toast.error('割り当てに失敗しました');
    }
  };

  const handleUnassignCast = async (assignmentId: string) => {
    try {
      await unassignCast.mutateAsync({ assignmentId });
      toast.success('キャストの割り当てを解除しました');
    } catch (error) {
      toast.error('解除に失敗しました');
    }
  };

  const handleCompleteSession = () => {
    if (onCompleteSession && session) {
      onCompleteSession(session.id);
      onOpenChange(false);
    }
  };

  // Casts available to assign (active, not already assigned)
  const assignedCastIds = new Set(session.assigned_casts?.map(a => a.cast_id) || []);
  const availableCasts = activeCasts?.filter(c => !assignedCastIds.has(c.id)) || [];

  // Filter out cancelled orders for display
  const activeOrders = orders?.filter(o => !o.is_cancelled) || [];
  const cancelledOrders = orders?.filter(o => o.is_cancelled) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            テーブル {table.label}
            <Badge variant="outline">{SEATING_TYPE_LABELS[session.seating_type]}</Badge>
          </DialogTitle>
        </DialogHeader>

        {/* Session Summary */}
        <div className="grid grid-cols-3 gap-3 py-2">
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <p className="text-xs text-muted-foreground">残り時間</p>
            <p className={`text-lg font-bold ${session.remaining_minutes! <= 0 ? 'text-destructive animate-pulse' : session.remaining_minutes! <= 5 ? 'text-destructive' : ''}`}>
              {session.remaining_minutes! <= 0
                ? `${Math.abs(session.remaining_minutes!)}分超過`
                : `${session.remaining_minutes}分`
              }
            </p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <p className="text-xs text-muted-foreground">合計金額</p>
            <p className="text-lg font-bold text-primary">
              {formatJPY((session.current_total || 0) + totalAdjustment)}
            </p>
            {totalAdjustment !== 0 && (
              <p className={`text-[10px] ${totalAdjustment < 0 ? 'text-destructive' : 'text-green-600'}`}>
                {totalAdjustment > 0 ? '+' : ''}{formatJPY(totalAdjustment)}
              </p>
            )}
          </div>
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <p className="text-xs text-muted-foreground">オーダー数</p>
            <p className="text-lg font-bold">{activeOrders.length}件</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => handleExtend(20)}
            disabled={extendSession.isPending}
          >
            <Plus className="h-3 w-3 mr-1" />
            +20分
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => handleExtend(40)}
            disabled={extendSession.isPending}
          >
            <Plus className="h-3 w-3 mr-1" />
            +40分
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => setShowQR(!showQR)}
          >
            <QrCode className="h-3 w-3 mr-1" />
            QR
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => setShowAdjustForm(!showAdjustForm)}
          >
            <Settings2 className="h-3 w-3 mr-1" />
            調整
          </Button>
        </div>

        {/* Complete and Cancel Buttons */}
        <div className="flex gap-2">
          {onCompleteSession && (
            <Button
              variant="default"
              size="sm"
              className="flex-1 bg-primary hover:bg-primary/90"
              onClick={handleCompleteSession}
            >
              <CheckCircle className="h-3.5 w-3.5 mr-1" />
              会計
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className={`${onCompleteSession ? 'flex-1' : 'w-full'} text-destructive border-destructive/30`}
            onClick={() => setShowCancelConfirm(true)}
          >
            <X className="h-3 w-3 mr-1" />
            キャンセル
          </Button>
        </div>

        {/* Cancel Confirmation */}
        {showCancelConfirm && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 space-y-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <p className="text-sm font-medium text-destructive">セッションをキャンセルしますか？</p>
            </div>
            <p className="text-xs text-muted-foreground">すべてのオーダーがキャンセルされます。この操作は取り消せません。</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => setShowCancelConfirm(false)}>
                戻る
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="flex-1"
                onClick={handleCancelSession}
                disabled={cancelSession.isPending}
              >
                {cancelSession.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'キャンセル確定'}
              </Button>
            </div>
          </div>
        )}

        {/* QR Code Display */}
        {showQR && customerUrl && (
          <div className="rounded-lg border border-border bg-white p-4 text-center">
            <QRCodeSVG
              value={customerUrl}
              size={180}
              level="M"
              className="mx-auto"
            />
            <p className="mt-2 text-xs text-muted-foreground">
              お客様用QRコード
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-1"
              onClick={handleCopyQRLink}
            >
              {copied ? (
                <Check className="h-3 w-3 mr-1" />
              ) : (
                <Copy className="h-3 w-3 mr-1" />
              )}
              URLコピー
            </Button>
          </div>
        )}

        {/* Price Adjustment Form */}
        {showAdjustForm && (
          <div className="rounded-lg border border-border p-3 space-y-2">
            <p className="text-sm font-medium text-foreground">金額調整</p>
            <Input
              type="number"
              placeholder="金額"
              value={adjustAmount}
              onChange={(e) => setAdjustAmount(e.target.value)}
              className="text-sm"
            />
            <Input
              type="text"
              placeholder="理由（任意）"
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
              className="text-sm"
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-destructive border-destructive/30"
                onClick={handleAddDiscount}
                disabled={addAdjustment.isPending || !adjustAmount}
              >
                <Minus className="h-3 w-3 mr-1" />
                値引き
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={handleAddSurcharge}
                disabled={addAdjustment.isPending || !adjustAmount}
              >
                <Plus className="h-3 w-3 mr-1" />
                追加
              </Button>
            </div>
            {/* Show existing adjustments */}
            {adjustments && adjustments.length > 0 && (
              <div className="mt-2 space-y-1 border-t border-border pt-2">
                <p className="text-xs text-muted-foreground">適用済み調整:</p>
                {adjustments.map((adj) => (
                  <div key={adj.id} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{adj.reason || adj.adjustment_type}</span>
                    <span className={adj.adjusted_amount < 0 ? 'text-destructive' : 'text-green-600'}>
                      {adj.adjusted_amount > 0 ? '+' : ''}{formatJPY(adj.adjusted_amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="orders" className="flex-1">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="orders">
              <ShoppingBag className="h-3.5 w-3.5 mr-1" />
              オーダー ({activeOrders.length})
            </TabsTrigger>
            <TabsTrigger value="casts">
              <Users className="h-3.5 w-3.5 mr-1" />
              キャスト ({session.assigned_casts?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="log">
              <History className="h-3.5 w-3.5 mr-1" />
              ログ
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="mt-3">
            <ScrollArea className="h-[200px]">
              {ordersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : activeOrders.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">
                  オーダーはありません
                </p>
              ) : (
                <div className="space-y-2">
                  {activeOrders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between rounded-lg border border-border p-2"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium">{order.product?.name_jp}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatJPY(order.unit_price)} × {order.quantity}
                          {(order as any).cast_name && ` • ${(order as any).cast_name}`}
                        </p>
                      </div>
                      {cancelOrderId === order.id ? (
                        <div className="flex items-center gap-1 ml-2">
                          <Button
                            variant="destructive"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => { handleCancelOrder(order); setCancelOrderId(null); }}
                            disabled={cancelOrder.isPending}
                          >
                            確定
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => setCancelOrderId(null)}
                          >
                            戻る
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setCancelOrderId(order.id)}
                          disabled={cancelOrder.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Cancelled orders */}
              {cancelledOrders.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-2">
                    キャンセル済み ({cancelledOrders.length})
                  </p>
                  {cancelledOrders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between rounded-lg border border-border/50 p-2 opacity-50"
                    >
                      <div className="flex-1">
                        <p className="text-sm line-through">{order.product?.name_jp}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatJPY(order.unit_price)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="casts" className="mt-3">
            <ScrollArea className="h-[200px]">
              {/* Assign Cast */}
              {availableCasts.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-muted-foreground mb-1.5">キャストを追加:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {availableCasts.map(cast => (
                      <Button
                        key={cast.id}
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => handleAssignCast(cast.id)}
                        disabled={assignCast.isPending}
                      >
                        <UserPlus className="h-3 w-3 mr-1" />
                        {cast.name}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Assigned Casts */}
              {session.assigned_casts && session.assigned_casts.length > 0 ? (
                <div className="space-y-2">
                  {session.assigned_casts.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="flex items-center justify-between rounded-lg border border-border p-3"
                    >
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                          <Users className="h-4 w-4 text-primary" />
                        </div>
                        <span className="font-medium">{assignment.cast_name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleUnassignCast(assignment.id)}
                        disabled={unassignCast.isPending}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-sm text-muted-foreground py-8">
                  キャストが割り当てられていません
                </p>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="log" className="mt-3">
            <ActivityLog
              orders={orders || []}
              adjustments={adjustments || []}
              maxHeight="200px"
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
