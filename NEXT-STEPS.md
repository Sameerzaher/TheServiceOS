# 🎯 הוראות שימוש - תור פה

## המצב עכשיו:

✅ **מוצר שיווקי מלא** - Landing, Pricing, Help, Demo
✅ **Multi-tenant** - מורים מרובים, data מבודד
✅ **Business Types** - מורה נהיגה / מרפאה קוסמטית
✅ **Authentication** - כל מורה = משתמש עם email/password

---

## 🚀 התחלה מהירה (3 שלבים)

### שלב 1: הרץ Migration

```bash
1. פתח Supabase Dashboard
2. SQL Editor
3. העתק את: supabase/migrations/011_teacher_auth_clean.sql
4. Run
5. Settings → API → "Restart server" ⚠️ חובה!
```

### שלב 2: צור Admin Teacher ראשון

פתח Console (F12) ב-http://localhost:3000 והרץ:

```javascript
fetch('/api/auth/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'sameer@test.com',
    password: 'Sameer123!',
    fullName: 'Sameer Zaher',
    businessName: 'Sameer Driving',
    phone: '050-1234567',
    slug: 'sameer-driving',
    businessType: 'driving_instructor',
    role: 'admin'
  })
}).then(r => r.json()).then(console.log)
```

### שלב 3: התחבר!

1. גש ל-http://localhost:3000/login
2. **Email**: `sameer@test.com`
3. **Password**: `Sameer123!`
4. לחץ "התחבר"
5. תגיע ל-`/dashboard` 🎉

---

## 📋 מה אפשר לעשות?

### 1. הוסף מורה/עסק נוסף
1. לך ל-`/teachers`
2. לחץ "+ הוסף מורה/עסק חדש"
3. **מלא את כל השדות**:
   - ✅ שם העסק
   - ✅ שם המורה
   - ✅ טלפון
   - ✅ Slug (כתובת ייחודית)
   - ✅ **אימייל** (חדש!)
   - ✅ **סיסמה** (חדש! - 8+ תווים, אות גדולה/קטנה/מספר)
   - ✅ **תפקיד** (חדש! - Admin או משתמש רגיל)
   - ✅ סוג העסק

לדוגמא - Dr Avi Clinic:
```
Email: avi@clinic.com
Password: DrAvi123!
Full Name: Dr Avi Cohen
Business Name: Dr Avi Clinic
Slug: dr-avi-clinic
Business Type: מרפאה קוסמטית 💉
Role: משתמש רגיל
```

### 2. החלף בין מורים
- בראש הדף יש dropdown
- בחר מורה אחר
- Toast יודיע שהחלפת
- כל הנתונים (לקוחות/תורים) משתנים

### 3. נהל לקוחות ותורים
- `/clients` - לקוחות
- `/appointments` - תורים
- כל מורה רואה רק את שלו!

### 4. שתף דף הזמנה
- `/booking` - ראה את הקישור שלך
- העתק ושתף: `/book/[slug]`
- לקוחות יכולים לקבוע תורים בעצמם

---

## 🔐 Roles - מה ההבדל?

### Admin (אדמין)
- ✅ יכול להוסיף מורים חדשים
- ✅ יכול למחוק מורים
- ✅ יכול לערוך הגדרות של כולם
- ✅ גישה מלאה

### User (משתמש רגיל)
- ✅ יכול לנהל את הלקוחות שלו
- ✅ יכול לנהל את התורים שלו
- ✅ יכול לשנות את ההגדרות שלו
- ❌ לא יכול להוסיף/למחוק מורים אחרים

---

## 💡 תרחישים נפוצים

### תרחיש 1: בית ספר עם מספר מורים
```
1. צור מורה ראשי (Admin) - "Sameer Driving"
2. הוסף מורה נוסף (User) - "David Levi"
3. כל מורה מתחבר עם האימייל שלו
4. כל מורה רואה רק את הלקוחות והתורים שלו
5. מורה ראשי יכול לנהל את כולם
```

### תרחיש 2: מורה יחיד
```
1. צור מורה אחד (Admin או User - לא משנה)
2. עבוד רגיל
3. אין צורך במורים נוספים
```

### תרחיש 3: 2 עסקים שונים
```
1. צור "Sameer Driving" (מורה נהיגה)
2. צור "Dr Avi Clinic" (מרפאה קוסמטית)
3. החלף ביניהם מה-dropdown
4. כל אחד עם UI, לקוחות ותורים נפרדים
```

---

## 🔧 טיפים חשובים

### דרישות סיסמה
- **מינימום**: 8 תווים
- **חובה**: אות גדולה (A-Z)
- **חובה**: אות קטנה (a-z)
- **חובה**: מספר (0-9)

דוגמאות תקינות:
- ✅ `Admin123!`
- ✅ `Sameer2024`
- ✅ `DrAvi123`

דוגמאות לא תקינות:
- ❌ `admin123` (אין אות גדולה)
- ❌ `Admin` (קצר מדי)
- ❌ `ADMIN123` (אין אות קטנה)

### Email ייחודי
- כל מורה חייב אימייל ייחודי
- אי אפשר 2 מורים עם אותו אימייל

### Slug ייחודי
- כל מורה חייב slug ייחודי
- הוא ישמש בכתובת: `/book/[slug]`

---

## 🐛 פתרון בעיות

### "Column teacher_id does not exist"
→ **תמיד** הרץ Migration + Restart server ב-Supabase

### "Cannot find module users/page"
→ נקה `.next` folder:
```bash
Remove-Item ".next" -Recurse -Force
npm run dev
```

### לא יכול להוסיף מורה
→ ודא שמילאת Email + Password עם דרישות חוזקה

### לא רואה Teacher Switcher
→ צריך לפחות 2 מורים במערכת

---

## 🎯 הצעד הבא שלך:

### 1. הרץ Migration (אם עוד לא)
```
File: 011_teacher_auth_clean.sql
```

### 2. צור Admin ב-Console
```javascript
// Copy from above
```

### 3. התחבר ב-/login

### 4. הוסף מורה שני ב-/teachers

### 5. החלף ביניהם והתחל לעבוד!

---

**עכשיו הטופס כולל את כל השדות: Email, Password ו-Role!** ✅

רענן את הדף ונסה שוב 🚀
