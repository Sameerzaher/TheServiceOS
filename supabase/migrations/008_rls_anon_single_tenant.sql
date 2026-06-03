-- Fix 42501 RLS when the browser (anon key) writes rows and NEXT_PUBLIC_BUSINESS_ID
-- is not the hardcoded MVP UUID from older migrations.
--
-- Replaces restrictive MVP policies with permissive anon/authenticated access for
-- single-tenant deployments (anon key is already public in the client).
-- Tighten policies when you add auth / true multi-tenant isolation.

-- booking_settings (availability / public booking toggle)
alter table public.booking_settings enable row level security;
drop policy if exists "serviceos_mvp_booking_settings" on public.booking_settings;
create policy "serviceos_booking_settings_anon_rw"
  on public.booking_settings
  for all
  to anon, authenticated
  using (true)
  with check (true);

-- App settings payload (per teacher)
alter table public.serviceos_app_settings enable row level security;
drop policy if exists "serviceos_mvp_app_settings" on public.serviceos_app_settings;
create policy "serviceos_app_settings_anon_rw"
  on public.serviceos_app_settings
  for all
  to anon, authenticated
  using (true)
  with check (true);

-- Legacy availability JSON table (if still present)
alter table public.serviceos_availability_settings enable row level security;
drop policy if exists "serviceos_mvp_availability_settings" on public.serviceos_availability_settings;
create policy "serviceos_availability_settings_anon_rw"
  on public.serviceos_availability_settings
  for all
  to anon, authenticated
  using (true)
  with check (true);

-- Core domain tables
alter table public.clients enable row level security;
drop policy if exists "serviceos_mvp_clients" on public.clients;
create policy "serviceos_clients_anon_rw"
  on public.clients
  for all
  to anon, authenticated
  using (true)
  with check (true);

alter table public.appointments enable row level security;
drop policy if exists "serviceos_mvp_appointments" on public.appointments;
create policy "serviceos_appointments_anon_rw"
  on public.appointments
  for all
  to anon, authenticated
  using (true)
  with check (true);

-- Teacher profiles (slug, business_type, etc.)
alter table public.teachers enable row level security;
drop policy if exists "serviceos_mvp_teachers" on public.teachers;
create policy "serviceos_teachers_anon_rw"
  on public.teachers
  for all
  to anon, authenticated
  using (true)
  with check (true);
