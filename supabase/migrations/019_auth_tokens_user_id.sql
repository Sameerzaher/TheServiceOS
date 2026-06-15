-- Unify auth_tokens for teachers and clients (generic user_id, no FK)
alter table public.auth_tokens
  drop constraint if exists auth_tokens_teacher_id_fkey;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'auth_tokens'
      and column_name = 'teacher_id'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'auth_tokens'
      and column_name = 'user_id'
  ) then
    alter table public.auth_tokens rename column teacher_id to user_id;
  end if;
end $$;

alter table public.auth_tokens
  add column if not exists user_id uuid;

drop index if exists auth_tokens_teacher_id_idx;
create index if not exists auth_tokens_user_id_idx on public.auth_tokens(user_id);

comment on column public.auth_tokens.user_id is 'מזהה משתמש (מורה או לקוח)';
