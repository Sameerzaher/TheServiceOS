-- ========================================
-- COMPLETE SCHEMA FIX: Add teacher_id + Auth
-- ========================================
-- Run this in Supabase SQL Editor
-- Safe to run multiple times (idempotent)

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ========================================
-- Step 1: Add teacher_id to all tables
-- ========================================

-- Clients
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS teacher_id uuid;

UPDATE public.clients
SET teacher_id = '00000000-0000-0000-0000-000000000002'::uuid
WHERE teacher_id IS NULL;

ALTER TABLE public.clients
  ALTER COLUMN teacher_id SET DEFAULT '00000000-0000-0000-0000-000000000002'::uuid;

ALTER TABLE public.clients
  ALTER COLUMN teacher_id SET NOT NULL;

-- Appointments
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS teacher_id uuid;

UPDATE public.appointments
SET teacher_id = '00000000-0000-0000-0000-000000000002'::uuid
WHERE teacher_id IS NULL;

ALTER TABLE public.appointments
  ALTER COLUMN teacher_id SET DEFAULT '00000000-0000-0000-0000-000000000002'::uuid;

ALTER TABLE public.appointments
  ALTER COLUMN teacher_id SET NOT NULL;

-- ServiceOS App Settings
ALTER TABLE public.serviceos_app_settings
  ADD COLUMN IF NOT EXISTS teacher_id uuid;

UPDATE public.serviceos_app_settings
SET teacher_id = '00000000-0000-0000-0000-000000000002'::uuid
WHERE teacher_id IS NULL;

ALTER TABLE public.serviceos_app_settings
  ALTER COLUMN teacher_id SET DEFAULT '00000000-0000-0000-0000-000000000002'::uuid;

ALTER TABLE public.serviceos_app_settings
  ALTER COLUMN teacher_id SET NOT NULL;

-- ServiceOS Availability Settings
ALTER TABLE public.serviceos_availability_settings
  ADD COLUMN IF NOT EXISTS teacher_id uuid;

UPDATE public.serviceos_availability_settings
SET teacher_id = '00000000-0000-0000-0000-000000000002'::uuid
WHERE teacher_id IS NULL;

ALTER TABLE public.serviceos_availability_settings
  ALTER COLUMN teacher_id SET DEFAULT '00000000-0000-0000-0000-000000000002'::uuid;

ALTER TABLE public.serviceos_availability_settings
  ALTER COLUMN teacher_id SET NOT NULL;

-- ========================================
-- Step 2: Add business_type to teachers
-- ========================================

ALTER TABLE public.teachers
  ADD COLUMN IF NOT EXISTS business_type text;

UPDATE public.teachers
SET business_type = 'driving_instructor'
WHERE business_type IS NULL OR TRIM(business_type) = '';

ALTER TABLE public.teachers
  ALTER COLUMN business_type SET DEFAULT 'driving_instructor';

ALTER TABLE public.teachers
  ALTER COLUMN business_type SET NOT NULL;

ALTER TABLE public.teachers DROP CONSTRAINT IF EXISTS teachers_business_type_check;

ALTER TABLE public.teachers
  ADD CONSTRAINT teachers_business_type_check
  CHECK (business_type IN ('driving_instructor', 'cosmetic_clinic'));

-- ========================================
-- Step 3: Add auth fields to teachers
-- ========================================

ALTER TABLE public.teachers
  ADD COLUMN IF NOT EXISTS email text;

ALTER TABLE public.teachers
  ADD COLUMN IF NOT EXISTS password_hash text;

ALTER TABLE public.teachers
  ADD COLUMN IF NOT EXISTS role text DEFAULT 'user';

ALTER TABLE public.teachers
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

ALTER TABLE public.teachers
  ADD COLUMN IF NOT EXISTS last_login_at timestamptz;

-- Set default emails for existing teachers
UPDATE public.teachers
SET email = COALESCE(
  NULLIF(email, ''),
  LOWER(REPLACE(full_name, ' ', '.')) || '@' || slug || '.local'
)
WHERE email IS NULL OR email = '';

-- Ensure role is set
UPDATE public.teachers
SET role = 'user'
WHERE role IS NULL OR role = '';

-- Ensure is_active is set
UPDATE public.teachers
SET is_active = true
WHERE is_active IS NULL;

-- Add unique constraint on email
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'teachers_email_key'
  ) THEN
    ALTER TABLE public.teachers
      ADD CONSTRAINT teachers_email_key UNIQUE (email);
  END IF;
END $$;

-- ========================================
-- Step 4: Create sessions table
-- ========================================

CREATE TABLE IF NOT EXISTS public.sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL,
  token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT NOW()
);

-- Index for fast session lookup
CREATE INDEX IF NOT EXISTS idx_sessions_token ON public.sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_teacher_id ON public.sessions(teacher_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON public.sessions(expires_at);

-- ========================================
-- Step 5: RLS Policies
-- ========================================

-- Enable RLS
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.serviceos_app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.serviceos_availability_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "teachers_read_same_business" ON public.teachers;
DROP POLICY IF EXISTS "teachers_admin_modify" ON public.teachers;
DROP POLICY IF EXISTS "teachers_service_all" ON public.teachers;

-- Teachers policies
CREATE POLICY "teachers_read_same_business"
  ON public.teachers
  FOR SELECT
  TO anon, authenticated
  USING (business_id = (current_setting('request.headers', true)::json->>'x-business-id')::uuid);

CREATE POLICY "teachers_service_all"
  ON public.teachers
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Sessions policies
DROP POLICY IF EXISTS "sessions_service_all" ON public.sessions;

CREATE POLICY "sessions_service_all"
  ON public.sessions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ========================================
-- Step 6: Cleanup function
-- ========================================

CREATE OR REPLACE FUNCTION cleanup_expired_sessions() RETURNS void AS $$
BEGIN
  DELETE FROM public.sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- Done!
-- ========================================

SELECT 
  '✅ Schema migration completed!' as status,
  (SELECT COUNT(*) FROM public.teachers) as teachers_count,
  (SELECT COUNT(*) FROM public.clients) as clients_count,
  (SELECT COUNT(*) FROM public.appointments) as appointments_count,
  (SELECT COUNT(*) FROM public.sessions) as sessions_count;
