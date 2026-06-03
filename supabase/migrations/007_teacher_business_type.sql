-- Pilot business types: instructor vs cosmetic clinic (same app, different labels/fields).

alter table public.teachers
  add column if not exists business_type text;

update public.teachers
set business_type = 'driving_instructor'
where business_type is null or trim(business_type) = '';

alter table public.teachers
  alter column business_type set default 'driving_instructor';

alter table public.teachers
  alter column business_type set not null;

alter table public.teachers drop constraint if exists teachers_business_type_check;

alter table public.teachers
  add constraint teachers_business_type_check
  check (business_type in ('driving_instructor', 'cosmetic_clinic'));
