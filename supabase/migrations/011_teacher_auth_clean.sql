-- Migration 011: Teacher Authentication (Clean Version)
-- Run this AFTER dropping old sessions table if it exists

-- ===== DROP OLD TABLES IF EXIST =====
DROP TABLE IF EXISTS public.sessions CASCADE;
DROP TABLE IF EXISTS public.user_teachers CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- ===== ADD AUTH FIELDS TO TEACHERS TABLE =====
ALTER TABLE public.teachers
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS password_hash TEXT,
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user',
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE;

-- Drop existing constraint if exists and add new one
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'teachers_role_check') THEN
    ALTER TABLE public.teachers DROP CONSTRAINT teachers_role_check;
  END IF;
END $$;

ALTER TABLE public.teachers
ADD CONSTRAINT teachers_role_check CHECK (role IN ('admin', 'user'));

-- Make email unique if not already
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'teachers_email_key' 
    AND conrelid = 'public.teachers'::regclass
  ) THEN
    ALTER TABLE public.teachers ADD CONSTRAINT teachers_email_key UNIQUE (email);
  END IF;
END $$;

-- Create index for email lookups
CREATE INDEX IF NOT EXISTS teachers_email_idx ON public.teachers(email);

-- ===== CREATE SESSIONS TABLE =====
CREATE TABLE public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT
);

CREATE INDEX sessions_teacher_id_idx ON public.sessions(teacher_id);
CREATE INDEX sessions_token_idx ON public.sessions(token);
CREATE INDEX sessions_expires_at_idx ON public.sessions(expires_at);

-- Enable RLS
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- ===== RLS POLICIES FOR SESSIONS =====
DROP POLICY IF EXISTS "sessions_own_only" ON public.sessions;
CREATE POLICY "sessions_own_only"
  ON public.sessions
  FOR ALL
  TO authenticated
  USING (teacher_id = (current_setting('request.headers')::json->>'x-teacher-id')::uuid);

DROP POLICY IF EXISTS "sessions_service_role" ON public.sessions;
CREATE POLICY "sessions_service_role"
  ON public.sessions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ===== UPDATE TEACHERS RLS =====
-- Drop old policies
DROP POLICY IF EXISTS "teachers_read_same_business" ON public.teachers;
DROP POLICY IF EXISTS "teachers_admin_all" ON public.teachers;
DROP POLICY IF EXISTS "teachers_admin_modify" ON public.teachers;
DROP POLICY IF EXISTS "teachers_service_all" ON public.teachers;

-- Teachers can see all teachers in same business (for switching)
CREATE POLICY "teachers_read_same_business"
  ON public.teachers
  FOR SELECT
  TO anon, authenticated
  USING (business_id = (current_setting('request.headers')::json->>'x-business-id')::uuid);

-- Only admins can modify other teachers
CREATE POLICY "teachers_admin_modify"
  ON public.teachers
  FOR ALL
  TO authenticated
  USING (
    business_id = (current_setting('request.headers')::json->>'x-business-id')::uuid
    AND (
      -- Can modify self
      id = (current_setting('request.headers')::json->>'x-teacher-id')::uuid
      OR
      -- Or is admin
      EXISTS (
        SELECT 1 FROM public.teachers t
        WHERE t.id = (current_setting('request.headers')::json->>'x-teacher-id')::uuid
        AND t.role = 'admin'
      )
    )
  );

-- Service role unrestricted
CREATE POLICY "teachers_service_all"
  ON public.teachers
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ===== FUNCTIONS =====
-- Cleanup expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions() RETURNS void AS $$
BEGIN
  DELETE FROM public.sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update existing teachers to have email if missing
DO $$
BEGIN
  UPDATE public.teachers
  SET email = COALESCE(
    NULLIF(email, ''),
    LOWER(REPLACE(full_name, ' ', '.')) || '@' || slug || '.local'
  )
  WHERE email IS NULL OR email = '';
END $$;

-- ===== COMMENTS =====
COMMENT ON COLUMN public.teachers.email IS 'Email for authentication (unique)';
COMMENT ON COLUMN public.teachers.password_hash IS 'PBKDF2 hashed password';
COMMENT ON COLUMN public.teachers.role IS 'admin can manage other teachers, user is regular';
COMMENT ON COLUMN public.teachers.is_active IS 'Inactive teachers cannot login';
COMMENT ON COLUMN public.teachers.last_login_at IS 'Last successful login timestamp';
COMMENT ON TABLE public.sessions IS 'Active teacher sessions for authentication';

-- Done!
SELECT 'Migration 011 completed successfully!' as status;
