-- Create blocked dates table for vacations/holidays
CREATE TABLE IF NOT EXISTS public.blocked_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL,
  teacher_id UUID NOT NULL,
  blocked_date DATE NOT NULL,
  reason TEXT,
  is_recurring BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(teacher_id, blocked_date)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_blocked_dates_teacher ON public.blocked_dates(teacher_id);
CREATE INDEX IF NOT EXISTS idx_blocked_dates_date ON public.blocked_dates(blocked_date);
CREATE INDEX IF NOT EXISTS idx_blocked_dates_teacher_date ON public.blocked_dates(teacher_id, blocked_date);

-- Enable RLS
ALTER TABLE public.blocked_dates ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Teachers can view their own blocked dates
CREATE POLICY blocked_dates_select_own ON public.blocked_dates
  FOR SELECT
  USING (teacher_id = current_setting('app.current_teacher_id', true)::uuid);

-- RLS Policy: Teachers can insert their own blocked dates
CREATE POLICY blocked_dates_insert_own ON public.blocked_dates
  FOR INSERT
  WITH CHECK (teacher_id = current_setting('app.current_teacher_id', true)::uuid);

-- RLS Policy: Teachers can update their own blocked dates
CREATE POLICY blocked_dates_update_own ON public.blocked_dates
  FOR UPDATE
  USING (teacher_id = current_setting('app.current_teacher_id', true)::uuid);

-- RLS Policy: Teachers can delete their own blocked dates
CREATE POLICY blocked_dates_delete_own ON public.blocked_dates
  FOR DELETE
  USING (teacher_id = current_setting('app.current_teacher_id', true)::uuid);

-- RLS Policy: System can read all (for public booking availability check)
CREATE POLICY blocked_dates_select_system ON public.blocked_dates
  FOR SELECT
  USING (true);

COMMENT ON TABLE public.blocked_dates IS 'Stores dates when teacher is unavailable (vacations, holidays, etc)';
COMMENT ON COLUMN public.blocked_dates.is_recurring IS 'If true, this block repeats annually (e.g., national holidays)';
