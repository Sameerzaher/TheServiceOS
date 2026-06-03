-- Service catalog per teacher (pricing, duration). Required for POST /api/services and public booking.

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  teacher_id uuid not null,
  name text not null,
  description text,
  price numeric(10, 2) not null,
  duration_minutes integer not null,
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_services_teacher on public.services (teacher_id);
create index if not exists idx_services_business on public.services (business_id);
create index if not exists idx_services_active on public.services (is_active);
create index if not exists idx_services_order on public.services (teacher_id, display_order);

alter table public.services enable row level security;

-- Replace ad-hoc policies if someone ran CREATE-SERVICES-TABLE.sql locally
drop policy if exists services_select_own on public.services;
drop policy if exists services_insert_own on public.services;
drop policy if exists services_update_own on public.services;
drop policy if exists services_delete_own on public.services;
drop policy if exists services_select_public on public.services;
drop policy if exists "services_teacher_scope" on public.services;
drop policy if exists "services_admin_all" on public.services;

create policy "services_teacher_scope"
  on public.services
  for all
  to anon, authenticated
  using (
    business_id = (current_setting('request.headers')::json->>'x-business-id')::uuid
    and teacher_id = (current_setting('request.headers')::json->>'x-teacher-id')::uuid
  )
  with check (
    business_id = (current_setting('request.headers')::json->>'x-business-id')::uuid
    and teacher_id = (current_setting('request.headers')::json->>'x-teacher-id')::uuid
  );

create policy "services_admin_all"
  on public.services
  for all
  to service_role
  using (true)
  with check (true);

comment on table public.services is 'Per-teacher services (name, price, duration) for booking and onboarding.';
