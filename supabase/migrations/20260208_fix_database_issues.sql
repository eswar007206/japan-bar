-- ============================================================
-- Fix Database Issues Migration
-- Run this in the Supabase SQL Editor to fix all database issues
-- ============================================================

-- 1. Add username column to cast_members
ALTER TABLE cast_members ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;
UPDATE cast_members SET username = LOWER(REPLACE(name, ' ', '_')) || '_' || LEFT(id::text, 4)
  WHERE username IS NULL;
ALTER TABLE cast_members ALTER COLUMN username SET NOT NULL;

-- 2. Create store_settings table
CREATE TABLE IF NOT EXISTS public.store_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value NUMERIC NOT NULL DEFAULT 0,
  label TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store settings are readable" ON public.store_settings
  FOR SELECT USING (true);
CREATE POLICY "Staff can manage settings" ON public.store_settings
  FOR ALL USING (public.has_valid_staff_session())
  WITH CHECK (public.has_valid_staff_session());

-- Seed default settings
INSERT INTO public.store_settings (key, value, label) VALUES
  ('bonus_threshold_weekday', 400000, '平日ボーナス閾値'),
  ('bonus_threshold_weekend', 500000, '週末ボーナス閾値'),
  ('bonus_increment', 400000, 'ボーナス増分'),
  ('bonus_base_per_point', 200, '基本ボーナス/ポイント'),
  ('bonus_max_per_point', 600, '最大ボーナス/ポイント'),
  ('welfare_fee', 1000, '厚生費'),
  ('tax_rate', 90, '税率(%)'),
  ('late_pickup_bonus', 500, '遅番ピックアップ'),
  ('referral_bonus', 2000, '紹介ボーナス')
ON CONFLICT (key) DO NOTHING;

-- 3. Add missing RLS policies for cast_members (INSERT/UPDATE)
CREATE POLICY "Staff can insert cast members" ON public.cast_members
  FOR INSERT WITH CHECK (public.has_valid_staff_session());
CREATE POLICY "Staff can update cast members" ON public.cast_members
  FOR UPDATE USING (public.has_valid_staff_session());

-- 4. Add missing RLS policies for daily_reports (INSERT/UPDATE)
CREATE POLICY "Staff can insert daily reports" ON public.daily_reports
  FOR INSERT WITH CHECK (public.has_valid_staff_session());
CREATE POLICY "Staff can update daily reports" ON public.daily_reports
  FOR UPDATE USING (public.has_valid_staff_session());

-- 5. Add missing RLS policies for cast_daily_earnings (INSERT/UPDATE)
CREATE POLICY "Staff can insert cast earnings" ON public.cast_daily_earnings
  FOR INSERT WITH CHECK (public.has_valid_staff_session());
CREATE POLICY "Staff can update cast earnings" ON public.cast_daily_earnings
  FOR UPDATE USING (public.has_valid_staff_session());

-- 6. Add missing RLS policies for cast_referrals
CREATE POLICY "Staff can manage referrals" ON public.cast_referrals
  FOR ALL USING (public.has_valid_staff_session())
  WITH CHECK (public.has_valid_staff_session());

-- 7. Allow staff to insert orders (not just cast)
DROP POLICY IF EXISTS "Orders can be inserted by cast with valid session" ON public.orders;
CREATE POLICY "Orders can be inserted by cast or staff" ON public.orders
  FOR INSERT WITH CHECK (
    public.has_valid_staff_session()
    OR EXISTS (
      SELECT 1 FROM public.cast_sessions cs
      WHERE cs.cast_id = orders.cast_id
      AND cs.expires_at > now()
    )
  );
