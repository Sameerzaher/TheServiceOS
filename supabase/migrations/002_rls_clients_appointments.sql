-- Fix 42501 "violates row-level security" when the browser (anon key) writes
-- appointments after load. Run in Supabase SQL Editor if needed.
--
-- Replace BOTH UUID literals with your `NEXT_PUBLIC_BUSINESS_ID` (must match row data).

alter table public.appointments enable row level security;
alter table public.clients enable row level security;

drop policy if exists "serviceos_mvp_appointments" on public.appointments;
drop policy if exists "serviceos_mvp_clients" on public.clients;

create policy "serviceos_mvp_appointments"
  on public.appointments
  for all
  to anon, authenticated
  using (business_id = '00000000-0000-0000-0000-000000000001'::uuid)
  with check (business_id = '00000000-0000-0000-0000-000000000001'::uuid);

create policy "serviceos_mvp_clients"
  on public.clients
  for all
  to anon, authenticated
  using (business_id = '00000000-0000-0000-0000-000000000001'::uuid)
  with check (business_id = '00000000-0000-0000-0000-000000000001'::uuid);
