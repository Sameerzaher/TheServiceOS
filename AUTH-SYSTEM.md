# 🔐 מערכת Authentication ו-User Management

## סיכום

הוספתי מערכת authentication מלאה עם:
- ✅ Users & Roles (Admin / User)
- ✅ Multi-user per business
- ✅ Login / Signup / Logout
- ✅ Session management
- ✅ Password hashing (PBKDF2)
- ✅ User management UI
- ✅ Permissions & RLS

---

## 🗄️ Database Schema

### Tables נוספו:

#### 1. `users`
```sql
- id (UUID, primary key)
- business_id (UUID, foreign key)
- email (TEXT, unique)
- password_hash (TEXT)
- full_name (TEXT)
- phone (TEXT, nullable)
- role ('admin' | 'user')
- is_active (BOOLEAN)
- created_at, updated_at, last_login_at
```

#### 2. `user_teachers` (many-to-many)
```sql
- id (UUID, primary key)
- user_id (UUID, foreign key to users)
- teacher_id (UUID, foreign key to teachers)
- created_at
```

#### 3. `sessions`
```sql
- id (UUID, primary key)
- user_id (UUID, foreign key)
- token (TEXT, unique)
- expires_at (TIMESTAMP)
- created_at
- ip_address, user_agent
```

---

## 🔑 Roles & Permissions

### Admin Role
יכול:
- ✅ להוסיף משתמשים חדשים
- ✅ למחוק משתמשים
- ✅ לערוך משתמשים
- ✅ לשנות תפקידים
- ✅ לגשת לעמוד "משתמשים"

### User Role
יכול:
- ✅ להתחבר למערכת
- ✅ לגשת לדאשבורד
- ✅ לנהל לקוחות ותורים
- ❌ לא יכול לנהל משתמשים

---

## 📂 קבצים חדשים

### Database
- `supabase/migrations/011_users_auth.sql` - Schema + RLS policies

### Types
- `src/core/types/user.ts` - TypeScript types

### Auth Utils
- `src/lib/auth/passwordUtils.ts` - Password hashing & validation

### API Routes
- `src/app/api/auth/login/route.ts` - Login
- `src/app/api/auth/signup/route.ts` - Signup (create user)
- `src/app/api/auth/logout/route.ts` - Logout
- `src/app/api/auth/me/route.ts` - Get current user
- `src/app/api/users/route.ts` - List users (admin only)
- `src/app/api/users/[id]/route.ts` - Delete user (admin only)

### UI Components
- `src/features/auth/AuthContext.tsx` - Auth context & hooks
- `src/app/(app)/users/page.tsx` - User management page
- `src/app/(marketing)/login/page.tsx` - Login page (updated)
- `src/app/(marketing)/signup/page.tsx` - Signup page

---

## 🚀 איך להשתמש?

### 1. הרץ Migration
```bash
# Via Supabase Dashboard
1. פתח Supabase Dashboard → SQL Editor
2. העתק את התוכן של supabase/migrations/011_users_auth.sql
3. Run
4. Settings → API → "Restart server"
```

### 2. צור Admin User ראשון
```sql
-- Run in Supabase SQL Editor
SELECT create_first_admin_user(
  'YOUR_BUSINESS_ID'::uuid,
  'admin@example.com',
  -- Password hash for "Admin123!" (example - CHANGE THIS!)
  'YOUR_PASSWORD_HASH',
  'Admin User',
  '050-0000000'
);
```

**או** השתמש ב-API:
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Admin123!",
    "fullName": "Admin User",
    "phone": "050-0000000",
    "role": "admin",
    "teacherIds": ["YOUR_TEACHER_ID"]
  }'
```

### 3. התחבר
1. גש ל-http://localhost:3000/login
2. הכנס email + password
3. תנותב לדאשבורד

### 4. הוסף משתמשים
1. התחבר כ-Admin
2. גש ל-"/users"
3. לחץ "+ הוסף משתמש חדש"
4. מלא פרטים:
   - שם מלא
   - אימייל
   - סיסמה (8+ תווים, אות גדולה/קטנה, מספר)
   - תפקיד (Admin / User)
5. שמור

---

## 🔒 Security Features

### Password Hashing
- **Algorithm**: PBKDF2
- **Iterations**: 100,000
- **Salt**: 32 bytes random
- **Key length**: 64 bytes
- **Digest**: SHA-512

### Password Requirements
- לפחות 8 תווים
- לפחות אות גדולה אחת
- לפחות אות קטנה אחת
- לפחות ספרה אחת

### Session Management
- **Cookies**: HTTP-only, Secure (in production)
- **Expiry**: 30 days
- **Token**: 32 bytes random hex

### RLS (Row Level Security)
- Users can only see users in their business
- Only admins can create/update/delete users
- Sessions are user-scoped
- Service role bypasses all policies

---

## 📋 API Endpoints

### POST `/api/auth/login`
**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "user": { ... },
    "teachers": ["teacher-id-1", "teacher-id-2"],
    "token": "session-token"
  }
}
```

### POST `/api/auth/signup`
**Body:**
```json
{
  "email": "newuser@example.com",
  "password": "NewPassword123!",
  "fullName": "New User",
  "phone": "050-1234567",
  "role": "user",
  "teacherIds": ["teacher-id"]
}
```

### POST `/api/auth/logout`
No body. Deletes session.

### GET `/api/auth/me`
Returns current authenticated user or 401.

### GET `/api/users` (Admin only)
Returns list of all users in business.

### DELETE `/api/users/:id` (Admin only)
Deletes user by ID.

---

## 🎯 React Hooks

### `useAuth()`
```tsx
const { user, isAuthenticated, isAdmin, login, logout } = useAuth();
```

### `useRequireAuth()`
```tsx
// Redirects to /login if not authenticated
const auth = useRequireAuth();
```

### `useRequireAdmin()`
```tsx
// Redirects to /dashboard if not admin
const auth = useRequireAdmin();
```

---

## 🧪 Testing

### Test Flow:
1. **Signup**
   - POST `/api/auth/signup` with admin role
   - Verify user created
   - Verify can login

2. **Login**
   - POST `/api/auth/login`
   - Verify session cookie set
   - Verify redirected to dashboard

3. **User Management**
   - Login as admin
   - Go to `/users`
   - Add new user (role: user)
   - Verify user appears in list
   - Delete user
   - Verify user removed

4. **Permissions**
   - Login as non-admin user
   - Try to access `/users` → should redirect
   - Try to call `/api/users` → should fail

---

## 🚨 חשוב!

### לפני Production:
1. **שנה את secret keys** - אל תשתמש ב-defaults
2. **הפעל HTTPS** - Secure cookies require HTTPS
3. **הגדר CORS** - הגבל origins
4. **Rate limiting** - על login endpoint
5. **Email verification** - אמת אימיילים חדשים
6. **2FA** - שקול הוספת two-factor auth
7. **Password reset** - הוסף "שכחתי סיסמה"
8. **Audit logs** - תעד פעולות admin

### Environment Variables:
```env
# .env.local
NEXTAUTH_SECRET=your-secret-here
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

---

## 🎉 סיימתי!

המערכת כוללת:
- ✅ Authentication מלא
- ✅ User management
- ✅ Roles & Permissions
- ✅ Secure password hashing
- ✅ Session management
- ✅ Admin UI
- ✅ RLS policies

**כל משתמש יכול להתחבר עם האימייל והסיסמה שלו, ואדמינים יכולים לנהל משתמשים!** 🚀
