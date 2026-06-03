-- ========================================
-- ADD teacher_id TO EXISTING TABLES
-- ========================================
-- Run this in Supabase SQL Editor
-- Based on your actual table names

-- ========================================
-- 1. Add teacher_id to clients
-- ========================================

ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS teacher_id uuid;

UPDATE public.clients
SET teacher_id = '00000000-0000-0000-0000-000000000002'::uuid
WHERE teacher_id IS NULL;

ALTER TABLE public.clients
  ALTER COLUMN teacher_id SET DEFAULT '00000000-0000-0000-0000-000000000002'::uuid;

ALTER TABLE public.clients
  ALTER COLUMN teacher_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_clients_teacher_id ON public.clients(teacher_id);

-- ========================================
-- 2. Add teacher_id to appointments
-- ========================================

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS teacher_id uuid;

UPDATE public.appointments
SET teacher_id = '00000000-0000-0000-0000-000000000002'::uuid
WHERE teacher_id IS NULL;

ALTER TABLE public.appointments
  ALTER COLUMN teacher_id SET DEFAULT '00000000-0000-0000-0000-000000000002'::uuid;

ALTER TABLE public.appointments
  ALTER COLUMN teacher_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_appointments_teacher_id ON public.appointments(teacher_id);

-- ========================================
-- 3. Add teacher_id to app_settings
-- ========================================

ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS teacher_id uuid;

UPDATE public.app_settings
SET teacher_id = '00000000-0000-0000-0000-000000000002'::uuid
WHERE teacher_id IS NULL;

ALTER TABLE public.app_settings
  ALTER COLUMN teacher_id SET DEFAULT '00000000-0000-0000-0000-000000000002'::uuid;

ALTER TABLE public.app_settings
  ALTER COLUMN teacher_id SET NOT NULL;

-- Fix primary key to include teacher_id
DO $$
DECLARE
  cname text;
  def text;
BEGIN
  SELECT con.conname, pg_get_constraintdef(con.oid)
    INTO cname, def
  FROM pg_constraint con
  WHERE con.conrelid = 'public.app_settings'::regclass
    AND con.contype = 'p'
  LIMIT 1;

  IF def IS NOT NULL AND position('teacher_id' IN def) > 0 THEN
    RETURN;
  END IF;

  IF cname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.app_settings DROP CONSTRAINT %I', cname);
  END IF;

  ALTER TABLE public.app_settings
    ADD PRIMARY KEY (business_id, teacher_id);
END $$;

-- ========================================
-- 4. Add teacher_id to booking_settings
-- ========================================

ALTER TABLE public.booking_settings
  ADD COLUMN IF NOT EXISTS teacher_id uuid;

UPDATE public.booking_settings
SET teacher_id = '00000000-0000-0000-0000-000000000002'::uuid
WHERE teacher_id IS NULL;

ALTER TABLE public.booking_settings
  ALTER COLUMN teacher_id SET DEFAULT '00000000-0000-0000-0000-000000000002'::uuid;

ALTER TABLE public.booking_settings
  ALTER COLUMN teacher_id SET NOT NULL;

-- Fix primary key to include teacher_id
DO $$
DECLARE
  cname text;
  def text;
BEGIN
  SELECT con.conname, pg_get_constraintdef(con.oid)
    INTO cname, def
  FROM pg_constraint con
  WHERE con.conrelid = 'public.booking_settings'::regclass
    AND con.contype = 'p'
  LIMIT 1;

  IF def IS NOT NULL AND position('teacher_id' IN def) > 0 THEN
    RETURN;
  END IF;

  IF cname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.booking_settings DROP CONSTRAINT %I', cname);
  END IF;

  ALTER TABLE public.booking_settings
    ADD PRIMARY KEY (business_id, teacher_id);
END $$;

-- ========================================
-- 5. Add business_type to teachers
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

-- ========================================
-- 6. Add auth fields to teachers
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

-- Add unique constraint on email (if not exists)
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
-- 7. Ensure sessions table exists
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

CREATE INDEX IF NOT EXISTS idx_sessions_token ON public.sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_teacher_id ON public.sessions(teacher_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON public.sessions(expires_at);

-- ========================================
-- 8. Enable RLS on sessions
-- ========================================

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sessions_service_all" ON public.sessions;
CREATE POLICY "sessions_service_all"
  ON public.sessions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ========================================
-- 9. Create cleanup function
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
  '✅ Migration completed!' as status,
  (SELECT COUNT(*) FROM public.teachers) as teachers,
  (SELECT COUNT(*) FROM public.clients) as clients,
  (SELECT COUNT(*) FROM public.appointments) as appointments,
  (SELECT COUNT(*) FROM public.sessions) as sessions;
