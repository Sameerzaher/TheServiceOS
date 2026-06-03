-- Migration: Client Portal
-- פורטל ללקוחות - הרשאות וטוקנים

-- Add client authentication fields
alter table public.clients
  add column if not exists email text unique,
  add column if not exists password_hash text,
  add column if not exists email_verified boolean not null default false,
  add column if not exists last_login_at timestamptz,
  add column if not exists portal_enabled boolean not null default true;

-- Create client_sessions table for authentication
create table if not exists public.client_sessions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  token text not null unique,
  expires_at timestamptz not null,
  last_activity_at timestamptz not null default now(),
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

-- Create client_invitations table
create table if not exists public.client_invitations (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  invitation_token text not null unique,
  email text not null,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

-- Add indexes for performance
create index if not exists clients_email_idx on public.clients(email);
create index if not exists client_sessions_client_id_idx on public.client_sessions(client_id);
create index if not exists client_sessions_token_idx on public.client_sessions(token);
create index if not exists client_sessions_expires_at_idx on public.client_sessions(expires_at);
create index if not exists client_invitations_token_idx on public.client_invitations(invitation_token);
create index if not exists client_invitations_email_idx on public.client_invitations(email);

-- RLS policies for client portal
alter table public.client_sessions enable row level security;
alter table public.client_invitations enable row level security;

-- Clients can view/manage their own sessions
create policy "Clients can view own sessions"
  on public.client_sessions
  for select
  using (auth.uid()::text = client_id::text);

create policy "Clients can delete own sessions"
  on public.client_sessions
  for delete
  using (auth.uid()::text = client_id::text);

-- Teachers can manage invitations
create policy "Teachers can manage invitations"
  on public.client_invitations
  for all
  using (auth.uid()::text = teacher_id::text);

-- Function to clean up expired sessions
create or replace function public.cleanup_expired_client_sessions()
returns void
language plpgsql
security definer
as $$
begin
  delete from public.client_sessions
  where expires_at < now();
end;
$$;

-- Function to clean up expired invitations
create or replace function public.cleanup_expired_client_invitations()
returns void
language plpgsql
security definer
as $$
begin
  delete from public.client_invitations
  where expires_at < now()
    and accepted_at is null;
end;
$$;

-- Comments
comment on table public.client_sessions is 'סשנים של לקוחות בפורטל';
comment on table public.client_invitations is 'הזמנות ללקוחות להצטרף לפורטל';
comment on column public.clients.email is 'אימייל ללוגין (אופציונלי)';
comment on column public.clients.password_hash is 'סיסמה מוצפנת';
comment on column public.clients.email_verified is 'האם האימייל אומת';
comment on column public.clients.portal_enabled is 'האם גישה לפורטל מאופשרת';
