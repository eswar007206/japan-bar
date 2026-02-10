/**
 * Girls Bar Fairy - Customer Bill Page
 * Bill monitor accessed via QR code with payment method selection
 *
 * Routes:
 *   /customer/:readToken  - legacy per-session token
 *   /table/:tableId       - permanent per-table QR code
 */

import { useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useBillPolling } from '@/hooks/useBillPolling';
import { updateBillPaymentMethod } from '@/services/billingService';
import { BillHeader } from '@/components/customer/BillHeader';
import { TotalAmountDisplay } from '@/components/customer/TotalAmountDisplay';
import { TimeDisplayBlock } from '@/components/customer/TimeDisplayBlock';
import { ExtensionPreview } from '@/components/customer/ExtensionPreview';
import { PaymentMethodIcons } from '@/components/customer/PaymentMethodIcons';
import { OfflineWarning } from '@/components/customer/OfflineWarning';
import { LoadingState } from '@/components/customer/LoadingState';
import { NoSessionState } from '@/components/customer/NoSessionState';
import type { PaymentMethod } from '@/types/billing';
import { toast } from 'sonner';

export default function CustomerBillPage() {
  const { readToken, tableId } = useParams<{ readToken?: string; tableId?: string }>();
  const isTableMode = !!tableId;

  const { data, isLoading, isOffline, error, refetch } = useBillPolling({
    readToken: readToken,
    tableId: tableId,
    enabled: !!(readToken || tableId),
  });

  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false);

  const handleSelectPaymentMethod = useCallback(async (method: PaymentMethod) => {
    if (!data?.bill_id) return;

    setIsUpdatingPayment(true);
    try {
      await updateBillPaymentMethod(data.bill_id, method);
      await refetch();
    } catch (err) {
      console.error('Failed to update payment method:', err);
      toast.error('お支払い方法の更新に失敗しました');
    } finally {
      setIsUpdatingPayment(false);
    }
  }, [data?.bill_id, refetch]);

  // Show loading state on initial load
  if (isLoading && !data) {
    return <LoadingState />;
  }

  // No open bill - show different states based on mode
  if (!data) {
    if (isTableMode) {
      return <NoSessionState />;
    }
    return <NoSessionState />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Offline warning banner */}
      {isOffline && <OfflineWarning message={error || undefined} />}

      {/* Main content */}
      <div className={`px-4 py-6 sm:py-8 ${isOffline ? 'pt-16' : ''}`}>
        <div className="mx-auto max-w-md space-y-6">

          {/* Bill Card */}
          <div className="bill-card p-6 sm:p-8 space-y-6">

            {/* Header: Store name and table */}
            <BillHeader
              storeName={data.store_name}
              tableLabel={data.table_label}
            />

            {/* Time display */}
            <TimeDisplayBlock
              startTime={data.start_time}
              elapsedMinutes={data.elapsed_minutes}
              remainingMinutes={data.remaining_minutes}
            />

            {/* Divider */}
            <div className="bill-divider" />

            {/* Current total - largest display */}
            <TotalAmountDisplay amount={data.current_total} paymentMethod={data.payment_method} />

            {/* Extension preview (conditional) */}
            {data.show_extension_preview && (
              <ExtensionPreview extensionTotal={data.extension_preview_total} />
            )}

          </div>

          {/* Payment method selection */}
          <div className="bill-card p-6 sm:p-8 space-y-4">
            <p className="text-center text-sm font-semibold text-foreground">
              お支払い方法を選択してください
            </p>
            <PaymentMethodIcons
              methods={data.accepted_payment_methods}
              selectedMethod={data.payment_method}
              onSelectMethod={handleSelectPaymentMethod}
              isUpdating={isUpdatingPayment}
            />
          </div>

        </div>
      </div>
    </div>
  );
}
