-- ========================================
-- FIX: Update appointments constraints
-- ========================================
-- Run this in Supabase SQL Editor

-- Drop existing constraints
ALTER TABLE public.appointments 
  DROP CONSTRAINT IF EXISTS appointments_time_check;

ALTER TABLE public.appointments 
  DROP CONSTRAINT IF EXISTS appointments_status_check;

ALTER TABLE public.appointments 
  DROP CONSTRAINT IF EXISTS appointments_payment_status_check;

-- Add correct constraints with ALL valid values
ALTER TABLE public.appointments
  ADD CONSTRAINT appointments_status_check
  CHECK (status = ANY (ARRAY[
    'scheduled'::text, 
    'confirmed'::text, 
    'in_progress'::text, 
    'completed'::text, 
    'cancelled'::text, 
    'no_show'::text
  ]));

ALTER TABLE public.appointments
  ADD CONSTRAINT appointments_payment_status_check
  CHECK (payment_status = ANY (ARRAY[
    'unpaid'::text, 
    'pending'::text, 
    'partial'::text, 
    'paid'::text, 
    'refunded'::text, 
    'waived'::text
  ]));

-- Time check: end_at must be after start_at (if not NULL)
ALTER TABLE public.appointments
  ADD CONSTRAINT appointments_time_check
  CHECK ((end_at IS NULL) OR (end_at > start_at));

-- Verify new constraints
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(con.oid) as definition
FROM pg_constraint con
WHERE con.conrelid = 'public.appointments'::regclass
AND conname LIKE '%_check'
ORDER BY conname;
