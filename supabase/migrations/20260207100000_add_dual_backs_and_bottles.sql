-- =====================================================
-- ADD DUAL BACK COLUMNS & ALL 19 BOTTLES
-- Fix tax_applicable for free extensions
-- =====================================================

-- 1. Add back_free and back_designated columns to products
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS back_free INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS back_designated INTEGER DEFAULT 0;

-- 2. Migrate existing back data to both columns (same value for non-bottle items)
UPDATE public.products SET back_free = back, back_designated = back WHERE category != 'bottles';

-- 3. Fix tax_applicable for free extensions (requirement: only 初回フリーセット is tax-free)
UPDATE public.products SET tax_applicable = true WHERE name_jp IN ('20分フリー延長', '40分フリー延長');

-- 4. Delete existing 3 bottles (wrong back/points values)
DELETE FROM public.products WHERE category = 'bottles';

-- 5. Insert all 19 champagne/bottles with correct points and dual backs
-- Prices are PLACEHOLDER (marked as 0) - to be updated with actual prices from client
INSERT INTO public.products (name_jp, category, price, back, back_free, back_designated, points, tax_applicable, drink_units, sort_order) VALUES
    ('カフェ・ド・パリ',           'bottles', 0, 0, 1700,  2550,  4,   true, 0, 50),
    ('カフェ・ド・パリ ルージュ',   'bottles', 0, 0, 2000,  3000,  5,   true, 0, 51),
    ('アスティ',                   'bottles', 0, 0, 2400,  3750,  6,   true, 0, 52),
    ('マバム',                     'bottles', 0, 0, 3200,  4800,  8,   true, 0, 53),
    ('モエ・エ・シャンドン',        'bottles', 0, 0, 4000,  6000,  9,   true, 0, 54),
    ('モエ・エ・シャンドン ロゼ',   'bottles', 0, 0, 5000,  7500,  12,  true, 0, 55),
    ('モエ・エ・シャンドン ネクター','bottles', 0, 0, 6000,  9000,  14,  true, 0, 56),
    ('ヴーヴ ホワイト',            'bottles', 0, 0, 6400,  9600,  15,  true, 0, 57),
    ('ヴーヴ リッチ',              'bottles', 0, 0, 7200,  10800, 17,  true, 0, 58),
    ('モエ・エ・シャンドン アイス', 'bottles', 0, 0, 7200,  10800, 17,  true, 0, 59),
    ('モエ・エ・シャンドン N.I.R',  'bottles', 0, 0, 8400,  12600, 20,  true, 0, 60),
    ('ソウメイ',                   'bottles', 0, 0, 16000, 24000, 38,  true, 0, 61),
    ('ベルエポック',               'bottles', 0, 0, 18000, 27000, 42,  true, 0, 62),
    ('ドン・ペリニヨン',           'bottles', 0, 0, 20000, 30000, 47,  true, 0, 63),
    ('ドン・ペリニヨン ロゼ',      'bottles', 0, 0, 24000, 36000, 56,  true, 0, 64),
    ('エンジェル ブラック',        'bottles', 0, 0, 32000, 48000, 75,  true, 0, 65),
    ('エンジェル ヘイロー',        'bottles', 0, 0, 36000, 54000, 85,  true, 0, 66),
    ('エンジェル ホワイト',        'bottles', 0, 0, 44000, 66000, 103, true, 0, 67),
    ('エンジェル ドゥミセック',    'bottles', 0, 0, 50000, 75000, 118, true, 0, 68);

-- 6. Add payment_method to bills for tracking how each bill was settled
ALTER TABLE public.bills
ADD COLUMN IF NOT EXISTS payment_method TEXT;
