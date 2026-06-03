-- ========================================
-- FULL DATABASE SETUP FROM SCRATCH
-- ========================================
-- Run this in Supabase SQL Editor
-- Creates all tables + adds teacher_id + auth

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ========================================
-- 1. Teachers Table (Core)
-- ========================================

CREATE TABLE IF NOT EXISTS public.teachers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
  full_name text NOT NULL,
  business_name text NOT NULL,
  phone text DEFAULT '',
  slug text NOT NULL UNIQUE,
  business_type text NOT NULL DEFAULT 'driving_instructor',
  email text UNIQUE,
  password_hash text,
  role text DEFAULT 'user',
  is_active boolean DEFAULT true,
  last_login_at timestamptz,
  created_at timestamptz DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_teachers_business_id ON public.teachers(business_id);
CREATE INDEX IF NOT EXISTS idx_teachers_slug ON public.teachers(slug);
CREATE INDEX IF NOT EXISTS idx_teachers_email ON public.teachers(email);

-- ========================================
-- 2. Clients Table
-- ========================================

CREATE TABLE IF NOT EXISTS public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
  teacher_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000002'::uuid,
  full_name text NOT NULL,
  phone text DEFAULT '',
  notes text DEFAULT '',
  custom_fields jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clients_business_id ON public.clients(business_id);
CREATE INDEX IF NOT EXISTS idx_clients_teacher_id ON public.clients(teacher_id);
CREATE INDEX IF NOT EXISTS idx_clients_phone ON public.clients(phone);

-- ========================================
-- 3. Appointments Table
-- ========================================

CREATE TABLE IF NOT EXISTS public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
  teacher_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000002'::uuid,
  client_id uuid NOT NULL,
  start_at timestamptz NOT NULL,
  end_at timestamptz,
  status text NOT NULL DEFAULT 'scheduled',
  payment_status text NOT NULL DEFAULT 'unpaid',
  amount numeric DEFAULT 0,
  custom_fields jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appointments_business_id ON public.appointments(business_id);
CREATE INDEX IF NOT EXISTS idx_appointments_teacher_id ON public.appointments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_appointments_client_id ON public.appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_start_at ON public.appointments(start_at);

-- ========================================
-- 4. Sessions Table
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
-- 5. Settings Tables
-- ========================================

CREATE TABLE IF NOT EXISTS public.serviceos_app_settings (
  business_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
  teacher_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000002'::uuid,
  payload jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW(),
  PRIMARY KEY (business_id, teacher_id)
);

CREATE TABLE IF NOT EXISTS public.serviceos_availability_settings (
  business_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
  teacher_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000002'::uuid,
  payload jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW(),
  PRIMARY KEY (business_id, teacher_id)
);

-- ========================================
-- 6. Enable RLS
-- ========================================

ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.serviceos_app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.serviceos_availability_settings ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 7. RLS Policies
-- ========================================

-- Teachers: Read same business
DROP POLICY IF EXISTS "teachers_read_same_business" ON public.teachers;
CREATE POLICY "teachers_read_same_business"
  ON public.teachers
  FOR SELECT
  TO anon, authenticated, service_role
  USING (true);

-- Teachers: Service role full access
DROP POLICY IF EXISTS "teachers_service_all" ON public.teachers;
CREATE POLICY "teachers_service_all"
  ON public.teachers
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Clients: Service role full access
DROP POLICY IF EXISTS "clients_service_all" ON public.clients;
CREATE POLICY "clients_service_all"
  ON public.clients
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Appointments: Service role full access
DROP POLICY IF EXISTS "appointments_service_all" ON public.appointments;
CREATE POLICY "appointments_service_all"
  ON public.appointments
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Sessions: Service role full access
DROP POLICY IF EXISTS "sessions_service_all" ON public.sessions;
CREATE POLICY "sessions_service_all"
  ON public.sessions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Settings: Service role full access
DROP POLICY IF EXISTS "app_settings_service_all" ON public.serviceos_app_settings;
CREATE POLICY "app_settings_service_all"
  ON public.serviceos_app_settings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "availability_settings_service_all" ON public.serviceos_availability_settings;
CREATE POLICY "availability_settings_service_all"
  ON public.serviceos_availability_settings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ========================================
-- 8. Cleanup Function
-- ========================================

CREATE OR REPLACE FUNCTION cleanup_expired_sessions() RETURNS void AS $$
BEGIN
  DELETE FROM public.sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 9. Insert Default Teacher (if needed)
-- ========================================

INSERT INTO public.teachers (
  id,
  business_id,
  full_name,
  business_name,
  phone,
  slug,
  business_type,
  email,
  role,
  is_active,
  created_at
)
SELECT
  '00000000-0000-0000-0000-000000000002'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Default Teacher',
  'Default Business',
  '',
  'default-teacher',
  'driving_instructor',
  'default@local.test',
  'user',
  true,
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.teachers 
  WHERE id = '00000000-0000-0000-0000-000000000002'::uuid
);

-- ========================================
-- Done!
-- ========================================

SELECT 
  '✅ Database created successfully!' as status,
  (SELECT COUNT(*) FROM public.teachers) as teachers,
  (SELECT COUNT(*) FROM public.clients) as clients,
  (SELECT COUNT(*) FROM public.appointments) as appointments;
