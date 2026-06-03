-- Migration 011: Teacher Authentication (Simplified)
-- Teachers ARE users - no separate users table
-- Each teacher can login with email/password

-- ===== ADD AUTH FIELDS TO TEACHERS TABLE =====
ALTER TABLE public.teachers
ADD COLUMN IF NOT EXISTS email TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS password_hash TEXT,
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user')),
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE;

-- Create index for email lookups
CREATE INDEX IF NOT EXISTS teachers_email_idx ON public.teachers(email);

-- ===== SESSIONS TABLE =====
CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS sessions_teacher_id_idx ON public.sessions(teacher_id);
CREATE INDEX IF NOT EXISTS sessions_token_idx ON public.sessions(token);
CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON public.sessions(expires_at);

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
-- Teachers can see all teachers in same business (for switching)
DROP POLICY IF EXISTS "teachers_read_same_business" ON public.teachers;
CREATE POLICY "teachers_read_same_business"
  ON public.teachers
  FOR SELECT
  TO anon, authenticated
  USING (business_id = (current_setting('request.headers')::json->>'x-business-id')::uuid);

-- Only admins can modify other teachers
DROP POLICY IF EXISTS "teachers_admin_all" ON public.teachers;
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
DROP POLICY IF EXISTS "teachers_service_all" ON public.teachers;
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
  -- Set email based on phone or generate one
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
