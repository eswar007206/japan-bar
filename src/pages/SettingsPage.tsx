/**
 * Settings Page
 * Editable configurable values for bonus thresholds, fees, etc.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStaffAuth } from '@/contexts/StaffAuthContext';
import { useSettingsRaw, useUpdateSetting, type StoreSetting } from '@/hooks/useSettings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, ArrowLeft, Save, Check } from 'lucide-react';
import { toast } from 'sonner';
import { formatJPY } from '@/types/billing';

const SETTING_LABELS: Record<string, string> = {
  business_day_start_hour: '営業開始時刻（時） - 0-23',
  bonus_threshold_weekday: '平日大入ボーダー',
  bonus_threshold_weekend: '金土祝前日大入ボーダー',
  bonus_increment: '大入増額幅',
  bonus_base_per_point: '大入基本単価 (円/pt)',
  bonus_max_per_point: '大入MAX単価 (円/pt)',
  welfare_fee: '厚生費',
  tax_rate: '税率 (90 = ×0.9)',
  late_pickup_bonus: '遅番帰りボーナス (円/時)',
  referral_bonus: '紹介ボーナス (円/出勤)',
};

const SETTING_ORDER = [
  'business_day_start_hour',
  'bonus_threshold_weekday',
  'bonus_threshold_weekend',
  'bonus_increment',
  'bonus_base_per_point',
  'bonus_max_per_point',
  'welfare_fee',
  'tax_rate',
  'late_pickup_bonus',
  'referral_bonus',
];

export default function SettingsPage() {
  const navigate = useNavigate();
  const { isLoading: authLoading, isAuthenticated } = useStaffAuth();
  const { data: settings, isLoading } = useSettingsRaw();
  const updateSetting = useUpdateSetting();

  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/staff/login');
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Initialize edit values from fetched settings
  useEffect(() => {
    if (settings) {
      const values: Record<string, string> = {};
      settings.forEach(s => {
        values[s.key] = s.value.toString();
      });
      setEditValues(values);
    }
  }, [settings]);

  const handleSave = async (key: string) => {
    const value = parseInt(editValues[key]);
    if (isNaN(value)) {
      toast.error('数値を入力してください');
      return;
    }

    try {
      await updateSetting.mutateAsync({ key, value });
      setSavedKeys(prev => new Set(prev).add(key));
      setTimeout(() => {
        setSavedKeys(prev => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      }, 2000);
      toast.success('保存しました');
    } catch (error) {
      toast.error('保存に失敗しました');
    }
  };

  const hasChanged = (key: string): boolean => {
    const original = settings?.find(s => s.key === key);
    if (!original) return false;
    return editValues[key] !== original.value.toString();
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-secondary" />
        </div>
      </div>
    );
  }

  // Sort settings by predefined order
  const sortedSettings = SETTING_ORDER
    .map(key => settings?.find(s => s.key === key))
    .filter((s): s is StoreSetting => !!s);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/staff')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-bold text-foreground">設定</h1>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto max-w-lg p-4 space-y-3">
        <p className="text-xs text-muted-foreground mb-2">
          各項目を変更して保存ボタンを押してください。変更は即座に反映されます。
        </p>

        {sortedSettings.map(setting => (
          <Card key={setting.key}>
            <CardContent className="p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">
                    {SETTING_LABELS[setting.key] || setting.label}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    className="w-28 text-right"
                    value={editValues[setting.key] ?? setting.value}
                    onChange={e =>
                      setEditValues(prev => ({ ...prev, [setting.key]: e.target.value }))
                    }
                  />
                  <Button
                    variant={savedKeys.has(setting.key) ? 'default' : 'outline'}
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    onClick={() => handleSave(setting.key)}
                    disabled={updateSetting.isPending || !hasChanged(setting.key)}
                  >
                    {savedKeys.has(setting.key) ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {sortedSettings.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              設定データが見つかりません。Supabaseで store_settings テーブルを作成してください。
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
