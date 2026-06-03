-- Migration 009: Add demo teachers for multi-tenant testing
-- Creates 2 pilot businesses with different businessTypes

-- Sameer Driving (driving instructor)
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
values (
  '550e8400-e29b-41d4-a716-446655440201'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Sameer',
  'Sameer Driving',
  '050-1234567',
  'sameer-driving',
  'driving_instructor',
  now()
)
on conflict (id) do update set
  business_id = excluded.business_id,
  full_name = excluded.full_name,
  business_name = excluded.business_name,
  phone = excluded.phone,
  slug = excluded.slug,
  business_type = excluded.business_type;

-- Dr Avi Clinic (cosmetic clinic)
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
values (
  '550e8400-e29b-41d4-a716-446655440202'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Dr. Avi',
  'Dr Avi Clinic',
  '050-7654321',
  'dr-avi-clinic',
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

-- Migrate any existing data (from default teacher) to Sameer Driving
-- This only runs if there's data assigned to the old default teacher

do $$
declare
  v_old_teacher uuid := '00000000-0000-0000-0000-000000000002'::uuid;
  v_sameer uuid := '550e8400-e29b-41d4-a716-446655440201'::uuid;
begin
  -- Move clients
  update public.clients
  set teacher_id = v_sameer
  where teacher_id = v_old_teacher;

  -- Move appointments
  update public.appointments
  set teacher_id = v_sameer
  where teacher_id = v_old_teacher;

  -- Move booking_settings
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'booking_settings'
  ) then
    update public.booking_settings
    set teacher_id = v_sameer
    where teacher_id = v_old_teacher;
  end if;

  -- Move app_settings
  update public.serviceos_app_settings
  set teacher_id = v_sameer
  where teacher_id = v_old_teacher;

  -- Move availability_settings
  update public.serviceos_availability_settings
  set teacher_id = v_sameer
  where teacher_id = v_old_teacher;

  raise notice '009: Migrated data from default teacher to Sameer Driving';
end $$;
