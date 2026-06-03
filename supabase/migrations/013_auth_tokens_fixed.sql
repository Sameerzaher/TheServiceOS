-- Migration: Authentication Tokens (Fixed for both teachers and clients)
-- טבלת טוקנים לאיפוס סיסמה ואימות אימייל

-- Create auth_tokens table with generic user_id (no foreign key constraint)
create table if not exists public.auth_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,  -- Can reference either teachers.id or clients.id
  token text not null unique,
  token_type text not null check (token_type in ('password_reset', 'email_verification')),
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

-- Add email_verified column to teachers table
alter table public.teachers
  add column if not exists email_verified boolean not null default false;

-- Add indexes for performance
create index if not exists auth_tokens_user_id_idx on public.auth_tokens(user_id);
create index if not exists auth_tokens_token_idx on public.auth_tokens(token);
create index if not exists auth_tokens_expires_at_idx on public.auth_tokens(expires_at);
create index if not exists auth_tokens_token_type_idx on public.auth_tokens(token_type);

-- Add RLS policies
alter table public.auth_tokens enable row level security;

-- Users can only see their own tokens
create policy "Users can view own tokens"
  on public.auth_tokens
  for select
  using (auth.uid()::text = user_id::text);

-- Function to clean up expired tokens (run periodically)
create or replace function public.cleanup_expired_auth_tokens()
returns void
language plpgsql
security definer
as $$
begin
  delete from public.auth_tokens
  where expires_at < now()
    and used_at is null;
end;
$$;

comment on table public.auth_tokens is 'טוקנים לאיפוס סיסמה ואימות אימייל';
comment on column public.auth_tokens.user_id is 'מזהה משתמש (מורה או לקוח)';
comment on column public.auth_tokens.token_type is 'סוג הטוקן: password_reset או email_verification';
comment on column public.auth_tokens.expires_at is 'תאריך תפוגה';
comment on column public.auth_tokens.used_at is 'תאריך שימוש (null אם לא נוצל)';
comment on column public.teachers.email_verified is 'האם האימייל אומת';
