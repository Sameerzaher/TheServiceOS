-- ServiceOS QA: two additional teachers for multi-tenant isolation checks.
-- Run in Supabase SQL editor (or `supabase db execute`) against a dev/test project.
-- IDs and slugs must match `src/qa/multitenantFixtures.ts`.
-- Safe to re-run: upserts by primary key `id`.

insert into public.teachers (
  id,
  business_id,
  full_name,
  business_name,
  phone,
  slug,
  business_type,
  created_at
)
values
  (
    '550e8400-e29b-41d4-a716-446655440101'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    'QA Teacher Alpha',
    'QA Studio Alpha',
    '050-0000001',
    'qa-alpha',
    'driving_instructor',
    now()
  ),
  (
    '550e8400-e29b-41d4-a716-446655440102'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    'QA Teacher Beta',
    'QA Studio Beta',
    '050-0000002',
    'qa-beta',
    'cosmetic_clinic',
    now()
  )
on conflict (id) do update set
  business_id = excluded.business_id,
  full_name = excluded.full_name,
  business_name = excluded.business_name,
  phone = excluded.phone,
  slug = excluded.slug,
  business_type = excluded.business_type;
