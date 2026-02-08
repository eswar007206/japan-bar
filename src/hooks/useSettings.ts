/**
 * Settings Hook
 * Fetch and update configurable store settings from Supabase
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface StoreSetting {
  id: string;
  key: string;
  value: number;
  label: string;
  updated_at: string;
}

export interface SettingsMap {
  bonus_threshold_weekday: number;
  bonus_threshold_weekend: number;
  bonus_increment: number;
  bonus_base_per_point: number;
  bonus_max_per_point: number;
  welfare_fee: number;
  tax_rate: number; // stored as 90 meaning 0.9
  late_pickup_bonus: number;
  referral_bonus: number;
}

const DEFAULTS: SettingsMap = {
  bonus_threshold_weekday: 400000,
  bonus_threshold_weekend: 500000,
  bonus_increment: 400000,
  bonus_base_per_point: 200,
  bonus_max_per_point: 600,
  welfare_fee: 1000,
  tax_rate: 90,
  late_pickup_bonus: 500,
  referral_bonus: 2000,
};

export function useSettings() {
  return useQuery({
    queryKey: ['store_settings'],
    queryFn: async (): Promise<SettingsMap> => {
      const { data, error } = await supabase
        .from('store_settings')
        .select('*');

      if (error) {
        console.warn('Failed to load settings, using defaults:', error.message);
        return DEFAULTS;
      }

      const map = { ...DEFAULTS };
      (data || []).forEach((row: any) => {
        if (row.key in map) {
          (map as any)[row.key] = row.value;
        }
      });
      return map;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

export function useSettingsRaw() {
  return useQuery({
    queryKey: ['store_settings_raw'],
    queryFn: async (): Promise<StoreSetting[]> => {
      const { data, error } = await supabase
        .from('store_settings')
        .select('*')
        .order('key');

      if (error) throw error;
      return (data || []) as StoreSetting[];
    },
  });
}

export function useUpdateSetting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: number }) => {
      const { data, error } = await supabase
        .from('store_settings')
        .update({ value, updated_at: new Date().toISOString() })
        .eq('key', key)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store_settings'] });
      queryClient.invalidateQueries({ queryKey: ['store_settings_raw'] });
    },
  });
}

export function getDefaultSettings(): SettingsMap {
  return { ...DEFAULTS };
}
