-- ============================================
-- Fix for Bug 1: auth_tokens Column Mismatch
-- ============================================
-- Run this in Supabase SQL Editor
--
-- This will:
-- 1. Drop the old table with teacher_id
-- 2. Create new table with user_id
-- 3. Recreate all indexes and policies
-- ============================================

-- Step 1: Drop old table
DROP TABLE IF EXISTS public.auth_tokens CASCADE;

-- Step 2: Create new table with user_id
CREATE TABLE public.auth_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,  -- Can reference either teachers.id or clients.id
  token text not null unique,
  token_type text not null check (token_type in ('password_reset', 'email_verification')),
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

-- Step 3: Add email_verified column to teachers table (if not exists)
ALTER TABLE public.teachers
  ADD COLUMN IF NOT EXISTS email_verified boolean not null default false;

-- Step 4: Create indexes
CREATE INDEX auth_tokens_user_id_idx ON public.auth_tokens(user_id);
CREATE INDEX auth_tokens_token_idx ON public.auth_tokens(token);
CREATE INDEX auth_tokens_expires_at_idx ON public.auth_tokens(expires_at);
CREATE INDEX auth_tokens_token_type_idx ON public.auth_tokens(token_type);

-- Step 5: Enable RLS
ALTER TABLE public.auth_tokens ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS policy
CREATE POLICY "Users can view own tokens"
  ON public.auth_tokens
  FOR SELECT
  USING (auth.uid()::text = user_id::text);

-- Step 7: Create cleanup function
CREATE OR REPLACE FUNCTION public.cleanup_expired_auth_tokens()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.auth_tokens
  WHERE expires_at < now()
    AND used_at IS NULL;
END;
$$;

-- Step 8: Add comments
COMMENT ON TABLE public.auth_tokens IS 'טוקנים לאיפוס סיסמה ואימות אימייל';
COMMENT ON COLUMN public.auth_tokens.user_id IS 'מזהה משתמש (מורה או לקוח)';
COMMENT ON COLUMN public.auth_tokens.token_type IS 'סוג הטוקן: password_reset או email_verification';
COMMENT ON COLUMN public.auth_tokens.expires_at IS 'תאריך תפוגה';
COMMENT ON COLUMN public.auth_tokens.used_at IS 'תאריך שימוש (null אם לא נוצל)';
COMMENT ON COLUMN public.teachers.email_verified IS 'האם האימייל אומת';

-- Done! ✅
SELECT 'Bug fix applied successfully! ✅' as status;
