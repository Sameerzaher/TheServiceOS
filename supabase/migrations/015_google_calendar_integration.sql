-- Google Calendar OAuth integration per teacher (server-side tokens only).
-- Apply in Supabase SQL editor or via CLI migration.

create table if not exists public.teacher_google_calendar_integrations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  teacher_id uuid not null,
  provider text not null default 'google',
  google_account_email text,
  refresh_token_enc text not null,
  access_token text,
  access_token_expires_at timestamptz,
  calendar_id text not null default 'primary',
  sync_enabled boolean not null default true,
  description_template text,
  last_sync_at timestamptz,
  last_sync_status text,
  last_sync_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, teacher_id, provider)
);

create index if not exists idx_teacher_google_cal_teacher
  on public.teacher_google_calendar_integrations (teacher_id);

comment on table public.teacher_google_calendar_integrations is
  'Stores encrypted Google OAuth refresh tokens for Calendar sync. RLS: service role / admin client only.';

-- TODO: enable RLS policies matching other teacher-scoped tables when using anon key.
