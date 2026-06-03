-- Canonical availability + public booking toggle (replaces legacy JSON in serviceos_availability_settings for app code).

create table if not exists public.booking_settings (
  business_id uuid primary key,
  booking_enabled boolean not null default false,
  weekly_availability jsonb not null default '{}'::jsonb,
  slot_duration_minutes int not null default 45,
  days_ahead int not null default 30,
  updated_at timestamptz not null default now()
);

alter table public.booking_settings enable row level security;

drop policy if exists "serviceos_mvp_booking_settings" on public.booking_settings;

create policy "serviceos_mvp_booking_settings"
  on public.booking_settings
  for all
  to anon, authenticated
  using (business_id = '00000000-0000-0000-0000-000000000001'::uuid)
  with check (business_id = '00000000-0000-0000-0000-000000000001'::uuid);
