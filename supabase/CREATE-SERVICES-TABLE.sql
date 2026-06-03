-- Legacy one-off script. Prefer applying `migrations/016_services.sql` (or `supabase db push`) so all envs stay in sync.
-- Create services/pricing table
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL,
  teacher_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL,
  duration_minutes INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_services_teacher ON public.services(teacher_id);
CREATE INDEX IF NOT EXISTS idx_services_active ON public.services(is_active);
CREATE INDEX IF NOT EXISTS idx_services_order ON public.services(teacher_id, display_order);

-- Enable RLS
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY services_select_own ON public.services
  FOR SELECT
  USING (teacher_id = current_setting('app.current_teacher_id', true)::uuid);

CREATE POLICY services_insert_own ON public.services
  FOR INSERT
  WITH CHECK (teacher_id = current_setting('app.current_teacher_id', true)::uuid);

CREATE POLICY services_update_own ON public.services
  FOR UPDATE
  USING (teacher_id = current_setting('app.current_teacher_id', true)::uuid);

CREATE POLICY services_delete_own ON public.services
  FOR DELETE
  USING (teacher_id = current_setting('app.current_teacher_id', true)::uuid);

-- Allow public read for active services (for public booking page)
CREATE POLICY services_select_public ON public.services
  FOR SELECT
  USING (is_active = true);

COMMENT ON TABLE public.services IS 'Different service types with custom pricing and duration';
COMMENT ON COLUMN public.services.display_order IS 'Order to display in public booking (lower = first)';
