-- Allow 2h reminder type in appointment_reminders
ALTER TABLE public.appointment_reminders
  DROP CONSTRAINT IF EXISTS appointment_reminders_reminder_type_check;

ALTER TABLE public.appointment_reminders
  ADD CONSTRAINT appointment_reminders_reminder_type_check
  CHECK (reminder_type IN ('24h', '2h', '1h', 'custom'));
