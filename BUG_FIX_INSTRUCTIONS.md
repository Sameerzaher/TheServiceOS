# 🐛 Bug Fix Instructions

## Quick Summary

- **Bug 1**: ❌ Database column mismatch (`teacher_id` vs `user_id`) - **NEEDS FIXING**
- **Bug 2**: ✅ Email verification check - **ALREADY FIXED**

---

## 🚀 How to Fix Bug 1

### Step 1: Choose Your Approach

**Option A: Fresh Start (Easiest)** ⭐ Recommended for Development
- Drops and recreates the table
- No data to preserve
- Clean and simple

**Option B: Preserve Data** 
- Keeps existing tokens
- Renames column
- More complex

---

## 📝 Option A: Fresh Start (Recommended)

### 1. Open Supabase SQL Editor

Go to your Supabase Dashboard → SQL Editor

### 2. Run the Fix Script

Copy and paste the entire contents of **`APPLY_BUG_FIX.sql`** and click "Run"

**OR manually run:**

```sql
-- 1. Drop old table
DROP TABLE IF EXISTS public.auth_tokens CASCADE;

-- 2. Create new table with user_id
CREATE TABLE public.auth_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  token text not null unique,
  token_type text not null check (token_type in ('password_reset', 'email_verification')),
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

-- 3. Add indexes
CREATE INDEX auth_tokens_user_id_idx ON public.auth_tokens(user_id);
CREATE INDEX auth_tokens_token_idx ON public.auth_tokens(token);
CREATE INDEX auth_tokens_expires_at_idx ON public.auth_tokens(expires_at);
CREATE INDEX auth_tokens_token_type_idx ON public.auth_tokens(token_type);

-- 4. Enable RLS
ALTER TABLE public.auth_tokens ENABLE ROW LEVEL SECURITY;

-- 5. Create policy
CREATE POLICY "Users can view own tokens"
  ON public.auth_tokens FOR SELECT
  USING (auth.uid()::text = user_id::text);

-- 6. Add email_verified to teachers
ALTER TABLE public.teachers
  ADD COLUMN IF NOT EXISTS email_verified boolean not null default false;
```

### 3. Verify Success

Run this to check:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'auth_tokens' 
  AND table_schema = 'public';
```

You should see `user_id` (not `teacher_id`) ✅

---

## 📝 Option B: Preserve Existing Data

### 1. Open Supabase SQL Editor

### 2. Run the Migration Script

Copy and paste the entire contents of **`MIGRATE_EXISTING_DATA.sql`** and click "Run"

**OR manually run:**

```sql
-- Rename column
ALTER TABLE public.auth_tokens RENAME COLUMN teacher_id TO user_id;

-- Drop foreign key
ALTER TABLE public.auth_tokens DROP CONSTRAINT IF EXISTS auth_tokens_teacher_id_fkey;

-- Fix indexes
DROP INDEX IF EXISTS public.auth_tokens_teacher_id_idx;
CREATE INDEX auth_tokens_user_id_idx ON public.auth_tokens(user_id);

-- Fix RLS policy
DROP POLICY IF EXISTS "Users can view own tokens" ON public.auth_tokens;
CREATE POLICY "Users can view own tokens"
  ON public.auth_tokens FOR SELECT
  USING (auth.uid()::text = user_id::text);
```

---

## ✅ Testing After Fix

### Test 1: Client Signup

```bash
# Should work without errors
curl -X POST http://localhost:3000/api/client-portal/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test User",
    "email": "test@example.com",
    "phone": "0501234567",
    "password": "Test1234"
  }'
```

Expected: Success message ✅

### Test 2: Email Verification Check

Try logging in without verifying email:

```bash
curl -X POST http://localhost:3000/api/client-portal/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234"
  }'
```

Expected: Error "אנא אמת את האימייל שלך לפני ההתחברות" ✅

### Test 3: Full Flow

1. Signup → Should create token in `auth_tokens` with `user_id` ✅
2. Check console for verification email ✅
3. Verify email → Should mark `used_at` in token ✅
4. Login → Should succeed ✅

---

## 🔍 Verification Checklist

After applying the fix, verify:

```sql
-- 1. Check table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'auth_tokens'
ORDER BY ordinal_position;

-- Should see: user_id (not teacher_id) ✅

-- 2. Check there's no foreign key
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'auth_tokens';

-- Should NOT see foreign key to teachers ✅

-- 3. Try inserting a test token
INSERT INTO auth_tokens (user_id, token, token_type, expires_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',  -- Any UUID
  'test-token-123',
  'email_verification',
  now() + interval '1 hour'
);

-- Should succeed ✅

-- 4. Clean up test
DELETE FROM auth_tokens WHERE token = 'test-token-123';
```

---

## 📊 Summary

### What Changed:

| Before (Broken) | After (Fixed) |
|-----------------|---------------|
| `teacher_id uuid not null references teachers(id)` | `user_id uuid not null` |
| ❌ Only works for teachers | ✅ Works for teachers AND clients |
| ❌ Foreign key constraint | ✅ No constraint (more flexible) |
| ❌ Client signups fail | ✅ Client signups work |

### Why This Is Better:

- ✅ **Flexible**: Works for both teachers and clients
- ✅ **No Constraint**: Can reference any UUID
- ✅ **Secure**: RLS policies handle access control
- ✅ **Future-proof**: Can add more user types later

---

## 🎉 You're Done!

After running the fix:

1. ✅ Bug 1: Fixed (database accepts `user_id`)
2. ✅ Bug 2: Already fixed (email verification check in place)
3. ✅ Client Portal: 100% functional
4. ✅ Ready for testing!

---

## 📞 Need Help?

If something doesn't work:

1. Check Supabase logs for errors
2. Verify the fix was applied (run verification queries)
3. Restart your Next.js dev server: `npm run dev`
4. Check browser console and network tab for API errors

---

*Last Updated: 2026-06-03*
