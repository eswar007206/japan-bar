/**
 * QR Codes Generator Page
 * Staff can generate and print all QR codes for tables, cast, and staff access
 */

import { useNavigate } from 'react-router-dom';
import { useStaffAuth } from '@/contexts/StaffAuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowLeft, Download, Printer } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useEffect } from 'react';

export default function QRCodesPage() {
  const navigate = useNavigate();
  const { isLoading: authLoading, isAuthenticated } = useStaffAuth();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/staff/login');
    }
  }, [authLoading, isAuthenticated, navigate]);

  const baseUrl = window.location.origin;

  // Store 1 tables
  const store1CounterTables = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7'];
  const store1SofaTables = ['B1', 'B2', 'B3', 'B4', 'B5', 'B6'];

  // Store 2 tables
  const store2CounterTables = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6'];
  const store2SofaTables = ['B1', 'B2', 'B3', 'B4', 'B5', 'B6'];

  const handlePrint = () => {
    window.print();
  };

  const downloadQR = (tableId: string) => {
    const svg = document.getElementById(`qr-${tableId}`);
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');

      const downloadLink = document.createElement('a');
      downloadLink.download = `QR-${tableId}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-secondary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card px-4 py-3 print:hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/staff/dashboard')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="font-bold text-foreground">QRコード生成</h1>
          </div>
          <Button onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            印刷
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto max-w-6xl p-4 space-y-8">
        {/* Instructions */}
        <Card className="print:hidden">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">
              すべてのQRコードを印刷してテーブルに配置してください。
              お客様がQRコードをスキャンすると、そのテーブルの注文画面が表示されます。
            </p>
          </CardContent>
        </Card>

        {/* Current URL Info */}
        <Card className="print:hidden">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Base URL:</p>
            <p className="text-sm font-mono font-medium">{baseUrl}</p>
          </CardContent>
        </Card>

        {/* Store 1 Tables */}
        <div>
          <h2 className="text-xl font-bold mb-4">1号店 - テーブルQRコード</h2>

          {/* Counter Tables */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">カウンター席</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {store1CounterTables.map((table) => {
                const tableId = `1-${table.toLowerCase()}`;
                const url = `${baseUrl}/table/${tableId}`;
                return (
                  <Card key={tableId} className="break-inside-avoid">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-center text-lg">1号店 {table}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center space-y-2">
                      <QRCodeSVG
                        id={`qr-${tableId}`}
                        value={url}
                        size={150}
                        level="M"
                        className="border-4 border-white"
                      />
                      <p className="text-xs text-center break-all font-mono">{url}</p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full print:hidden"
                        onClick={() => downloadQR(tableId)}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        保存
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Sofa Tables */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">ソファ席</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {store1SofaTables.map((table) => {
                const tableId = `1-${table.toLowerCase()}`;
                const url = `${baseUrl}/table/${tableId}`;
                return (
                  <Card key={tableId} className="break-inside-avoid">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-center text-lg">1号店 {table}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center space-y-2">
                      <QRCodeSVG
                        id={`qr-${tableId}`}
                        value={url}
                        size={150}
                        level="M"
                        className="border-4 border-white"
                      />
                      <p className="text-xs text-center break-all font-mono">{url}</p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full print:hidden"
                        onClick={() => downloadQR(tableId)}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        保存
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>

        {/* Store 2 Tables */}
        <div className="page-break-before">
          <h2 className="text-xl font-bold mb-4">2号店 - テーブルQRコード</h2>

          {/* Counter Tables */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">カウンター席</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {store2CounterTables.map((table) => {
                const tableId = `2-${table.toLowerCase()}`;
                const url = `${baseUrl}/table/${tableId}`;
                return (
                  <Card key={tableId} className="break-inside-avoid">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-center text-lg">2号店 {table}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center space-y-2">
                      <QRCodeSVG
                        id={`qr-${tableId}`}
                        value={url}
                        size={150}
                        level="M"
                        className="border-4 border-white"
                      />
                      <p className="text-xs text-center break-all font-mono">{url}</p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full print:hidden"
                        onClick={() => downloadQR(tableId)}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        保存
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Sofa Tables */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">ソファ席</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {store2SofaTables.map((table) => {
                const tableId = `2-${table.toLowerCase()}`;
                const url = `${baseUrl}/table/${tableId}`;
                return (
                  <Card key={tableId} className="break-inside-avoid">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-center text-lg">2号店 {table}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center space-y-2">
                      <QRCodeSVG
                        id={`qr-${tableId}`}
                        value={url}
                        size={150}
                        level="M"
                        className="border-4 border-white"
                      />
                      <p className="text-xs text-center break-all font-mono">{url}</p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full print:hidden"
                        onClick={() => downloadQR(tableId)}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        保存
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>

        {/* Cast & Staff Access */}
        <div className="page-break-before">
          <h2 className="text-xl font-bold mb-4">キャスト・スタッフアクセス</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Cast Login QR */}
            <Card>
              <CardHeader>
                <CardTitle className="text-center">キャストログイン</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center space-y-2">
                <QRCodeSVG
                  id="qr-cast-login"
                  value={`${baseUrl}/cast/login`}
                  size={200}
                  level="M"
                  className="border-4 border-white"
                />
                <p className="text-sm text-center break-all font-mono">{baseUrl}/cast/login</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full print:hidden"
                  onClick={() => downloadQR('cast-login')}
                >
                  <Download className="h-3 w-3 mr-1" />
                  保存
                </Button>
              </CardContent>
            </Card>

            {/* Staff Login Link (no QR needed, just bookmark) */}
            <Card>
              <CardHeader>
                <CardTitle className="text-center">スタッフログイン</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center space-y-2">
                <div className="h-[200px] flex items-center justify-center bg-muted rounded">
                  <p className="text-center text-sm text-muted-foreground px-4">
                    スタッフ端末にブックマーク保存してください
                  </p>
                </div>
                <p className="text-sm text-center break-all font-mono">{baseUrl}/staff/login</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    navigator.clipboard.writeText(`${baseUrl}/staff/login`);
                    alert('URLをコピーしました');
                  }}
                >
                  URLコピー
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Print Styles */}
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 10mm;
          }
          .page-break-before {
            page-break-before: always;
          }
          .break-inside-avoid {
            break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
}
