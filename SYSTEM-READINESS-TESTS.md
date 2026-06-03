# System Readiness Tests

## Pre-Flight Checks

### 1. Database Migration Status
```sql
-- Run in Supabase SQL Editor
SELECT 
  table_name, 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name IN ('teachers', 'clients', 'appointments', 'sessions')
ORDER BY table_name, ordinal_position;
```

Expected results:
- `teachers` table has: `email`, `password_hash`, `role`, `is_active`, `last_login_at`, `business_type`
- `clients` table has: `teacher_id`
- `appointments` table has: `teacher_id`
- `sessions` table has: `teacher_id`, `token`, `expires_at`

---

## Test 1: First Admin Creation

### Steps:
1. Open browser DevTools Console (F12)
2. Navigate to `/login`
3. Paste and run this script:

```js
// Check and create admin if needed
fetch('/api/teachers', { method: 'GET' })
  .then(r => r.json())
  .then(result => {
    console.log('=== Teachers in DB ===');
    if (!result.teachers || result.teachers.length === 0) {
      console.log('❌ No teachers found. Creating first admin...');
      return fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@test.com',
          password: 'Admin123!',
          fullName: 'Admin User',
          businessName: 'Test Business',
          phone: '0501234567',
          slug: 'admin-test',
          businessType: 'driving_instructor',
          role: 'admin'
        })
      }).then(r => r.json()).then(createResult => {
        console.log('✅ Admin created:', createResult);
      });
    }
    
    result.teachers.forEach(t => {
      console.log(`${t.role === 'admin' ? '👑' : '👤'} ${t.email} | ${t.businessName} | ${t.hasPassword ? '🔒' : '❌ No password'}`);
    });
  });
```

### Expected Output:
```
✅ Admin created: { ok: true, teacher: { id: "...", email: "admin@test.com", role: "admin" } }
```

### Console Logs to Verify:
```
[auth/signup] Starting signup process
[auth/signup] Request data: { email: "admin@test.com", ... }
[auth/signup] Business ID: ...
[auth/signup] Hashing password...
[auth/signup] Creating teacher with id: ...
[auth/signup] SUCCESS - Teacher created: { id: "...", email: "admin@test.com", role: "admin" }
```

---

## Test 2: Login Flow

### Steps:
1. Open `/login`
2. Enter credentials:
   - Email: `admin@test.com`
   - Password: `Admin123!`
3. Click "התחבר"

### Expected Behavior:
- Form shows loading state
- Redirects to `/dashboard`
- No errors in console

### Console Logs to Verify:
```
[AuthContext] Login attempt: admin@test.com
[auth/login] Starting login attempt
[auth/login] Login attempt for email: admin@test.com
[auth/login] Found teacher: { id: "...", email: "admin@test.com", role: "admin" }
[auth/login] Verifying password...
[auth/login] Password verified successfully
[auth/login] Creating session...
[auth/login] Session created successfully
[auth/login] Cookie set successfully
[auth/login] SUCCESS - Login complete for: { id: "...", email: "admin@test.com", role: "admin" }
[AuthContext] Login successful, redirecting to dashboard
```

---

## Test 3: Authenticated Redirect

### Steps:
1. While logged in, try to navigate to `/login`
2. Should automatically redirect to `/dashboard`

### Console Logs to Verify:
```
[AuthContext] Refreshing teacher auth state
[auth/me] Checking authentication
[auth/me] Session token found, validating...
[auth/me] Session valid, fetching teacher: ...
[auth/me] Teacher found: { id: "...", email: "...", role: "admin" }
[auth/me] SUCCESS - Auth check passed
[AuthContext] Teacher authenticated: { id: "...", email: "..." }
```

### Steps (Unauthenticated):
1. Clear cookies or logout
2. Try to navigate to `/dashboard`
3. Should redirect to `/login`

### Console Logs to Verify:
```
[AppLayout] Auth check: { isAuthenticated: false, isLoading: false }
[AppLayout] Not authenticated, redirecting to /login
```

---

## Test 4: Teacher Data Isolation

### Setup:
Create 2 teachers with different business types:

```js
// Create Teacher 1
fetch('/api/auth/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'sameer@driving.com',
    password: 'Test123!',
    fullName: 'Sameer Cohen',
    businessName: 'Sameer Driving School',
    phone: '0501111111',
    slug: 'sameer-driving',
    businessType: 'driving_instructor',
    role: 'user'
  })
}).then(r => r.json()).then(console.log);

// Create Teacher 2
fetch('/api/auth/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'avi@clinic.com',
    password: 'Test123!',
    fullName: 'Dr. Avi Levi',
    businessName: 'Dr. Avi Cosmetic Clinic',
    phone: '0502222222',
    slug: 'dr-avi-clinic',
    businessType: 'cosmetic_clinic',
    role: 'user'
  })
}).then(r => r.json()).then(console.log);
```

