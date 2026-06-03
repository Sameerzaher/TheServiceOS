-- Migration: Messaging & Reminders
-- מערכת תזכורות והודעות

-- Create message_logs table
create table if not exists public.message_logs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  appointment_id uuid references public.appointments(id) on delete set null,
  client_id uuid references public.clients(id) on delete set null,
  phone_number text not null,
  message_type text not null check (message_type in ('sms', 'whatsapp')),
  message_purpose text not null check (message_purpose in ('appointment_reminder', 'payment_reminder', 'custom')),
  message_content text not null,
  status text not null check (status in ('pending', 'sent', 'failed', 'delivered', 'read')) default 'pending',
  provider text,
  provider_message_id text,
  error_message text,
  sent_at timestamptz,
  delivered_at timestamptz,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create reminder_settings table
create table if not exists public.reminder_settings (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.teachers(id) on delete cascade unique,
  
  -- Enable/disable reminders
  reminders_enabled boolean not null default true,
  
  -- Reminder timing (hours before appointment)
  reminder_24h_enabled boolean not null default true,
  reminder_24h_type text not null default 'whatsapp' check (reminder_24h_type in ('sms', 'whatsapp')),
  
  reminder_2h_enabled boolean not null default false,
  reminder_2h_type text not null default 'whatsapp' check (reminder_2h_type in ('sms', 'whatsapp')),
  
  reminder_1h_enabled boolean not null default false,
  reminder_1h_type text not null default 'sms' check (reminder_1h_type in ('sms', 'whatsapp')),
  
  -- Payment reminders
  payment_reminder_enabled boolean not null default true,
  payment_reminder_days_after integer not null default 3,
  payment_reminder_type text not null default 'whatsapp' check (payment_reminder_type in ('sms', 'whatsapp')),
  
  -- Custom templates
  appointment_reminder_template text,
  payment_reminder_template text,
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Add indexes for performance
create index if not exists message_logs_business_id_idx on public.message_logs(business_id);
create index if not exists message_logs_appointment_id_idx on public.message_logs(appointment_id);
create index if not exists message_logs_client_id_idx on public.message_logs(client_id);
create index if not exists message_logs_status_idx on public.message_logs(status);
create index if not exists message_logs_sent_at_idx on public.message_logs(sent_at);
create index if not exists message_logs_created_at_idx on public.message_logs(created_at);

-- Add RLS policies
alter table public.message_logs enable row level security;
alter table public.reminder_settings enable row level security;

-- Users can view their own messages
create policy "Users can view own message logs"
  on public.message_logs
  for select
  using (auth.uid()::text in (
    select t.id::text from public.teachers t where t.business_id = message_logs.business_id
  ));

-- Users can insert message logs
create policy "Users can insert message logs"
  on public.message_logs
  for insert
  with check (auth.uid()::text in (
    select t.id::text from public.teachers t where t.business_id = message_logs.business_id
  ));

-- Users can manage their own reminder settings
create policy "Users can manage own reminder settings"
  on public.reminder_settings
  for all
  using (auth.uid()::text = teacher_id::text);

-- Function to update updated_at timestamp
create or replace function public.update_message_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Trigger for message_logs
drop trigger if exists update_message_logs_updated_at on public.message_logs;
create trigger update_message_logs_updated_at
  before update on public.message_logs
  for each row
  execute function public.update_message_updated_at();

-- Trigger for reminder_settings
drop trigger if exists update_reminder_settings_updated_at on public.reminder_settings;
create trigger update_reminder_settings_updated_at
  before update on public.reminder_settings
  for each row
  execute function public.update_message_updated_at();

-- Comments
comment on table public.message_logs is 'לוג של כל ההודעות שנשלחו (SMS/WhatsApp)';
comment on table public.reminder_settings is 'הגדרות תזכורות לכל מורה';
comment on column public.message_logs.message_type is 'סוג ההודעה: sms או whatsapp';
comment on column public.message_logs.message_purpose is 'מטרת ההודעה';
comment on column public.message_logs.status is 'סטטוס ההודעה';
comment on column public.reminder_settings.reminder_24h_enabled is 'תזכורת 24 שעות לפני';
comment on column public.reminder_settings.reminder_2h_enabled is 'תזכורת 2 שעות לפני';
comment on column public.reminder_settings.reminder_1h_enabled is 'תזכורת שעה לפני';
