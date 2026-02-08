-- Add missing tables for complete cast system

-- Cast shifts (clock in/out)
CREATE TABLE public.cast_shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cast_id UUID REFERENCES public.cast_members(id) ON DELETE CASCADE NOT NULL,
    store_id INTEGER REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
    clock_in TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    clock_out TIMESTAMP WITH TIME ZONE,
    late_pickup_start TIMESTAMP WITH TIME ZONE,
    is_late_pickup BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Daily reports (per store)
CREATE TABLE public.daily_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id INTEGER REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
    report_date DATE NOT NULL,
    total_sales INTEGER DEFAULT 0,
    total_bills INTEGER DEFAULT 0,
    total_customers INTEGER DEFAULT 0,
    bonus_tier INTEGER DEFAULT 0,
    bonus_per_point INTEGER DEFAULT 0,
    is_weekend_holiday BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE(store_id, report_date)
);

-- Cast daily earnings (calculated per day per cast)
CREATE TABLE public.cast_daily_earnings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cast_id UUID REFERENCES public.cast_members(id) ON DELETE CASCADE NOT NULL,
    store_id INTEGER REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
    earning_date DATE NOT NULL,
    work_minutes INTEGER DEFAULT 0,
    base_wage INTEGER DEFAULT 0,
    total_backs INTEGER DEFAULT 0,
    drink_points INTEGER DEFAULT 0,
    champagne_points DECIMAL(5,1) DEFAULT 0,
    bonus_amount INTEGER DEFAULT 0,
    gross_amount INTEGER DEFAULT 0,
    tax_deduction INTEGER DEFAULT 0,
    welfare_fee INTEGER DEFAULT 1000,
    transport_fee INTEGER DEFAULT 0,
    net_payout INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE(cast_id, store_id, earning_date)
);

-- Referrals (cast A refers cast B)
CREATE TABLE public.cast_referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID REFERENCES public.cast_members(id) ON DELETE CASCADE NOT NULL,
    referred_id UUID REFERENCES public.cast_members(id) ON DELETE CASCADE NOT NULL,
    referral_bonus INTEGER DEFAULT 2000,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE(referrer_id, referred_id)
);

-- Bill designation tracking (for 3-extension rule)
CREATE TABLE public.bill_designations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bill_id UUID REFERENCES public.bills(id) ON DELETE CASCADE NOT NULL,
    cast_id UUID REFERENCES public.cast_members(id) ON DELETE CASCADE NOT NULL,
    extension_count INTEGER DEFAULT 0,
    is_designated BOOLEAN DEFAULT false,
    designated_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE(bill_id, cast_id)
);

-- Add columns to existing tables
ALTER TABLE public.cast_members ADD COLUMN IF NOT EXISTS transport_fee INTEGER DEFAULT 0;
ALTER TABLE public.cast_members ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES public.cast_members(id);

-- Add drink unit tracking to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS drink_units INTEGER DEFAULT 0;

-- Enable RLS
ALTER TABLE public.cast_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cast_daily_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cast_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_designations ENABLE ROW LEVEL SECURITY;

-- RLS Policies (read for all, write restricted)
CREATE POLICY "Cast shifts are readable" ON public.cast_shifts FOR SELECT USING (true);
CREATE POLICY "Cast shifts can be inserted by valid session" ON public.cast_shifts 
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.cast_sessions cs
            WHERE cs.cast_id = cast_shifts.cast_id
            AND cs.expires_at > now()
        )
    );
CREATE POLICY "Cast shifts can be updated by valid session" ON public.cast_shifts 
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.cast_sessions cs
            WHERE cs.cast_id = cast_shifts.cast_id
            AND cs.expires_at > now()
        )
    );

CREATE POLICY "Daily reports are readable" ON public.daily_reports FOR SELECT USING (true);

CREATE POLICY "Cast earnings are readable" ON public.cast_daily_earnings FOR SELECT USING (true);

CREATE POLICY "Referrals are readable" ON public.cast_referrals FOR SELECT USING (true);

CREATE POLICY "Bill designations are readable" ON public.bill_designations FOR SELECT USING (true);
CREATE POLICY "Bill designations can be inserted" ON public.bill_designations 
    FOR INSERT WITH CHECK (true);
CREATE POLICY "Bill designations can be updated" ON public.bill_designations 
    FOR UPDATE USING (true);

-- Insert drink products with units (S=1, M=2, L=3, Shot=2)
INSERT INTO public.products (name_jp, category, price, back, points, tax_applicable, drink_units, sort_order) VALUES
    ('ドリンク S', 'drinks', 800, 100, 0, true, 1, 40),
    ('ドリンク M', 'drinks', 1200, 150, 0, true, 2, 41),
    ('ドリンク L', 'drinks', 1500, 200, 0, true, 3, 42),
    ('ショット', 'drinks', 1000, 100, 0, true, 2, 43);

-- Insert champagne products with points
INSERT INTO public.products (name_jp, category, price, back, points, tax_applicable, sort_order) VALUES
    ('カフェ・ド・パリ', 'bottles', 5000, 500, 4, true, 50),
    ('モエ・エ・シャンドン', 'bottles', 15000, 1500, 8, true, 51),
    ('ドンペリ', 'bottles', 30000, 3000, 15, true, 52);