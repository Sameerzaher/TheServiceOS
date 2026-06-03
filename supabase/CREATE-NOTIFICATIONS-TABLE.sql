-- Create notifications table for new booking alerts
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL,
  teacher_id UUID NOT NULL,
  
  -- Notification type and content
  type VARCHAR(50) NOT NULL DEFAULT 'new_booking',
  title TEXT NOT NULL,
  message TEXT,
  
  -- Related entity (e.g. appointment_id for new bookings)
  entity_type VARCHAR(50),
  entity_id UUID,
  
  -- Notification state
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT notifications_type_check CHECK (type IN ('new_booking', 'booking_approved', 'booking_cancelled', 'payment_received', 'system'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_teacher ON public.notifications(teacher_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(teacher_id, is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_entity ON public.notifications(entity_type, entity_id);

-- RLS Policies
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Teachers can view their own notifications
CREATE POLICY notifications_select_own ON public.notifications
  FOR SELECT
  USING (
    teacher_id IN (
      SELECT id FROM public.teachers 
      WHERE email = current_setting('request.jwt.claim.email', true)
      AND is_active = true
    )
  );

-- Policy: System can insert notifications (admin client)
CREATE POLICY notifications_insert_system ON public.notifications
  FOR INSERT
  WITH CHECK (true);

-- Policy: Teachers can update their own notifications (mark as read)
CREATE POLICY notifications_update_own ON public.notifications
  FOR UPDATE
  USING (
    teacher_id IN (
      SELECT id FROM public.teachers 
      WHERE email = current_setting('request.jwt.claim.email', true)
      AND is_active = true
    )
  );

-- Policy: No one can delete notifications (keep for audit trail)
-- (You can add a soft-delete column if needed)
