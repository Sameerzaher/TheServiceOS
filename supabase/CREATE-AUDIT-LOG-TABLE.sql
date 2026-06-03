-- Create audit log table
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL,
  teacher_id UUID NOT NULL,
  actor_teacher_id UUID,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_log_teacher ON public.audit_log(teacher_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON public.audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON public.audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor ON public.audit_log(actor_teacher_id);

-- Enable RLS
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Teachers can view logs related to their data
CREATE POLICY audit_log_select_own ON public.audit_log
  FOR SELECT
  USING (teacher_id = current_setting('app.current_teacher_id', true)::uuid);

-- RLS Policy: System can insert audit logs
CREATE POLICY audit_log_insert_system ON public.audit_log
  FOR INSERT
  WITH CHECK (true);

COMMENT ON TABLE public.audit_log IS 'Tracks all data changes in the system for audit purposes';
COMMENT ON COLUMN public.audit_log.action IS 'Action performed: create, update, delete, etc';
COMMENT ON COLUMN public.audit_log.entity_type IS 'Type of entity: appointment, client, teacher, settings, etc';
COMMENT ON COLUMN public.audit_log.actor_teacher_id IS 'Teacher who performed the action (null = system)';
