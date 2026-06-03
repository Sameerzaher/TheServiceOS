-- ServiceOS: safe, idempotent backfill for multi-tenant teacher scope.
-- - Ensures one default teacher row exists (no deletes of business data).
-- - Sets teacher_id on all existing clients, appointments (incl. public “bookings” rows),
--   booking_settings, serviceos_app_settings, and serviceos_availability_settings.
-- - Merges teacherId into legacy JSON payloads where those columns exist.
-- - Replaces single-column settings PK with (business_id, teacher_id) only when needed.
--
-- Replace UUID literals below if your deployment differs (must match app env):
--   NEXT_PUBLIC_BUSINESS_ID
--   DEFAULT_MVP_TEACHER_ID / NEXT_PUBLIC_DEFAULT_TEACHER_ID
--
-- Safe to run multiple times on the same database.

create extension if not exists "pgcrypto";

do $$
declare
  v_business uuid := '00000000-0000-0000-0000-000000000001'::uuid;
  v_teacher uuid := '00000000-0000-0000-0000-000000000002'::uuid;
  v_slug text := 'default-00000000-0000-0000-0000-000000000002';
begin
  if not exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'teachers'
  ) then
    raise notice '006: public.teachers missing — run migration 004 first; skipping teacher seed.';
    return;
  end if;

  insert into public.teachers (
    id,
    business_id,
    full_name,
    business_name,
    phone,
    slug,
    created_at
  )
  select
    v_teacher,
    v_business,
    'Default Teacher',
    'Default',
    '',
    v_slug,
    now()
  where not exists (select 1 from public.teachers t where t.id = v_teacher);

  update public.teachers set
    business_id = v_business,
    full_name = 'Default Teacher',
    business_name = 'Default',
    phone = coalesce(nullif(phone, ''), ''),
    slug = case
      when slug = '' or slug is null then v_slug
      else slug
    end
  where id = v_teacher;
end $$;

-- ---------------------------------------------------------------------------
-- clients
-- ---------------------------------------------------------------------------
alter table public.clients
  add column if not exists teacher_id uuid;

update public.clients
set teacher_id = '00000000-0000-0000-0000-000000000002'::uuid
where teacher_id is null;

alter table public.clients
  alter column teacher_id set default '00000000-0000-0000-0000-000000000002'::uuid;

alter table public.clients
  alter column teacher_id set not null;

-- ---------------------------------------------------------------------------
-- appointments (public booking requests are appointment rows)
-- ---------------------------------------------------------------------------
alter table public.appointments
  add column if not exists teacher_id uuid;

update public.appointments
set teacher_id = '00000000-0000-0000-0000-000000000002'::uuid
where teacher_id is null;

alter table public.appointments
  alter column teacher_id set default '00000000-0000-0000-0000-000000000002'::uuid;

alter table public.appointments
  alter column teacher_id set not null;

-- ---------------------------------------------------------------------------
-- booking_settings
-- ---------------------------------------------------------------------------
do $$
declare
  cname text;
  def text;
begin
  if not exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'booking_settings'
  ) then
    return;
  end if;

  alter table public.booking_settings
    add column if not exists teacher_id uuid;

  update public.booking_settings
  set teacher_id = '00000000-0000-0000-0000-000000000002'::uuid
  where teacher_id is null;

  alter table public.booking_settings
    alter column teacher_id set default '00000000-0000-0000-0000-000000000002'::uuid;

  alter table public.booking_settings
    alter column teacher_id set not null;

  select con.conname, pg_get_constraintdef(con.oid)
    into cname, def
  from pg_constraint con
  where con.conrelid = 'public.booking_settings'::regclass
    and con.contype = 'p'
  limit 1;

  if def is not null and position('teacher_id' in def) > 0 then
    return;
  end if;

  if cname is not null then
    execute format('alter table public.booking_settings drop constraint %I', cname);
  end if;

  alter table public.booking_settings
    add primary key (business_id, teacher_id);
end $$;

-- ---------------------------------------------------------------------------
-- serviceos_app_settings
-- ---------------------------------------------------------------------------
do $$
declare
  cname text;
  def text;
begin
  if not exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'serviceos_app_settings'
  ) then
    return;
  end if;

  alter table public.serviceos_app_settings
    add column if not exists teacher_id uuid;

  update public.serviceos_app_settings
  set teacher_id = '00000000-0000-0000-0000-000000000002'::uuid
  where teacher_id is null;

  alter table public.serviceos_app_settings
    alter column teacher_id set default '00000000-0000-0000-0000-000000000002'::uuid;

  alter table public.serviceos_app_settings
    alter column teacher_id set not null;

  update public.serviceos_app_settings
  set payload = coalesce(payload, '{}'::jsonb) || jsonb_build_object(
    'teacherId', '00000000-0000-0000-0000-000000000002'
  )
  where not coalesce(payload, '{}'::jsonb) ? 'teacherId';

  select con.conname, pg_get_constraintdef(con.oid)
    into cname, def
  from pg_constraint con
  where con.conrelid = 'public.serviceos_app_settings'::regclass
    and con.contype = 'p'
  limit 1;

  if def is not null and position('teacher_id' in def) > 0 then
    return;
  end if;

  if cname is not null then
    execute format('alter table public.serviceos_app_settings drop constraint %I', cname);
  end if;

  alter table public.serviceos_app_settings
    add primary key (business_id, teacher_id);
end $$;

-- ---------------------------------------------------------------------------
-- serviceos_availability_settings (legacy table from 001)
-- ---------------------------------------------------------------------------
do $$
declare
  cname text;
  def text;
begin
  if not exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'serviceos_availability_settings'
  ) then
    return;
  end if;

  alter table public.serviceos_availability_settings
    add column if not exists teacher_id uuid;

  update public.serviceos_availability_settings
  set teacher_id = '00000000-0000-0000-0000-000000000002'::uuid
  where teacher_id is null;

  alter table public.serviceos_availability_settings
    alter column teacher_id set default '00000000-0000-0000-0000-000000000002'::uuid;

  alter table public.serviceos_availability_settings
    alter column teacher_id set not null;

  update public.serviceos_availability_settings
  set payload = coalesce(payload, '{}'::jsonb) || jsonb_build_object(
    'teacherId', '00000000-0000-0000-0000-000000000002'
  )
  where not coalesce(payload, '{}'::jsonb) ? 'teacherId';

  select con.conname, pg_get_constraintdef(con.oid)
    into cname, def
  from pg_constraint con
  where con.conrelid = 'public.serviceos_availability_settings'::regclass
    and con.contype = 'p'
  limit 1;

  if def is not null and position('teacher_id' in def) > 0 then
    return;
  end if;

  if cname is not null then
    execute format(
      'alter table public.serviceos_availability_settings drop constraint %I',
      cname
    );
  end if;

  alter table public.serviceos_availability_settings
    add primary key (business_id, teacher_id);
end $$;
