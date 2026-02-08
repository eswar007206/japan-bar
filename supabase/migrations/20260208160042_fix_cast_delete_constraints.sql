-- Fix foreign key constraints for cast_members deletion
-- Allow staff to delete cast members while preserving historical data

-- Drop and recreate foreign keys with appropriate ON DELETE behavior

-- 1. cast_sessions - CASCADE (sessions are meaningless without cast)
ALTER TABLE cast_sessions DROP CONSTRAINT IF EXISTS cast_sessions_cast_id_fkey;
ALTER TABLE cast_sessions
  ADD CONSTRAINT cast_sessions_cast_id_fkey
  FOREIGN KEY (cast_id) REFERENCES cast_members(id)
  ON DELETE CASCADE;

-- 2. cast_shifts - SET NULL (keep shift records for historical data)
ALTER TABLE cast_shifts DROP CONSTRAINT IF EXISTS cast_shifts_cast_id_fkey;
ALTER TABLE cast_shifts
  ADD CONSTRAINT cast_shifts_cast_id_fkey
  FOREIGN KEY (cast_id) REFERENCES cast_members(id)
  ON DELETE SET NULL;

-- 3. cast_table_assignments - SET NULL (keep assignment history)
ALTER TABLE cast_table_assignments DROP CONSTRAINT IF EXISTS cast_table_assignments_cast_id_fkey;
ALTER TABLE cast_table_assignments
  ADD CONSTRAINT cast_table_assignments_cast_id_fkey
  FOREIGN KEY (cast_id) REFERENCES cast_members(id)
  ON DELETE SET NULL;

-- 4. bill_designations - SET NULL (keep designation history)
ALTER TABLE bill_designations DROP CONSTRAINT IF EXISTS bill_designations_cast_id_fkey;
ALTER TABLE bill_designations
  ADD CONSTRAINT bill_designations_cast_id_fkey
  FOREIGN KEY (cast_id) REFERENCES cast_members(id)
  ON DELETE SET NULL;

-- 5. orders - SET NULL (keep order history, critical for financial records)
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_cast_id_fkey;
ALTER TABLE orders
  ADD CONSTRAINT orders_cast_id_fkey
  FOREIGN KEY (cast_id) REFERENCES cast_members(id)
  ON DELETE SET NULL;

-- 6. cast_daily_earnings - CASCADE (earnings meaningless without cast)
ALTER TABLE cast_daily_earnings DROP CONSTRAINT IF EXISTS cast_daily_earnings_cast_id_fkey;
ALTER TABLE cast_daily_earnings
  ADD CONSTRAINT cast_daily_earnings_cast_id_fkey
  FOREIGN KEY (cast_id) REFERENCES cast_members(id)
  ON DELETE CASCADE;

-- 7. cast_referrals - CASCADE (referral records meaningless without participants)
ALTER TABLE cast_referrals DROP CONSTRAINT IF EXISTS cast_referrals_referrer_id_fkey;
ALTER TABLE cast_referrals
  ADD CONSTRAINT cast_referrals_referrer_id_fkey
  FOREIGN KEY (referrer_id) REFERENCES cast_members(id)
  ON DELETE CASCADE;

ALTER TABLE cast_referrals DROP CONSTRAINT IF EXISTS cast_referrals_referred_id_fkey;
ALTER TABLE cast_referrals
  ADD CONSTRAINT cast_referrals_referred_id_fkey
  FOREIGN KEY (referred_id) REFERENCES cast_members(id)
  ON DELETE CASCADE;

-- 8. cast_members self-reference (referred_by) - SET NULL
ALTER TABLE cast_members DROP CONSTRAINT IF EXISTS cast_members_referred_by_fkey;
ALTER TABLE cast_members
  ADD CONSTRAINT cast_members_referred_by_fkey
  FOREIGN KEY (referred_by) REFERENCES cast_members(id)
  ON DELETE SET NULL;

-- Allow cast_id to be NULL in these tables for deleted cast members
ALTER TABLE cast_shifts ALTER COLUMN cast_id DROP NOT NULL;
ALTER TABLE cast_table_assignments ALTER COLUMN cast_id DROP NOT NULL;
ALTER TABLE bill_designations ALTER COLUMN cast_id DROP NOT NULL;
