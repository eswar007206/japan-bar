/**
 * Staff Shift Approvals Page
 * Approve or reject cast clock-in and clock-out requests
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStaffAuth } from '@/contexts/StaffAuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, Check, X, Clock, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import {
  usePendingShiftApprovals,
  useApproveClockIn,
  useRejectClockIn,
  useApproveClockOut,
  useRejectClockOut,
  type PendingShift,
} from '@/hooks/useShiftApprovals';

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString('ja-JP', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function ShiftCard({ shift, staffId }: { shift: PendingShift; staffId: string }) {
  const approveClockIn = useApproveClockIn();
  const rejectClockIn = useRejectClockIn();
  const approveClockOut = useApproveClockOut();
  const rejectClockOut = useRejectClockOut();

  const hasPendingClockIn = shift.clock_in_status === 'pending';
  const hasPendingClockOut = shift.clock_out && shift.clock_out_status === 'pending';

  const handleApproveClockIn = async () => {
    try {
      await approveClockIn.mutateAsync({ shiftId: shift.id, staffId });
      toast.success('出勤を承認しました');
    } catch (error) {
      toast.error('承認に失敗しました');
    }
  };

  const handleRejectClockIn = async () => {
    try {
      await rejectClockIn.mutateAsync({ shiftId: shift.id, staffId });
      toast.error('出勤を却下しました');
    } catch (error) {
      toast.error('却下に失敗しました');
    }
  };

  const handleApproveClockOut = async () => {
    try {
      await approveClockOut.mutateAsync({ shiftId: shift.id, staffId });
      toast.success('退勤を承認しました');
    } catch (error) {
      toast.error('承認に失敗しました');
    }
  };

  const handleRejectClockOut = async () => {
    try {
      await rejectClockOut.mutateAsync({ shiftId: shift.id, staffId });
      toast.error('退勤を却下しました');
    } catch (error) {
      toast.error('却下に失敗しました');
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-foreground">{shift.cast_name}</h3>
              <Badge variant="outline" className="text-xs">
                {shift.store_name}
              </Badge>
            </div>

            {/* Clock-in info */}
            {hasPendingClockIn && (
              <div className="mt-2 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800">出勤申請</span>
                </div>
                <p className="text-sm text-yellow-700 mb-3">
                  {formatDateTime(shift.clock_in)}
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="default"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={handleApproveClockIn}
                    disabled={approveClockIn.isPending}
                  >
                    {approveClockIn.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        承認
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-200 text-red-600 hover:bg-red-50"
                    onClick={handleRejectClockIn}
                    disabled={rejectClockIn.isPending}
                  >
                    {rejectClockIn.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <X className="h-4 w-4 mr-1" />
                        却下
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Clock-out info */}
            {hasPendingClockOut && (
              <div className="mt-2 p-3 rounded-lg bg-blue-50 border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <UserCheck className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">退勤申請</span>
                </div>
                <p className="text-sm text-blue-700 mb-1">
                  出勤: {formatTime(shift.clock_in)}
                </p>
                <p className="text-sm text-blue-700 mb-3">
                  退勤: {formatDateTime(shift.clock_out!)}
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="default"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={handleApproveClockOut}
                    disabled={approveClockOut.isPending}
                  >
                    {approveClockOut.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        承認
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-200 text-red-600 hover:bg-red-50"
                    onClick={handleRejectClockOut}
                    disabled={rejectClockOut.isPending}
                  >
                    {rejectClockOut.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <X className="h-4 w-4 mr-1" />
                        却下
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function StaffShiftApprovalsPage() {
  const navigate = useNavigate();
  const { isLoading: authLoading, isAuthenticated, staffMember } = useStaffAuth();
  const { data: pendingShifts, isLoading } = usePendingShiftApprovals();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/staff/login');
    }
  }, [authLoading, isAuthenticated, navigate]);

  if (authLoading || isLoading) {
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
      {/* Header */}
      <header className="border-b border-border bg-card px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/staff/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="font-bold text-foreground">出退勤承認</h1>
              <p className="text-xs text-muted-foreground">
                キャストの出勤・退勤申請を承認または却下
              </p>
            </div>
          </div>
          {pendingShifts && pendingShifts.length > 0 && (
            <Badge variant="destructive" className="text-sm">
              {pendingShifts.length}件 保留中
            </Badge>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto max-w-2xl p-4 space-y-4">
        {pendingShifts && pendingShifts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Check className="h-12 w-12 mx-auto mb-3 text-green-600" />
              <p className="text-lg font-medium text-foreground">承認待ちなし</p>
              <p className="text-sm text-muted-foreground mt-1">
                すべての出退勤申請が処理されました
              </p>
            </CardContent>
          </Card>
        ) : (
          pendingShifts?.map((shift) => (
            <ShiftCard key={shift.id} shift={shift} staffId={staffMember?.id || ''} />
          ))
        )}
      </main>
    </div>
  );
}
