# 🔐 מערכת Authentication - מורים = משתמשים

## הקונספט החדש

**מורה = משתמש**
- כל מורה הוא משתמש במערכת
- אין טבלת users נפרדת
- מורה מתחבר עם email + password
- יש תפקידים: Admin / User רגיל

---

## 🗄️ Database Schema

### שדות חדשים ב-`teachers`:
```sql
- email (TEXT, unique) - לאימות
- password_hash (TEXT) - PBKDF2 hash
- role ('admin' | 'user') - הרשאות
- is_active (BOOLEAN) - האם פעיל
- last_login_at (TIMESTAMP) - התחברות אחרונה
```

### טבלה: `sessions`
```sql
- id (UUID)
- teacher_id (UUID, FK to teachers)
- token (TEXT, unique)
- expires_at (TIMESTAMP)
- ip_address, user_agent
```

---

## 🚀 התחלה מהירה

### 1. הרץ Migration
```bash
# Supabase Dashboard → SQL Editor
# Copy: supabase/migrations/011_teacher_auth_simple.sql
# Run + Restart server
```

### 2. צור Admin Teacher
```bash
# Console (F12) on http://localhost:3000
fetch('/api/auth/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@test.com',
    password: 'Admin123!',
    fullName: 'Admin Teacher',
    businessName: 'My Business',
    phone: '050-0000000',
    slug: 'admin-teacher',
    businessType: 'driving_instructor',
    role: 'admin'
  })
}).then(r => r.json()).then(console.log)
```

### 3. התחבר
1. גש ל-http://localhost:3000/login
2. Email: `admin@test.com`
3. Password: `Admin123!`
4. תועבר לדאשבורד

---

## 🔑 Roles

### Admin
- יכול לנהל מורים אחרים
- יכול לשנות הגדרות
- גישה מלאה

### User (Regular Teacher)
- יכול לנהל לקוחות ותורים שלו
- לא יכול לנהל מורים אחרים

---

## 📋 API Endpoints

### POST `/api/auth/login`
```json
{
  "email": "teacher@example.com",
  "password": "password123"
}
```

### POST `/api/auth/signup`
```json
{
  "email": "new@example.com",
  "password": "NewPass123!",
  "fullName": "Teacher Name",
  "businessName": "Business Name",
  "phone": "050-0000000",
  "slug": "teacher-slug",
  "businessType": "driving_instructor",
  "role": "user"
}
```

### GET `/api/auth/me`
Returns current teacher or 401

### POST `/api/auth/logout`
Logs out and clears session

---

## 🎯 React Hooks

### `useAuth()`
```tsx
const { teacher, isAuthenticated, isAdmin, login, logout } = useAuth();
```

### `useRequireAuth()`
```tsx
const auth = useRequireAuth(); // Redirects to /login if not authenticated
```

### `useRequireAdmin()`
```tsx
const auth = useRequireAdmin(); // Redirects if not admin
```

---

## 🔒 Security

### Password Requirements
- לפחות 8 תווים
- אות גדולה + קטנה + מספר

### Session
- 30 days expiry
- HTTP-only cookies
- Secure in production

### RLS Policies
- Teachers can see all teachers in business (for switching)
- Only admins can modify other teachers
- Sessions are teacher-scoped

---

## 🎉 מה השתנה מהגרסה הקודמת?

### לפני:
- טבלת `users` נפרדת
- טבלת `user_teachers` (many-to-many)
- מורים ומשתמשים היו ישויות שונות

### עכשיו:
- ✅ מורים = משתמשים
- ✅ שדות auth ישירות ב-`teachers`
- ✅ פשוט יותר!
- ✅ כל מורה מתחבר עם email/password
- ✅ מורה admin יכול להוסיף מורים נוספים

---

## 📊 Use Cases

### תרחיש 1: בית ספר לנהיגה עם מספר מורים
- מורה ראשי = Admin
- מורים נוספים = Users
- כל מורה מתחבר עם האימייל שלו
- כל מורה רואה רק את הלקוחות והתורים שלו

### תרחיש 2: מורה יחיד
- מתחבר עם email/password
- אין צורך במורים נוספים

### תרחיש 3: רשת בתי ספר
- Admin ברמת העסק
- מנהל מורים מרובים
- כל מורה גישה נפרדת

---

**המערכת מוכנה!** כל מורה = משתמש 🚀
