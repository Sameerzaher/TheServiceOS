-- Canonical business rows — every teacher.business_id should reference public.businesses.id.
-- Service role / admin flows upsert into this table before creating teachers.

create table if not exists public.businesses (
  id uuid primary key,
  name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists businesses_created_at_idx
  on public.businesses (created_at);

alter table public.businesses enable row level security;

drop policy if exists "businesses_service_all" on public.businesses;
create policy "businesses_service_all"
  on public.businesses
  for all
  to service_role
  using (true)
  with check (true);

-- Backfill: one row per distinct valid teacher.business_id (skip all-zero UUID).
insert into public.businesses (id, name, created_at, updated_at)
select
  t.business_id,
  coalesce(max(t.business_name), 'Business') as name,
  now(),
  now()
from public.teachers t
where t.business_id is not null
  and t.business_id <> '00000000-0000-0000-0000-000000000000'::uuid
group by t.business_id
on conflict (id) do update set
  name = excluded.name,
  updated_at = excluded.updated_at;

comment on table public.businesses is 'Tenant / org scope; teachers.business_id references this table.';
