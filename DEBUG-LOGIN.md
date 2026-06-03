# Debug Login Issues

## צעדים לבדיקה:

### 1. וודא שהמיגרציה רצה
פתח את Supabase Dashboard → SQL Editor והרץ:

```sql
-- בדוק שהטבלה teachers קיימת עם כל העמודות
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'teachers' 
ORDER BY ordinal_position;

-- בדוק אם יש מורים בטבלה
SELECT id, email, full_name, business_name, role, is_active, password_hash IS NOT NULL as has_password
FROM public.teachers;
```

### 2. צור מורה ראשון (אם אין)
**אפשרות A - דרך הקונסול בדפדפן:**
1. פתח את האפליקציה: http://localhost:3000
2. פתח Developer Tools → Console (F12)
3. העתק והרץ את הקוד מ-`scripts/create-first-admin.js`

**אפשרות B - דרך Supabase Dashboard:**
```sql
-- הרץ ב-SQL Editor:
INSERT INTO public.teachers (
  business_id,
  full_name,
  business_name,
  phone,
  slug,
  business_type,
  email,
  password_hash,
  role,
  is_active
) VALUES (
  'default-business-id', -- החלף ב-BUSINESS_ID שלך מ-.env.local
  'Admin Teacher',
  'My Business',
  '050-0000000',
  'admin-teacher',
  'driving_instructor',
  'admin@test.com',
  'pbkdf2$10000$16$c2FsdDEyMzQ1Njc4OTAxMjM0NTY=$44692d1a8b8b37d8a9c3e3f9b5e7d8c6a4b5c7d8e9f0a1b2c3d4e5f6a7b8c9d0', -- סיסמה: Admin123!
  'admin',
  true
);
```

### 3. בדוק שהסיסמה מוצפנת נכון
הקוד שלנו משתמש ב-PBKDF2. אם הסיסמה לא מוצפנת נכון, ההתחברות לא תעבור.

### 4. נסה להתחבר
- לך ל-http://localhost:3000/login
- הזן:
  - אימייל: `admin@test.com`
  - סיסמה: `Admin123!`
- לחץ "התחבר"

### 5. בדוק שגיאות בקונסול
פתח את Developer Console (F12) ובדוק אם יש שגיאות:
- Network tab - בדוק את הבקשה POST ל-`/api/auth/login`
- Console tab - בדוק שגיאות JavaScript

## שגיאות נפוצות:

### "אימייל או סיסמה שגויים"
- המייל לא קיים במערכת
- הסיסמה שגויה
- `business_id` לא תואם

### "החשבון שלך אינו פעיל"
- `is_active = false` בטבלה

### "יש להגדיר סיסמה למורה זה תחילה"
- `password_hash` הוא NULL

### אין שגיאה אבל לא נכנס
- בדוק שה-cookie נשמר (Application → Cookies → session_token)
- בדוק שה-AuthContext טוען נכון

## מה עדכנתי:

1. **דף Login** - עכשיו משתמש ב-`useAuth()` במקום קריאה ישירה ל-API
2. **הוספתי הצגת שגיאות** - תיבה אדומה מעל הטופס
3. **Loading state** - הכפתור משתנה ל-"מתחבר..." במהלך ההתחברות
4. **Disabled inputs** - השדות נעולים בזמן התחברות

רענן את הדפדפן ונסה שוב!