### Test Steps:
1. Login as Teacher 1
2. Add a client (e.g., "David Test")
3. Add an appointment for this client
4. Logout and login as Teacher 2
5. Verify Teacher 2 sees **zero** clients and appointments
6. Add a client (e.g., "Sarah Test") for Teacher 2
7. Logout and login as Teacher 1
8. Verify Teacher 1 still sees only "David Test"

### Console Logs to Verify:
```
[clients/get] Fetching clients for: { businessId: "...", teacherId: "teacher1-id" }
[clients/get] SUCCESS - Returned 1 clients for teacher: teacher1-id

[clients/get] Fetching clients for: { businessId: "...", teacherId: "teacher2-id" }
[clients/get] SUCCESS - Returned 0 clients for teacher: teacher2-id
```

### Database Verification:
```sql
SELECT 
  c.id, 
  c.full_name, 
  c.teacher_id,
  t.business_name
FROM clients c
JOIN teachers t ON c.teacher_id = t.id
ORDER BY t.business_name, c.full_name;
```

Should show clients grouped correctly by teacher.

---

## Test 5: Unique Public Booking Links

### Steps:
1. Go to `/teachers` in the dashboard
2. Verify each teacher shows a unique booking URL:
   - Teacher 1: `https://yourapp.com/book/sameer-driving`
   - Teacher 2: `https://yourapp.com/book/dr-avi-clinic`
3. Open Teacher 1's link in incognito window
4. Verify it shows "Sameer Driving School"
5. Open Teacher 2's link in a different incognito window
6. Verify it shows "Dr. Avi Cosmetic Clinic"

### Console Logs to Verify:
```
[PublicBooking] Loading booking page for slug: sameer-driving
[public-booking/bootstrap] Request for slug: sameer-driving
[public-booking/bootstrap] Normalized slug: sameer-driving
[public-booking/bootstrap] Teacher found: { id: "...", slug: "sameer-driving", businessName: "Sameer Driving School" }
[public-booking/bootstrap] SUCCESS - Returning data for: sameer-driving
[PublicBooking] SUCCESS - Loaded for teacher: { teacherId: "...", businessType: "driving_instructor", businessName: "Sameer Driving School" }
```

---

## Test 6: Public Booking Submission

### Steps:
1. Open `/book/sameer-driving` in incognito
2. Fill the form and submit
3. Login as Teacher 1 (Sameer)
4. Go to Dashboard
5. Verify the booking appears in "בקשות הזמנה"
6. Go to Clients page
7. Verify the client was created

### Console Logs to Verify:
```
[public-booking] New booking request from IP: ...
[public-booking] Parsed booking: { teacherId: "teacher1-id", fullName: "...", phone: "...", slotStart: "...", slotEnd: "..." }
[public-booking] Checking for existing client by phone: ...
[public-booking] Creating new client: ...
[public-booking] Client created successfully
[public-booking] Creating appointment: ...
[public-booking] SUCCESS - Booking created: { appointmentId: "...", clientId: "...", teacherId: "teacher1-id" }
```

### Verification (as Teacher 2):
1. Login as Teacher 2
2. Verify Teacher 2 does NOT see the booking from Teacher 1

---

## Test 7: Cross-Business Data Leakage

### Critical Paths to Test:

#### A. Client API Isolation
```js
// While logged in as Teacher 1, try to fetch with Teacher 2's ID
const teacher2Id = 'paste-teacher2-uuid-here';

fetch(`/api/clients`, {
  headers: { 'x-teacher-id': teacher2Id }
}).then(r => r.json()).then(result => {
  console.log('Teacher 2 clients:', result.clients);
  // Should be EMPTY if Teacher 1 hasn't created clients for Teacher 2
});
```

#### B. Appointments API Isolation
```js
fetch(`/api/appointments`, {
  headers: { 'x-teacher-id': teacher2Id }
}).then(r => r.json()).then(result => {
  console.log('Teacher 2 appointments:', result.appointments);
  // Should be EMPTY or only show Teacher 2's data
});
```

#### C. Settings API Isolation
```js
fetch(`/api/settings`, {
  headers: { 'x-teacher-id': teacher2Id }
}).then(r => r.json()).then(result => {
  console.log('Teacher 2 settings:', result.settings);
  // Should return Teacher 2's settings, not Teacher 1's
});
```

### Expected Behavior:
- All APIs respect `x-teacher-id` header
- Each teacher sees ONLY their own data
- No data leakage across teachers

### Console Logs Pattern:
```
[clients/get] Fetching clients for: { businessId: "...", teacherId: "correct-teacher-id" }
[appointments/get] Fetching appointments for: { businessId: "...", teacherId: "correct-teacher-id" }
[settings/get] Loading settings for: { businessId: "...", teacherId: "correct-teacher-id" }
```

---

## Test 8: Teacher Switcher (Dashboard)

