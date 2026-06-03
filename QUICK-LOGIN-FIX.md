# בדיקת התחברות - מדריך מהיר

## 🎯 השלבים:

### שלב 1: בדוק שהמיגרציה רצה
פתח **Supabase Dashboard** → **SQL Editor** והרץ:

```sql
-- בדוק שהטבלה teachers קיימת עם כל העמודות
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'teachers' 
AND table_schema = 'public'
ORDER BY ordinal_position;
```

**צריך לראות את העמודות הבאות:**
- id
- business_id
- full_name
- business_name
- phone
- slug
- business_type
- email ← **חשוב!**
- password_hash ← **חשוב!**
- role ← **חשוב!**
- is_active
- last_login_at
- created_at

---

### שלב 2: בדוק אם יש מורים
```sql
SELECT 
  id, 
  email, 
  full_name, 
  business_name,
  role, 
  is_active, 
  password_hash IS NOT NULL as has_password,
  LENGTH(password_hash) as password_length
FROM public.teachers
ORDER BY created_at DESC;
```

---

### שלב 3A: אם **אין** מורים - צור מורה אדמין

#### דרך 1: דרך הקונסול (מומלץ)
1. פתח http://localhost:3000
2. פתח Console (F12)
3. העתק והרץ את הקוד מ-`scripts/check-and-create-admin.js`

#### דרך 2: דרך SQL ישירות
```sql
-- החלף 'YOUR_BUSINESS_ID' ב-BUSINESS_ID שלך מ-.env.local
INSERT INTO public.teachers (
  id,
  business_id,
  full_name,
  business_name,
  phone,
  slug,
  business_type,
  email,
  password_hash,
  role,
  is_active,
  created_at
) VALUES (
  gen_random_uuid(),
  'YOUR_BUSINESS_ID',
  'Admin Teacher',
  'My Business',
  '050-0000000',
  'admin-teacher',
  'driving_instructor',
  'admin@test.com',
  'temporary', -- צריך להחליף בהאש אמיתי דרך API!
  'admin',
  true,
  now()
);
```

⚠️ **אזהרה:** SQL ישירות לא תיצור password hash נכון! השתמש בסקריפט הקונסול.

---

### שלב 3B: אם **יש** מורים אבל אין סיסמה

אם רשום `has_password: false`, צריך למחוק ולהפעיל מחדש:

```sql
-- מחק את המורה הישן
DELETE FROM public.teachers WHERE email = 'admin@test.com';

-- עכשיו הרץ את הסקריפט מהקונסול
```

---

### שלב 4: נסה התחברות

#### בדיקה מהירה מהקונסול:
1. פתח Console
2. הרץ את `scripts/test-login.js`
3. זה יראה לך בדיוק מה קורה

#### בדיקה רגילה:
1. לך ל-http://localhost:3000/login
2. הזן:
   - Email: `admin@test.com`
   - Password: `Admin123!`
3. לחץ "התחבר"

---

## 🐛 שגיאות נפוצות:

### "אימייל או סיסמה שגויים"
**גורמים אפשריים:**
- המייל לא קיים בדאטה-בייס
- הסיסמה שגויה
- `business_id` לא תואם (בדוק ב-.env.local)
- `password_hash` לא תקין

**פתרון:**
```sql
-- בדוק את ה-business_id
SELECT id, email, business_id, password_hash IS NOT NULL 
FROM public.teachers 
WHERE email = 'admin@test.com';
```

אם ה-`business_id` שונה מה-.env.local שלך:
```sql
-- עדכן (החלף YOUR_BUSINESS_ID)
UPDATE public.teachers 
SET business_id = 'YOUR_BUSINESS_ID'
WHERE email = 'admin@test.com';
```

---

### "יש להגדיר סיסמה למורה זה תחילה"
**בעיה:** `password_hash IS NULL`

**פתרון:**
1. מחק את המורה: `DELETE FROM public.teachers WHERE email = 'admin@test.com';`
2. צור מחדש דרך הסקריפט או `/api/auth/signup`

---

### "החשבון שלך אינו פעיל"
**בעיה:** `is_active = false`

**פתרון:**
```sql
UPDATE public.teachers 
SET is_active = true 
WHERE email = 'admin@test.com';
```

---

### Cookie לא נשמר
**בדיקה:**
1. Developer Tools → Application → Cookies
2. חפש `session_token`

**אם אין:**
- בדוק שהשרת רץ על localhost:3000
- נסה Incognito/Private window
- בדוק Console לשגיאות

---

## 🎯 Quick Fix - יצירת אדמין מהירה

אם שום דבר לא עובד, הרץ את זה ב-Supabase SQL Editor:

```sql
-- 1. מחק מורים ישנים (אופציונלי)
DELETE FROM public.sessions;
DELETE FROM public.teachers;

-- 2. בדוק מה ה-business_id שלך
-- פתח .env.local וחפש NEXT_PUBLIC_SUPABASE_BUSINESS_ID
-- או הרץ: SELECT DISTINCT business_id FROM public.clients;

-- 3. צור את ה-slug
-- עכשיו בדפדפן, פתח Console והרץ:
```

```javascript
fetch('/api/auth/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'sameerzaher@gmail.com',  // ← השתמש במייל שלך!
    password: 'Admin123!',            // ← שנה לסיסמה שלך!
    fullName: 'Sameer',
    businessName: 'Sameer Driving School',
    phone: '050-1234567',
    slug: 'sameer-driving',
    businessType: 'driving_instructor',
    role: 'admin'
  })
})
.then(r => r.json())
.then(console.log);
```

---

## ✅ אימות שהכל עובד:

### 1. בדוק ב-Supabase
```sql
SELECT email, full_name, role, is_active, 
       LENGTH(password_hash) as password_hash_length,
       created_at
FROM public.teachers 
ORDER BY created_at DESC 
LIMIT 5;
```

אמור להראות:
- `email`: המייל שהזנת
- `password_hash_length`: בערך 150-200 (אם 0 או NULL - בעיה!)
- `role`: admin
- `is_active`: true

### 2. נסה login מהקונסול
```javascript
// הרץ את scripts/test-login.js
// או ישירות:
fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@test.com',
    password: 'Admin123!'
  })
})
.then(r => r.json())
.then(console.log);
```

### 3. לך ל-/login ונסה
אם עובד תראה:
- הפניה אוטומטית ל-`/dashboard`
- שם המשתמש בראש העמוד
- כפתור "התנתק"

---

## 🆘 עדיין לא עובד?

הרץ את השאילתות האלה ב-Supabase:

```sql
-- 1. בדוק RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE tablename = 'teachers';

-- 2. בדוק sessions table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'sessions';

-- 3. בדוק אם יש sessions
SELECT * FROM public.sessions 
ORDER BY created_at DESC 
LIMIT 5;
```

ותגיד לי מה התוצאות!
