/**
 * Girls Bar Fairy - Main Navigation Hub
 * Landing page with navigation to all sections
 */

import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Sparkles, Shield, QrCode, ArrowRight } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card px-4 py-4">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold text-foreground">
            Girls Bar Fairy
          </h1>
          <p className="text-sm text-muted-foreground">
            店舗管理システム
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto max-w-4xl px-4 py-8">
        <div className="grid gap-6 md:grid-cols-3">
          {/* Customer Section */}
          <Card className="transition-all hover:shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                お客様ページ
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                QRコードからアクセスする会計表示ページ（読み取り専用）
              </p>
              <div className="space-y-2">
                <Link to="/customer/demo-token-1">
                  <Button variant="outline" className="w-full justify-between">
                    <span className="flex items-center gap-2">
                      <QrCode className="h-4 w-4" />
                      1号店 テーブル A5
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/customer/demo-token-2">
                  <Button variant="outline" className="w-full justify-between">
                    <span className="flex items-center gap-2">
                      <QrCode className="h-4 w-4" />
                      2号店 テーブル B2
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Cast Section */}
          <Card className="border-primary/50 transition-all hover:shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                キャストページ
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                PINログインでオーダー追加・売上確認
              </p>
              <div className="space-y-2">
                <Link to="/cast/login">
                  <Button className="w-full justify-between">
                    <span>キャストログイン</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <p className="text-xs text-muted-foreground text-center">
                  デモPIN: 1234, 2345, 3456
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Staff Section */}
          <Card className="border-secondary/50 transition-all hover:shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-secondary" />
                スタッフページ
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                両店舗の管理・会計開始/終了・日報
              </p>
              <div className="space-y-2">
                <Link to="/staff">
                  <Button variant="secondary" className="w-full justify-between">
                    <span>スタッフ管理画面</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <p className="text-xs text-muted-foreground text-center">
                  デモPIN: 0000（管理者）
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Info */}
        <div className="mt-8 rounded-lg border border-border bg-card p-4">
          <h2 className="mb-3 font-semibold text-foreground">システム概要</h2>
          <div className="grid gap-4 text-sm md:grid-cols-3">
            <div>
              <p className="font-medium text-foreground">お客様</p>
              <p className="text-muted-foreground">
                テーブルのQRコードをスキャン → 現在の合計金額と残り時間を確認（読み取り専用）
              </p>
            </div>
            <div>
              <p className="font-medium text-foreground">キャスト</p>
              <p className="text-muted-foreground">
                PINログイン → 店舗選択 → テーブル選択 → オーダー追加のみ（編集・削除不可）
              </p>
            </div>
            <div>
              <p className="font-medium text-foreground">スタッフ</p>
              <p className="text-muted-foreground">
                両店舗の全テーブル管理、会計開始/終了、オーダー編集、日報作成
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
