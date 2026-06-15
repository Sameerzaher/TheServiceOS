-- Link appointments.teacher_id -> teachers.id (PostgREST embed + referential integrity)

update public.appointments
set teacher_id = '00000000-0000-0000-0000-000000000002'::uuid
where teacher_id is null
   or not exists (
     select 1 from public.teachers t where t.id = appointments.teacher_id
   );

alter table public.appointments
  drop constraint if exists appointments_teacher_id_fkey;

alter table public.appointments
  add constraint appointments_teacher_id_fkey
  foreign key (teacher_id) references public.teachers (id) on delete restrict;
