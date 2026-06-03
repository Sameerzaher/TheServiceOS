-- Add reminder settings to availability_settings table
ALTER TABLE public.booking_settings 
ADD COLUMN IF NOT EXISTS enable_auto_reminders BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS reminder_24h_before BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS reminder_1h_before BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS reminder_custom_message TEXT;

-- Create reminders tracking table
CREATE TABLE IF NOT EXISTS public.appointment_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL,
  teacher_id UUID NOT NULL,
  appointment_id UUID NOT NULL,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('24h', '1h', 'custom')),
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT fk_appointment 
    FOREIGN KEY (appointment_id) 
    REFERENCES public.appointments(id) 
    ON DELETE CASCADE
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_reminders_teacher ON public.appointment_reminders(teacher_id);
CREATE INDEX IF NOT EXISTS idx_reminders_appointment ON public.appointment_reminders(appointment_id);
CREATE INDEX IF NOT EXISTS idx_reminders_scheduled ON public.appointment_reminders(scheduled_for) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_reminders_status ON public.appointment_reminders(status);

-- Enable RLS
ALTER TABLE public.appointment_reminders ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Teachers can view their own reminders
CREATE POLICY reminders_select_own ON public.appointment_reminders
  FOR SELECT
  USING (teacher_id = current_setting('app.current_teacher_id', true)::uuid);

-- RLS Policy: System can insert reminders
CREATE POLICY reminders_insert_system ON public.appointment_reminders
  FOR INSERT
  WITH CHECK (true);

-- RLS Policy: System can update reminders
CREATE POLICY reminders_update_system ON public.appointment_reminders
  FOR UPDATE
  USING (true);

COMMENT ON TABLE public.appointment_reminders IS 'Tracks automated WhatsApp reminders for appointments';
COMMENT ON COLUMN public.appointment_reminders.reminder_type IS '24h = 24 hours before, 1h = 1 hour before, custom = user-defined time';
COMMENT ON COLUMN public.appointment_reminders.status IS 'pending = waiting to send, sent = successfully sent, failed = send failed, cancelled = appointment cancelled';
