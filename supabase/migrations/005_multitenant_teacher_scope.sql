-- Scope clients, appointments, and settings rows by teacher_id.
-- Prefer `006_safe_multitenant_teacher_backfill.sql` for an idempotent path that
-- never deletes data and safely re-reruns (backfills NULLs, conditional PK upgrade).
-- This file is applied before 006 on fresh installs; 006 completes / repairs state.

insert into public.teachers (
  id,
  business_id,
  full_name,
  business_name,
  phone,
  slug,
  created_at
)
values (
  '00000000-0000-0000-0000-000000000002'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Default Teacher',
  'Default',
  '',
  'serviceos-default-teacher',
  now()
)
on conflict (id) do nothing;

alter table public.clients
  add column if not exists teacher_id uuid not null default '00000000-0000-0000-0000-000000000002'::uuid;

alter table public.appointments
  add column if not exists teacher_id uuid not null default '00000000-0000-0000-0000-000000000002'::uuid;

-- booking_settings: composite primary key (business + teacher)
alter table public.booking_settings
  add column if not exists teacher_id uuid not null default '00000000-0000-0000-0000-000000000002'::uuid;

alter table public.booking_settings drop constraint if exists booking_settings_pkey;
alter table public.booking_settings
  add primary key (business_id, teacher_id);

alter table public.serviceos_app_settings
  add column if not exists teacher_id uuid not null default '00000000-0000-0000-0000-000000000002'::uuid;

alter table public.serviceos_app_settings drop constraint if exists serviceos_app_settings_pkey;
alter table public.serviceos_app_settings
  add primary key (business_id, teacher_id);

alter table public.serviceos_availability_settings
  add column if not exists teacher_id uuid not null default '00000000-0000-0000-0000-000000000002'::uuid;

alter table public.serviceos_availability_settings drop constraint if exists serviceos_availability_settings_pkey;
alter table public.serviceos_availability_settings
  add primary key (business_id, teacher_id);
