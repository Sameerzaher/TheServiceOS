-- ServiceOS: domain tables for a fixed business_id (MVP, no auth).
-- Set NEXT_PUBLIC_BUSINESS_ID to the same UUID you seed here (or change this file to match your env).

-- Default demo business — replace in production or align with .env
create extension if not exists "pgcrypto";

create table if not exists public.clients (
  id uuid primary key,
  business_id uuid not null,
  full_name text not null default '',
  phone text not null default '',
  notes text not null default '',
  custom_fields jsonb not null default '{}'::jsonb,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create index if not exists clients_business_id_idx
  on public.clients (business_id);

create table if not exists public.appointments (
  id uuid primary key,
  business_id uuid not null,
  client_id uuid not null references public.clients (id) on delete cascade,
  start_at timestamptz not null,
  end_at timestamptz not null,
  status text not null,
  payment_status text not null,
  amount numeric not null default 0,
  custom_fields jsonb not null default '{}'::jsonb,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create index if not exists appointments_business_id_idx
  on public.appointments (business_id);
create index if not exists appointments_client_id_idx
  on public.appointments (client_id);
create index if not exists appointments_start_at_idx
  on public.appointments (start_at);

create table if not exists public.serviceos_app_settings (
  business_id uuid primary key,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.serviceos_availability_settings (
  business_id uuid primary key,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- RLS: MVP policies scoped to one business UUID (copy into Supabase SQL editor and match NEXT_PUBLIC_BUSINESS_ID).
-- Example replaces 00000000-0000-0000-0000-000000000001 — use your real UUID.

alter table public.clients enable row level security;
alter table public.appointments enable row level security;
alter table public.serviceos_app_settings enable row level security;
alter table public.serviceos_availability_settings enable row level security;

-- Drop if re-running migration in dev
drop policy if exists "serviceos_mvp_clients" on public.clients;
drop policy if exists "serviceos_mvp_appointments" on public.appointments;
drop policy if exists "serviceos_mvp_app_settings" on public.serviceos_app_settings;
drop policy if exists "serviceos_mvp_availability_settings" on public.serviceos_availability_settings;

create policy "serviceos_mvp_clients"
  on public.clients
  for all
  to anon, authenticated
  using (business_id = '00000000-0000-0000-0000-000000000001'::uuid)
  with check (business_id = '00000000-0000-0000-0000-000000000001'::uuid);

create policy "serviceos_mvp_appointments"
  on public.appointments
  for all
  to anon, authenticated
  using (business_id = '00000000-0000-0000-0000-000000000001'::uuid)
  with check (business_id = '00000000-0000-0000-0000-000000000001'::uuid);

create policy "serviceos_mvp_app_settings"
  on public.serviceos_app_settings
  for all
  to anon, authenticated
  using (business_id = '00000000-0000-0000-0000-000000000001'::uuid)
  with check (business_id = '00000000-0000-0000-0000-000000000001'::uuid);

create policy "serviceos_mvp_availability_settings"
  on public.serviceos_availability_settings
  for all
  to anon, authenticated
  using (business_id = '00000000-0000-0000-0000-000000000001'::uuid)
  with check (business_id = '00000000-0000-0000-0000-000000000001'::uuid);
