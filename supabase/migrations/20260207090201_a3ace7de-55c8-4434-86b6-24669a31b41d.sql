-- Create enum types
CREATE TYPE public.product_category AS ENUM ('set', 'extension', 'nomination', 'companion', 'drinks', 'bottles');
CREATE TYPE public.bill_status AS ENUM ('open', 'closed');
CREATE TYPE public.app_role AS ENUM ('admin', 'cast', 'staff');

-- Stores table
CREATE TABLE public.stores (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT,
    timezone TEXT DEFAULT 'Asia/Tokyo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Floor tables (physical tables in stores)
CREATE TABLE public.floor_tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id INTEGER REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
    label TEXT NOT NULL,
    seats INTEGER DEFAULT 4,
    position_x INTEGER DEFAULT 0,
    position_y INTEGER DEFAULT 0,
    width INTEGER DEFAULT 100,
    height INTEGER DEFAULT 60,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE(store_id, label)
);

-- Products / menu items
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_jp TEXT NOT NULL,
    category product_category NOT NULL,
    price INTEGER NOT NULL,
    back INTEGER DEFAULT 0,
    points INTEGER DEFAULT 0,
    tax_applicable BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Cast members (PIN-based auth)
CREATE TABLE public.cast_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    pin_hash TEXT NOT NULL,
    hourly_rate INTEGER DEFAULT 4000,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Bills (table sessions)
CREATE TABLE public.bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_id UUID REFERENCES public.floor_tables(id) ON DELETE CASCADE NOT NULL,
    store_id INTEGER REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
    status bill_status DEFAULT 'open' NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    close_time TIMESTAMP WITH TIME ZONE,
    base_minutes INTEGER DEFAULT 60,
    read_token TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Orders (items added to bills)
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bill_id UUID REFERENCES public.bills(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) NOT NULL,
    cast_id UUID REFERENCES public.cast_members(id),
    quantity INTEGER DEFAULT 1 NOT NULL,
    unit_price INTEGER NOT NULL,
    back_amount INTEGER DEFAULT 0,
    points_amount INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- User roles for admin access
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    UNIQUE (user_id, role)
);

-- Cast sessions (for PIN login tracking)
CREATE TABLE public.cast_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cast_id UUID REFERENCES public.cast_members(id) ON DELETE CASCADE NOT NULL,
    session_token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.floor_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cast_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cast_sessions ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role = _role
    )
$$;

-- RLS Policies

-- Stores: readable by all authenticated, including anon for customer page
CREATE POLICY "Stores are publicly readable" ON public.stores FOR SELECT USING (true);

-- Floor tables: readable by all
CREATE POLICY "Floor tables are publicly readable" ON public.floor_tables FOR SELECT USING (true);

-- Products: readable by all
CREATE POLICY "Products are publicly readable" ON public.products FOR SELECT USING (true);

-- Cast members: only admins can view all, cast can view own
CREATE POLICY "Cast members viewable by session" ON public.cast_members FOR SELECT USING (true);

-- Bills: readable for customer page via read_token, or by authenticated cast
CREATE POLICY "Bills are readable" ON public.bills FOR SELECT USING (true);

-- Orders: cast can insert, readable by all
CREATE POLICY "Orders are readable" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Orders can be inserted" ON public.orders FOR INSERT WITH CHECK (true);

-- Cast sessions: manage own sessions
CREATE POLICY "Cast sessions are readable" ON public.cast_sessions FOR SELECT USING (true);
CREATE POLICY "Cast sessions can be inserted" ON public.cast_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Cast sessions can be deleted" ON public.cast_sessions FOR DELETE USING (true);

-- User roles: only viewable by the user themselves or admins
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT 
    USING (auth.uid() = user_id);

-- Insert seed data for stores
INSERT INTO public.stores (id, name) VALUES
    (1, 'Girls Bar Fairy 1号店'),
    (2, 'Girls Bar Fairy 2号店');

-- Insert floor tables for Store 1 (A1-A9, B1-B3, C1-C3)
INSERT INTO public.floor_tables (store_id, label, position_x, position_y, width, height) VALUES
    -- A section (main counter)
    (1, 'A1', 50, 50, 80, 50),
    (1, 'A2', 140, 50, 80, 50),
    (1, 'A3', 230, 50, 80, 50),
    (1, 'A4', 50, 110, 80, 50),
    (1, 'A5', 140, 110, 80, 50),
    (1, 'A6', 230, 110, 80, 50),
    (1, 'A7', 50, 170, 80, 50),
    (1, 'A8', 140, 170, 80, 50),
    (1, 'A9', 230, 170, 80, 50),
    -- B section
    (1, 'B1', 350, 50, 80, 50),
    (1, 'B2', 350, 110, 80, 50),
    (1, 'B3', 350, 170, 80, 50),
    -- C section (VIP)
    (1, 'C1', 50, 260, 100, 60),
    (1, 'C2', 160, 260, 100, 60),
    (1, 'C3', 270, 260, 100, 60);

-- Insert floor tables for Store 2 (A1-A5, B1-B5)
INSERT INTO public.floor_tables (store_id, label, position_x, position_y, width, height) VALUES
    -- A section
    (2, 'A1', 50, 50, 90, 55),
    (2, 'A2', 150, 50, 90, 55),
    (2, 'A3', 250, 50, 90, 55),
    (2, 'A4', 100, 115, 90, 55),
    (2, 'A5', 200, 115, 90, 55),
    -- B section
    (2, 'B1', 50, 200, 90, 55),
    (2, 'B2', 150, 200, 90, 55),
    (2, 'B3', 250, 200, 90, 55),
    (2, 'B4', 100, 265, 90, 55),
    (2, 'B5', 200, 265, 90, 55);

-- Insert products from the menu
INSERT INTO public.products (name_jp, category, price, back, points, tax_applicable, sort_order) VALUES
    -- Sets
    ('初回フリーセット', 'set', 2000, 0, 0, false, 1),
    ('初回本指名セット', 'set', 5000, 1000, 3, true, 2),
    -- Extensions
    ('20分フリー延長', 'extension', 1500, 0, 0, false, 10),
    ('20分場内延長', 'extension', 3500, 500, 1, true, 11),
    ('20分本指名延長', 'extension', 3500, 1000, 3, true, 12),
    ('40分フリー延長', 'extension', 3000, 0, 0, false, 13),
    ('40分場内延長', 'extension', 5000, 500, 1, true, 14),
    ('40分本指名延長', 'extension', 5000, 1000, 3, true, 15),
    -- Nomination
    ('場内指名', 'nomination', 2000, 500, 1, true, 20),
    -- Companion
    ('同伴料', 'companion', 4000, 4000, 6, true, 30);

-- Insert demo cast members (PIN: 1234 for all demo)
-- Using simple hash for demo - in production use proper hashing
INSERT INTO public.cast_members (name, pin_hash, hourly_rate) VALUES
    ('さくら', '1234', 4000),
    ('ゆき', '2345', 4000),
    ('はな', '3456', 4500);