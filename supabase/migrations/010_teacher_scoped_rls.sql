-- Migration 010: Teacher-scoped RLS policies (security hardening)
-- Replaces permissive policies with proper teacher-scoped access control

-- ===== TEACHERS TABLE =====
-- Only allow reading teachers from the same business_id
DROP POLICY IF EXISTS "serviceos_mvp_teachers" ON public.teachers;
DROP POLICY IF EXISTS "teachers_anon_permissive" ON public.teachers;

CREATE POLICY "teachers_read_same_business"
  ON public.teachers
  FOR SELECT
  TO anon, authenticated
  USING (business_id = current_setting('request.headers')::json->>'x-business-id')::uuid);

-- Server-side admin operations (service role) are unrestricted
CREATE POLICY "teachers_admin_all"
  ON public.teachers
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ===== CLIENTS TABLE =====
DROP POLICY IF EXISTS "serviceos_mvp_clients" ON public.clients;
DROP POLICY IF EXISTS "clients_anon_permissive" ON public.clients;

CREATE POLICY "clients_teacher_scope"
  ON public.clients
  FOR ALL
  TO anon, authenticated
  USING (
    business_id = (current_setting('request.headers')::json->>'x-business-id')::uuid
    AND teacher_id = (current_setting('request.headers')::json->>'x-teacher-id')::uuid
  )
  WITH CHECK (
    business_id = (current_setting('request.headers')::json->>'x-business-id')::uuid
    AND teacher_id = (current_setting('request.headers')::json->>'x-teacher-id')::uuid
  );

CREATE POLICY "clients_admin_all"
  ON public.clients
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ===== APPOINTMENTS TABLE =====
DROP POLICY IF EXISTS "serviceos_mvp_appointments" ON public.appointments;
DROP POLICY IF EXISTS "appointments_anon_permissive" ON public.appointments;

CREATE POLICY "appointments_teacher_scope"
  ON public.appointments
  FOR ALL
  TO anon, authenticated
  USING (
    business_id = (current_setting('request.headers')::json->>'x-business-id')::uuid
    AND teacher_id = (current_setting('request.headers')::json->>'x-teacher-id')::uuid
  )
  WITH CHECK (
    business_id = (current_setting('request.headers')::json->>'x-business-id')::uuid
    AND teacher_id = (current_setting('request.headers')::json->>'x-teacher-id')::uuid
  );

CREATE POLICY "appointments_admin_all"
  ON public.appointments
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ===== SETTINGS TABLES =====
DROP POLICY IF EXISTS "serviceos_mvp_app_settings" ON public.serviceos_app_settings;
DROP POLICY IF EXISTS "app_settings_anon_permissive" ON public.serviceos_app_settings;

CREATE POLICY "app_settings_teacher_scope"
  ON public.serviceos_app_settings
  FOR ALL
  TO anon, authenticated
  USING (
    business_id = (current_setting('request.headers')::json->>'x-business-id')::uuid
    AND teacher_id = (current_setting('request.headers')::json->>'x-teacher-id')::uuid
  )
  WITH CHECK (
    business_id = (current_setting('request.headers')::json->>'x-business-id')::uuid
    AND teacher_id = (current_setting('request.headers')::json->>'x-teacher-id')::uuid
  );

CREATE POLICY "app_settings_admin_all"
  ON public.serviceos_app_settings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "serviceos_mvp_availability_settings" ON public.serviceos_availability_settings;
DROP POLICY IF EXISTS "availability_settings_anon_permissive" ON public.serviceos_availability_settings;

CREATE POLICY "availability_settings_teacher_scope"
  ON public.serviceos_availability_settings
  FOR ALL
  TO anon, authenticated
  USING (
    business_id = (current_setting('request.headers')::json->>'x-business-id')::uuid
    AND teacher_id = (current_setting('request.headers')::json->>'x-teacher-id')::uuid
  )
  WITH CHECK (
    business_id = (current_setting('request.headers')::json->>'x-business-id')::uuid
    AND teacher_id = (current_setting('request.headers')::json->>'x-teacher-id')::uuid
  );

CREATE POLICY "availability_settings_admin_all"
  ON public.serviceos_availability_settings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ===== BOOKING_SETTINGS TABLE (if exists) =====
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'booking_settings'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "serviceos_mvp_booking_settings" ON public.booking_settings';
    EXECUTE 'DROP POLICY IF EXISTS "booking_settings_anon_permissive" ON public.booking_settings';
    
    EXECUTE '
      CREATE POLICY "booking_settings_teacher_scope"
        ON public.booking_settings
        FOR ALL
        TO anon, authenticated
        USING (
          business_id = (current_setting(''request.headers'')::json->>''x-business-id'')::uuid
          AND teacher_id = (current_setting(''request.headers'')::json->>''x-teacher-id'')::uuid
        )
        WITH CHECK (
          business_id = (current_setting(''request.headers'')::json->>''x-business-id'')::uuid
          AND teacher_id = (current_setting(''request.headers'')::json->>''x-teacher-id'')::uuid
        )';
    
    EXECUTE '
      CREATE POLICY "booking_settings_admin_all"
        ON public.booking_settings
        FOR ALL
        TO service_role
        USING (true)
        WITH CHECK (true)';
  END IF;
END $$;
