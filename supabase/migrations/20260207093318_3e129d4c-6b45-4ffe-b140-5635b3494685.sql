-- =====================================================
-- STAFF DASHBOARD DATABASE SCHEMA & POLICIES
-- =====================================================

-- 1. Create staff_members table for staff authentication
CREATE TABLE public.staff_members (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  pin_hash text NOT NULL,
  role text NOT NULL DEFAULT 'staff', -- 'staff' or 'admin'
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on staff_members
ALTER TABLE public.staff_members ENABLE ROW LEVEL SECURITY;

-- Staff members are readable (for login)
CREATE POLICY "Staff members are readable"
ON public.staff_members FOR SELECT
USING (true);

-- 2. Create staff_sessions table
CREATE TABLE public.staff_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id uuid NOT NULL REFERENCES public.staff_members(id),
  session_token text NOT NULL UNIQUE,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on staff_sessions
ALTER TABLE public.staff_sessions ENABLE ROW LEVEL SECURITY;

-- Staff sessions are readable
CREATE POLICY "Staff sessions are readable"
ON public.staff_sessions FOR SELECT
USING (true);

-- Staff sessions can be created
CREATE POLICY "Staff sessions can be created"
ON public.staff_sessions FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM staff_members sm 
  WHERE sm.id = staff_sessions.staff_id AND sm.is_active = true
));

-- Staff sessions can be deleted (logout)
CREATE POLICY "Staff sessions can be deleted"
ON public.staff_sessions FOR DELETE
USING (expires_at IS NOT NULL);

-- 3. Create helper function to check valid staff session
CREATE OR REPLACE FUNCTION public.has_valid_staff_session()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.staff_sessions
    WHERE expires_at > now()
  )
$$;

-- 4. Add price_adjustments table for order modifications
CREATE TABLE public.price_adjustments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  bill_id uuid REFERENCES public.bills(id) ON DELETE CASCADE,
  staff_id uuid REFERENCES public.staff_members(id),
  adjustment_type text NOT NULL, -- 'discount', 'cancel', 'price_change', 'custom'
  original_amount integer NOT NULL,
  adjusted_amount integer NOT NULL,
  reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on price_adjustments
ALTER TABLE public.price_adjustments ENABLE ROW LEVEL SECURITY;

-- Price adjustments are readable
CREATE POLICY "Price adjustments are readable"
ON public.price_adjustments FOR SELECT
USING (true);

-- Staff can create price adjustments
CREATE POLICY "Staff can create price adjustments"
ON public.price_adjustments FOR INSERT
WITH CHECK (public.has_valid_staff_session());

-- 5. Add cast_table_assignments for tracking which cast is at which table
CREATE TABLE public.cast_table_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bill_id uuid NOT NULL REFERENCES public.bills(id) ON DELETE CASCADE,
  cast_id uuid NOT NULL REFERENCES public.cast_members(id),
  assigned_at timestamp with time zone NOT NULL DEFAULT now(),
  removed_at timestamp with time zone,
  is_active boolean DEFAULT true
);

-- Enable RLS on cast_table_assignments
ALTER TABLE public.cast_table_assignments ENABLE ROW LEVEL SECURITY;

-- Cast assignments are readable
CREATE POLICY "Cast assignments are readable"
ON public.cast_table_assignments FOR SELECT
USING (true);

-- Staff can manage cast assignments
CREATE POLICY "Staff can insert cast assignments"
ON public.cast_table_assignments FOR INSERT
WITH CHECK (public.has_valid_staff_session());

CREATE POLICY "Staff can update cast assignments"
ON public.cast_table_assignments FOR UPDATE
USING (public.has_valid_staff_session());

-- 6. Update bills table policies for staff operations
-- Drop existing policies if they exist and recreate
DROP POLICY IF EXISTS "Bills are readable" ON public.bills;

CREATE POLICY "Bills are readable"
ON public.bills FOR SELECT
USING (true);

CREATE POLICY "Staff can create bills"
ON public.bills FOR INSERT
WITH CHECK (public.has_valid_staff_session());

CREATE POLICY "Staff can update bills"
ON public.bills FOR UPDATE
USING (public.has_valid_staff_session());

-- 7. Update orders table policies for staff operations
CREATE POLICY "Staff can update orders"
ON public.orders FOR UPDATE
USING (public.has_valid_staff_session());

CREATE POLICY "Staff can delete orders"
ON public.orders FOR DELETE
USING (public.has_valid_staff_session());

-- 8. Add seating_type to bills for tracking Free/Designated/In-house
ALTER TABLE public.bills 
ADD COLUMN IF NOT EXISTS seating_type text DEFAULT 'free',
ADD COLUMN IF NOT EXISTS closed_by uuid REFERENCES public.staff_members(id),
ADD COLUMN IF NOT EXISTS notes text;

-- 9. Add is_cancelled column to orders for soft delete
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS is_cancelled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS cancelled_by uuid REFERENCES public.staff_members(id),
ADD COLUMN IF NOT EXISTS cancelled_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS cancel_reason text;

-- 10. Insert demo staff member (PIN: 0000)
INSERT INTO public.staff_members (name, pin_hash, role)
VALUES ('管理者', '0000', 'admin')
ON CONFLICT DO NOTHING;

-- 11. Enable realtime for staff-relevant tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.cast_table_assignments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.price_adjustments;