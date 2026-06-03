-- ============================================
-- Option B: Migrate Existing Data
-- ============================================
-- Use this if you have existing data in auth_tokens
-- that you want to preserve
-- ============================================

-- Step 1: Rename the column
ALTER TABLE public.auth_tokens 
  RENAME COLUMN teacher_id TO user_id;

-- Step 2: Drop the foreign key constraint
ALTER TABLE public.auth_tokens 
  DROP CONSTRAINT IF EXISTS auth_tokens_teacher_id_fkey;

-- Step 3: Update index names
DROP INDEX IF EXISTS public.auth_tokens_teacher_id_idx;
CREATE INDEX IF NOT EXISTS auth_tokens_user_id_idx ON public.auth_tokens(user_id);

-- Step 4: Update RLS policy
DROP POLICY IF EXISTS "Users can view own tokens" ON public.auth_tokens;
CREATE POLICY "Users can view own tokens"
  ON public.auth_tokens
  FOR SELECT
  USING (auth.uid()::text = user_id::text);

-- Step 5: Update comments
COMMENT ON COLUMN public.auth_tokens.user_id IS 'מזהה משתמש (מורה או לקוח)';

-- Done! ✅
SELECT 'Migration completed successfully! ✅' as status;
