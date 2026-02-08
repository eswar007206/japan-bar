/**
 * Girls Bar Fairy - Customer Bill Page
 * Read-only bill monitor accessed via QR code
 *
 * Routes:
 *   /customer/:readToken  - legacy per-session token
 *   /table/:tableId       - permanent per-table QR code
 */

import { useParams } from 'react-router-dom';
import { useBillPolling } from '@/hooks/useBillPolling';
import { BillHeader } from '@/components/customer/BillHeader';
import { TimeDisplayBlock } from '@/components/customer/TimeDisplayBlock';
import { TotalAmountDisplay } from '@/components/customer/TotalAmountDisplay';
import { ExtensionPreview } from '@/components/customer/ExtensionPreview';
import { PaymentMethodIcons } from '@/components/customer/PaymentMethodIcons';
import { OrderListDisplay } from '@/components/customer/OrderListDisplay';
import { OfflineWarning } from '@/components/customer/OfflineWarning';
import { LoadingState } from '@/components/customer/LoadingState';
import { NoSessionState } from '@/components/customer/NoSessionState';

export default function CustomerBillPage() {
  const { readToken, tableId } = useParams<{ readToken?: string; tableId?: string }>();

  const isTableMode = !!tableId;

  const { data, isLoading, isOffline, error } = useBillPolling({
    readToken: readToken,
    tableId: tableId,
    enabled: !!(readToken || tableId),
  });

  // Show loading state on initial load
  if (isLoading && !data) {
    return <LoadingState />;
  }

  // No open bill - show different states based on mode
  if (!data) {
    if (isTableMode) {
      // Permanent QR: show "no session" with auto-refresh indicator
      return <NoSessionState />;
    }
    // Legacy token: show preparing state (token may be invalid)
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

            {/* Divider */}
            <div className="bill-divider" />

            {/* Time information */}
            <TimeDisplayBlock
              startTime={data.start_time}
              elapsedMinutes={data.elapsed_minutes}
              remainingMinutes={data.remaining_minutes}
            />

            {/* Order items list */}
            {data.order_items && data.order_items.length > 0 && (
              <>
                <div className="bill-divider" />
                <OrderListDisplay items={data.order_items} />
              </>
            )}

            {/* Divider */}
            <div className="bill-divider" />

            {/* Current total - largest display */}
            <TotalAmountDisplay amount={data.current_total} />

            {/* Extension preview (conditional) */}
            {data.show_extension_preview && (
              <ExtensionPreview extensionTotal={data.extension_preview_total} />
            )}

          </div>

          {/* Payment methods */}
          <div className="space-y-4">
            <p className="text-center text-sm font-medium text-muted-foreground">
              お支払い方法
            </p>
            <PaymentMethodIcons methods={data.accepted_payment_methods} />
          </div>

          {/* Footer note */}
          <div className="text-center pt-4">
            <p className="text-sm text-muted-foreground">
              {data.footer_note}
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
