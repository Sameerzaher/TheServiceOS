# 🚀 התחלה מהירה - Authentication Setup

## שלב 1: הרץ את ה-Migration

```bash
# Option A: Via Supabase Dashboard (מומלץ)
1. פתח Supabase Dashboard → SQL Editor
2. העתק את התוכן של: supabase/migrations/011_users_auth.sql
3. לחץ "Run"
4. לך ל-Settings → API → לחץ "Restart server"
```

## שלב 2: צור Admin User ראשון

### אופציה A: דרך הדפדפן (הכי קל!)

1. פתח http://localhost:3000 בדפדפן
2. פתח Developer Console (F12)
3. העתק והדבק את הקוד מ-`scripts/create-first-admin.js`
4. הקוד יעשה:
   - ימצא את ה-teacher_id שלך אוטומטית
   - ייצור admin user עם:
     - 📧 Email: `admin@test.com`
     - 🔑 Password: `Admin123!`

### אופציה B: API Call ידני

```bash
# קבל teacher ID
curl http://localhost:3000/api/teachers

# צור admin (החלף YOUR_TEACHER_ID)
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "Admin123!",
    "fullName": "Admin User",
    "phone": "050-0000000",
    "role": "admin",
    "teacherIds": ["YOUR_TEACHER_ID"]
  }'
```

## שלב 3: התחבר!

1. גש ל-http://localhost:3000/login
2. הכנס:
   - Email: `admin@test.com`
   - Password: `Admin123!`
3. תועבר לדאשבורד 🎉

## שלב 4: הוסף משתמשים נוספים

1. בדאשבורד, לחץ על "משתמשים" בתפריט
2. לחץ "+ הוסף משתמש חדש"
3. מלא פרטים:
   - שם מלא
   - אימייל
   - סיסמה (דרישות: 8+ תווים, אות גדולה, קטנה, ומספר)
   - תפקיד: Admin או User
4. שמור

---

## 📋 מה יש לנו?

### Pages
- `/login` - התחברות
- `/signup` - הרשמה
- `/users` - ניהול משתמשים (admin בלבד - בקרוב)
- `/dashboard` - דאשבורד

### Roles
- **Admin** - יכול להוסיף/למחוק משתמשים
- **User** - גישה רגילה למערכת

### Security
- 🔒 Password hashing (PBKDF2)
- 🍪 HTTP-only session cookies
- 🛡️ RLS policies
- ✅ Password validation

---

## ⚠️ חשוב!

### לפני Production:
1. **שנה credentials** - אל תשאיר `admin@test.com`
2. **הפעל HTTPS** - חובה לcookies מאובטחים
3. **הגדר rate limiting** - על login endpoint
4. **Email verification** - אמת אימיילים
5. **2FA** - שקול two-factor authentication

### Password Requirements:
- לפחות 8 תווים
- לפחות אות גדולה אחת (A-Z)
- לפחות אות קטנה אחת (a-z)
- לפחות ספרה אחת (0-9)

---

## 🐛 Troubleshooting

### "User not found" בהתחברות
→ ודא שהרצת את migration 011 ו-restart את PostgREST

### "Schema cache" שגיאות
→ Supabase Dashboard → Settings → API → "Restart server"

### "No teachers found"
→ ודא שיש לפחות teacher אחד ב-`public.teachers`

### לא יכול לגשת ל-`/users`
→ ודא שהתחברת כ-admin

---

## 📚 מסמכים נוספים

- **`AUTH-SYSTEM.md`** - מדריך טכני מפורט
- **`PRODUCT-READY.md`** - סקירה כללית של המוצר

---

**המערכת מוכנה לשימוש!** 🚀
