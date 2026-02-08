/**
 * Staff Reports Page
 * Daily reports, cast earnings, and session logs
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStaffAuth } from '@/contexts/StaffAuthContext';
import { useStores } from '@/hooks/useCastData';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Loader2, 
  ArrowLeft,
  CalendarIcon,
  FileText,
  Users,
  ClipboardList,
} from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import CastDailyEarningsSheet from '@/components/staff/reports/CastDailyEarningsSheet';
import DailyReportSheet from '@/components/staff/reports/DailyReportSheet';
import SessionLogSheet from '@/components/staff/reports/SessionLogSheet';
import { useSettings } from '@/hooks/useSettings';

export default function StaffReportsPage() {
  const navigate = useNavigate();
  const { isLoading: authLoading, isAuthenticated } = useStaffAuth();
  const { data: stores, isLoading: storesLoading } = useStores();
  const { data: settingsData } = useSettings();
  
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedStoreId, setSelectedStoreId] = useState<number | 'both'>('both');
  const [activeTab, setActiveTab] = useState('daily');

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/staff/login');
    }
  }, [authLoading, isAuthenticated, navigate]);

  if (authLoading || storesLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-secondary" />
        </div>
      </div>
    );
  }

  const selectedStore = stores?.find(s => s.id === selectedStoreId);
  const storeName = selectedStoreId === 'both' 
    ? '両店舗' 
    : selectedStore?.name || '';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate('/staff/dashboard')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="font-bold text-foreground">日報・レポート</h1>
              <p className="text-xs text-muted-foreground">
                売上集計・キャスト給与・来店記録
              </p>
            </div>
          </div>
          
          {/* Date & Store Selector */}
          <div className="flex items-center gap-2">
            <Select 
              value={selectedStoreId.toString()} 
              onValueChange={(v) => setSelectedStoreId(v === 'both' ? 'both' : parseInt(v))}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="店舗選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="both">両店舗</SelectItem>
                {stores?.map((store) => (
                  <SelectItem key={store.id} value={store.id.toString()}>
                    {store.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[180px] justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(selectedDate, 'yyyy年M月d日', { locale: ja })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
        <div className="border-b border-border bg-muted/30 px-4">
          <TabsList className="h-12 bg-transparent">
            <TabsTrigger value="daily" className="data-[state=active]:bg-card">
              <FileText className="h-4 w-4 mr-2" />
              日計表
            </TabsTrigger>
            <TabsTrigger value="cast" className="data-[state=active]:bg-card">
              <Users className="h-4 w-4 mr-2" />
              キャスト日払い表
            </TabsTrigger>
            <TabsTrigger value="sessions" className="data-[state=active]:bg-card">
              <ClipboardList className="h-4 w-4 mr-2" />
              来店記録
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="p-4">
          <TabsContent value="daily" className="mt-0">
            <DailyReportSheet
              storeId={selectedStoreId}
              date={selectedDate}
              settings={settingsData}
            />
          </TabsContent>

          <TabsContent value="cast" className="mt-0">
            {selectedStoreId === 'both' ? (
              <div className="space-y-4">
                {stores?.map((store) => (
                  <CastDailyEarningsSheet
                    key={store.id}
                    storeId={store.id}
                    date={selectedDate}
                    storeName={store.name}
                    settings={settingsData}
                  />
                ))}
              </div>
            ) : (
              <CastDailyEarningsSheet
                storeId={selectedStoreId}
                date={selectedDate}
                storeName={storeName}
                settings={settingsData}
              />
            )}
          </TabsContent>

          <TabsContent value="sessions" className="mt-0">
            {selectedStoreId === 'both' ? (
              <div className="space-y-4">
                {stores?.map((store) => (
                  <SessionLogSheet
                    key={store.id}
                    storeId={store.id}
                    date={selectedDate}
                    storeName={store.name}
                  />
                ))}
              </div>
            ) : (
              <SessionLogSheet
                storeId={selectedStoreId}
                date={selectedDate}
                storeName={storeName}
              />
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
