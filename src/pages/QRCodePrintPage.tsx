/**
 * QR Code Print Page
 * Printable grid of permanent table QR codes for all tables in both stores.
 * Staff can print this page and cut out individual QR stickers.
 */

import { useNavigate } from 'react-router-dom';
import { useStores } from '@/hooks/useCastData';
import { useStaffFloorTables } from '@/hooks/useStaffData';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Printer } from 'lucide-react';

export default function QRCodePrintPage() {
  const navigate = useNavigate();
  const { data: stores, isLoading: storesLoading } = useStores();

  if (storesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header - hidden when printing */}
      <div className="print:hidden border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/staff/dashboard')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="font-bold text-foreground">テーブルQRコード一覧</h1>
        </div>
        <Button onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-2" />
          印刷
        </Button>
      </div>

      {/* QR Code Grid */}
      <div className="p-4 print:p-0">
        {stores?.map((store) => (
          <StoreQRSection key={store.id} storeId={store.id} storeName={store.name} />
        ))}
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body { background: white !important; }
          .print\\:hidden { display: none !important; }
          .print\\:p-0 { padding: 0 !important; }
          .print\\:break-before-page { break-before: page; }
          @page { margin: 10mm; }
        }
      `}</style>
    </div>
  );
}

function StoreQRSection({ storeId, storeName }: { storeId: number; storeName: string }) {
  const { data: tables, isLoading } = useStaffFloorTables(storeId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const sortedTables = [...(tables || [])].sort((a, b) => a.label.localeCompare(b.label));
  const baseUrl = window.location.origin;

  return (
    <div className="mb-8 print:mb-4">
      <h2 className="text-lg font-bold text-foreground mb-4 print:text-base">{storeName}</h2>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 print:grid-cols-5 print:gap-2">
        {sortedTables.map((table) => {
          const url = `${baseUrl}/table/${table.id}`;
          return (
            <div
              key={table.id}
              className="border border-border rounded-lg p-3 flex flex-col items-center gap-2 print:border-gray-300 print:p-2"
            >
              <QRCodeSVG
                value={url}
                size={120}
                level="H"
                className="print:w-[100px] print:h-[100px]"
              />
              <p className="text-sm font-bold text-foreground print:text-xs">{table.label}</p>
              <p className="text-[9px] text-muted-foreground truncate max-w-full print:hidden">
                {url}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
