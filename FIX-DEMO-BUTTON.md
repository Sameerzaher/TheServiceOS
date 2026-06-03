# תיקון מהיר - הכפתור "התחל דמו" לא עובד

## הבעיה
השגיאה: `Could not find the 'teacher_id' column of 'clients' in the schema cache`

**הסיבה**: הטבלאות בדאטהבייס חסרות את עמודת `teacher_id`.

---

## הפתרון (3 צעדים)

### צעד 1: הרץ מיגרציה ב-Supabase

1. פתח **Supabase Dashboard** → SQL Editor
2. העתק והרץ את הקובץ: **`supabase/COMPLETE-SCHEMA-FIX.sql`**
3. המתן לסיום (אמור לקחת כמה שניות)
4. ודא שאתה רואה: `✅ Schema migration completed!`

### צעד 2: צור Admin ראשון

פתח Console בדפדפן (F12) ב-`http://localhost:3000/login` והרץ:

```js
fetch('/api/auth/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@test.com',
    password: 'Admin123!',
    fullName: 'Admin User',
    businessName: 'My Business',
    phone: '0501234567',
    slug: 'my-business',
    businessType: 'driving_instructor',
    role: 'admin'
  })
}).then(r => r.json()).then(console.log);
```

אמור לראות: `{ ok: true, teacher: { email: "admin@test.com", ... } }`

### צעד 3: התחבר ובדוק

1. לך ל-`/login`
2. התחבר עם:
   - Email: `admin@test.com`
   - Password: `Admin123!`
3. אמור להיכנס ל-`/dashboard`
4. לחץ על "טען דמו" (אם הדשבורד ריק)

---

## בדיקה מהירה

אחרי המיגרציה, בדוק שהעמודות נוספו:

```sql
-- Run in Supabase SQL Editor
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'clients' 
AND column_name = 'teacher_id';
```

אם אתה רואה שורה עם `teacher_id | uuid` - המיגרציה עבדה ✅

---

## אם עדיין לא עובד

הרץ בקונסול:

```js
// Verify schema
fetch('/api/teachers').then(r => r.json()).then(console.log);
```

אם זה עובד (מחזיר רשימה) אבל הדמו עדיין נכשל, אז הבעיה היא בקוד ה-API של הדמו.

---

## מה קורה מאחורי הקלעים

1. **`/demo` page** → קורא ל-`POST /api/demo/load`
2. **`/api/demo/load`** → יוצר לקוחות ותורים דמו עם `teacher_id`
3. **Redirect** ל-`/dashboard` עם נתוני דמו מוכנים

הלוגים שהוספתי יראו לך בדיוק איפה זה נכשל.
