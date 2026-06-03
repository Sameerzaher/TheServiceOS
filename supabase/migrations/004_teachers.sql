-- Teachers: instructor profiles with globally unique slug (for public URLs).
-- Align business_id with NEXT_PUBLIC_BUSINESS_ID / existing MVP policies.

create table if not exists public.teachers (
  id uuid primary key,
  business_id uuid not null,
  full_name text not null,
  business_name text not null,
  phone text not null,
  slug text not null,
  created_at timestamptz not null,
  constraint teachers_slug_unique unique (slug)
);

create index if not exists teachers_business_id_idx
  on public.teachers (business_id);

alter table public.teachers enable row level security;

drop policy if exists "serviceos_mvp_teachers" on public.teachers;

create policy "serviceos_mvp_teachers"
  on public.teachers
  for all
  to anon, authenticated
  using (business_id = '00000000-0000-0000-0000-000000000001'::uuid)
  with check (business_id = '00000000-0000-0000-0000-000000000001'::uuid);
