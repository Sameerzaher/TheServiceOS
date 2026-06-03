-- Complete database setup for ServiceOS multi-tenant
-- Run this in Supabase SQL Editor
-- This is a convenience script that combines all necessary migrations

-- This script is equivalent to running migrations 004, 007, and 009 in order.
-- For production, use the individual migration files in order.

-- ===== STEP 1: Ensure teachers table exists =====
-- (Migration 004: teachers table)
-- Already exists from migration 004

-- ===== STEP 2: Add business_type column =====
-- (Migration 007: teacher_business_type)
ALTER TABLE public.teachers 
  ADD COLUMN IF NOT EXISTS business_type text 
  DEFAULT 'driving_instructor' 
  NOT NULL;

ALTER TABLE public.teachers 
  DROP CONSTRAINT IF EXISTS teachers_business_type_check;

ALTER TABLE public.teachers 
  ADD CONSTRAINT teachers_business_type_check 
  CHECK (business_type IN ('driving_instructor', 'cosmetic_clinic'));

-- Backfill existing rows
UPDATE public.teachers
SET business_type = 'driving_instructor'
WHERE business_type IS NULL OR trim(business_type) = '';

-- ===== STEP 3: Create demo teachers =====
-- (Migration 009: demo_teachers)

-- Sameer Driving (driving instructor)
INSERT INTO public.teachers (
  id,
  business_id,
  full_name,
  business_name,
  phone,
  slug,
  business_type,
  created_at
)
VALUES (
  '550e8400-e29b-41d4-a716-446655440201'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Sameer',
  'Sameer Driving',
  '050-1234567',
  'sameer-driving',
  'driving_instructor',
  now()
)
ON CONFLICT (id) DO UPDATE SET
  business_id = EXCLUDED.business_id,
  full_name = EXCLUDED.full_name,
  business_name = EXCLUDED.business_name,
  phone = EXCLUDED.phone,
  slug = EXCLUDED.slug,
  business_type = EXCLUDED.business_type;

-- Dr Avi Clinic (cosmetic clinic)
INSERT INTO public.teachers (
  id,
  business_id,
  full_name,
  business_name,
  phone,
  slug,
  business_type,
  created_at
)
VALUES (
  '550e8400-e29b-41d4-a716-446655440202'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Dr. Avi',
  'Dr Avi Clinic',
  '050-7654321',
  'dr-avi-clinic',
  'cosmetic_clinic',
  now()
)
ON CONFLICT (id) DO UPDATE SET
  business_id = EXCLUDED.business_id,
  full_name = EXCLUDED.full_name,
  business_name = EXCLUDED.business_name,
  phone = EXCLUDED.phone,
  slug = EXCLUDED.slug,
  business_type = EXCLUDED.business_type;

-- ===== STEP 4: Migrate existing data to Sameer Driving =====
DO $$
DECLARE
  v_old_teacher uuid := '00000000-0000-0000-0000-000000000002'::uuid;
  v_sameer uuid := '550e8400-e29b-41d4-a716-446655440201'::uuid;
  v_count int;
BEGIN
  -- Move clients
  UPDATE public.clients
  SET teacher_id = v_sameer
  WHERE teacher_id = v_old_teacher;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'Migrated % clients to Sameer Driving', v_count;

  -- Move appointments
  UPDATE public.appointments
  SET teacher_id = v_sameer
  WHERE teacher_id = v_old_teacher;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'Migrated % appointments to Sameer Driving', v_count;

  -- Move booking_settings
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'booking_settings'
  ) THEN
    UPDATE public.booking_settings
    SET teacher_id = v_sameer
    WHERE teacher_id = v_old_teacher;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Migrated % booking_settings to Sameer Driving', v_count;
  END IF;

  -- Move app_settings
  UPDATE public.serviceos_app_settings
  SET teacher_id = v_sameer
  WHERE teacher_id = v_old_teacher;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'Migrated % app_settings to Sameer Driving', v_count;

  -- Move availability_settings
  UPDATE public.serviceos_availability_settings
  SET teacher_id = v_sameer
  WHERE teacher_id = v_old_teacher;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'Migrated % availability_settings to Sameer Driving', v_count;

  RAISE NOTICE 'Migration complete!';
END $$;

-- ===== STEP 5: Verify =====
SELECT
  id,
  full_name,
  business_name,
  slug,
  business_type,
  phone
FROM public.teachers
ORDER BY created_at;
