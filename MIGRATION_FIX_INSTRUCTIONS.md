# 🔧 Migration Fix Instructions

## Critical Bug Fixes

Two critical bugs were discovered and fixed:

### Bug 1: auth_tokens table column mismatch ✅ FIXED
**Problem**: The `auth_tokens` table used `teacher_id` with a foreign key constraint, but client portal APIs tried to insert with `user_id`, causing constraint violations.

**Solution**: Created a new migration file that uses a generic `user_id` column without foreign key constraint, allowing it to reference both teachers and clients.

### Bug 2: Missing email verification check ✅ FIXED
**Problem**: Login endpoint didn't check `email_verified` before allowing login.

**Solution**: Added email verification check in login endpoint.

---

## How to Apply the Fix

### Option 1: Fresh Database (Recommended for Development)

If you haven't pushed to production yet and can reset your database:

1. **Delete the old migration**:
   ```sql
   -- In Supabase SQL Editor
   DROP TABLE IF EXISTS public.auth_tokens CASCADE;
   ```

2. **Run the new migration**:
   ```sql
   -- Copy and paste contents from:
   -- supabase/migrations/013_auth_tokens_fixed.sql
   ```

3. **Continue with migration 015**:
   ```sql
   -- Run supabase/migrations/015_client_portal.sql
   ```

### Option 2: Migrate Existing Data

If you already have data in `auth_tokens`:

```sql
-- Step 1: Rename the column
ALTER TABLE public.auth_tokens 
  RENAME COLUMN teacher_id TO user_id;

-- Step 2: Drop the foreign key constraint
ALTER TABLE public.auth_tokens 
  DROP CONSTRAINT IF EXISTS auth_tokens_teacher_id_fkey;

-- Step 3: Update the index name
DROP INDEX IF EXISTS auth_tokens_teacher_id_idx;
CREATE INDEX auth_tokens_user_id_idx ON public.auth_tokens(user_id);

-- Step 4: Update the RLS policy
DROP POLICY IF EXISTS "Users can view own tokens" ON public.auth_tokens;
CREATE POLICY "Users can view own tokens"
  ON public.auth_tokens
  FOR SELECT
  USING (auth.uid()::text = user_id::text);

-- Step 5: Update comments
COMMENT ON COLUMN public.auth_tokens.user_id IS 'מזהה משתמש (מורה או לקוח)';
```

---

## Files Changed

### New Files:
- ✅ `supabase/migrations/013_auth_tokens_fixed.sql` - Fixed migration

### Modified Files:
- ✅ `src/app/api/client-portal/auth/login\route.ts` - Added email verification check

---

## Testing After Fix

### Test 1: Client Signup with Email Verification
```bash
# Should work now without constraint violations
POST /api/client-portal/auth/signup
{
  "fullName": "Test User",
  "email": "test@example.com",
  "phone": "0501234567",
  "password": "Test1234"
}
```

### Test 2: Login with Unverified Email
```bash
# Should fail with: "אנא אמת את האימייל שלך לפני ההתחברות"
POST /api/client-portal/auth/login
{
  "email": "test@example.com",
  "password": "Test1234"
}
```

### Test 3: Login After Email Verification
```bash
# Should succeed after verifying email
POST /api/client-portal/auth/verify-email
{
  "token": "verification-token-here"
}

# Then login should work
POST /api/client-portal/auth/login
{
  "email": "test@example.com",
  "password": "Test1234"
}
```

---

## Summary

✅ **Bug 1 Fixed**: `auth_tokens` now uses generic `user_id` column  
✅ **Bug 2 Fixed**: Login now checks `email_verified` status  
✅ **Migration**: New migration file created  
✅ **Code**: Login endpoint updated  

All client portal functionality should now work correctly!

---

*Fix applied on 2026-06-03*