### Steps:
1. Login as admin
2. Go to `/dashboard`
3. Click the teacher switcher dropdown (top of page)
4. Switch to a different teacher
5. Verify all data reloads correctly
6. Verify public booking URL preview updates

### Console Logs to Verify:
```
[DashboardTeacherContext] Switching teacher to: teacher2-id
[resolveTeacherId] Using fallback default: teacher2-id
[clients/get] Fetching clients for: { businessId: "...", teacherId: "teacher2-id" }
[appointments/get] Fetching appointments for: { businessId: "...", teacherId: "teacher2-id" }
[settings/get] Loading settings for: { businessId: "...", teacherId: "teacher2-id" }
```

---

## RLS Policy Verification

### Run in Supabase SQL Editor:
```sql
-- Check clients RLS
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('clients', 'appointments', 'teachers', 'sessions', 'serviceos_app_settings')
ORDER BY tablename, policyname;
```

### Expected Policies:
- `clients`: Policies filter by `teacher_id` AND `business_id`
- `appointments`: Policies filter by `teacher_id` AND `business_id`
- `teachers`: Read allowed for same business, write restricted to admin or self
- `sessions`: Only accessible to authenticated users for their own sessions
- `serviceos_app_settings`: Scoped by `tenant_id` (which maps to `teacherId`)

---

## Final Verification Script

Run this in browser console after completing all tests:

```js
async function verifySystemReadiness() {
  console.log('🔍 Starting System Readiness Check...\n');
  
  // 1. Check teachers
  const teachersRes = await fetch('/api/teachers');
  const teachers = await teachersRes.json();
  console.log('✅ Teachers API:', teachers.ok ? `${teachers.teachers?.length} teachers` : '❌ Failed');
  
  // 2. Check current auth
  const meRes = await fetch('/api/auth/me');
  const me = await meRes.json();
  console.log('✅ Auth Check:', me.ok ? `Logged in as ${me.data.teacher.email}` : '❌ Not authenticated');
  
  // 3. Check clients
  const clientsRes = await fetch('/api/clients');
  const clients = await clientsRes.json();
  console.log('✅ Clients API:', clients.ok ? `${clients.clients?.length} clients` : '❌ Failed');
  
  // 4. Check appointments
  const apptRes = await fetch('/api/appointments');
  const appts = await apptRes.json();
  console.log('✅ Appointments API:', appts.ok ? `${appts.appointments?.length} appointments` : '❌ Failed');
  
  // 5. Check settings
  const settingsRes = await fetch('/api/settings');
  const settings = await settingsRes.json();
  console.log('✅ Settings API:', settings.ok ? `Loaded for ${settings.teacherSlug || 'unknown'}` : '❌ Failed');
  
  console.log('\n🎉 System Readiness Check Complete!');
}

verifySystemReadiness();
```

---

## Known Issues to Watch For

### Issue: "Column does not exist"
**Symptom**: `42703 column "teacher_id" does not exist`
**Solution**: Run migration `007_teacher_business_type.sql` or `011_teacher_auth_clean.sql`

### Issue: Login fails silently
**Symptom**: No redirect after login, no error shown
**Solution**: Check Console for `[auth/login]` logs. Verify password hash exists in DB.

### Issue: Data from wrong teacher appears
**Symptom**: Switching teachers shows stale data
**Solution**: 
- Check `[resolveTeacherId]` logs to verify correct teacher ID
- Verify `x-teacher-id` header is being sent
- Check that APIs filter by `teacher_id`

### Issue: Public booking fails
**Symptom**: Booking form submission returns error
**Solution**: 
- Check `[public-booking]` logs for teacher resolution
- Verify slug exists in `teachers` table
- Check `business_type` and availability settings

---

## Success Criteria

All tests pass when:
- ✅ First admin can be created via signup API
- ✅ Login redirects to dashboard with valid session
- ✅ Unauthenticated users redirected to `/login`
- ✅ Each teacher sees only their own clients/appointments/settings
- ✅ Each teacher has unique `/book/[slug]` URL
- ✅ Public bookings correctly associate with teacher by slug
- ✅ Teacher switcher changes data scope correctly
- ✅ Console logs show correct teacher IDs at every API call
- ✅ No TypeScript errors (`npx tsc --noEmit`)
- ✅ No console errors during normal operation

---

## Quick Debug Commands

```bash
# TypeScript check
npx tsc --noEmit

# Check migration status
# (Run in Supabase SQL Editor)
SELECT version FROM schema_migrations ORDER BY version DESC LIMIT 5;

# Verify teachers exist
# (Run in Supabase SQL Editor)
SELECT id, email, business_name, slug, business_type, role, is_active, password_hash IS NOT NULL as has_password
FROM public.teachers;

# Check sessions
# (Run in Supabase SQL Editor)
SELECT teacher_id, expires_at > NOW() as is_valid, created_at 
FROM public.sessions 
ORDER BY created_at DESC LIMIT 5;
```
