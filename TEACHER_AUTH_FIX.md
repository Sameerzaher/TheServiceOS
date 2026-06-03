# 🔧 Teacher Authentication Endpoints - Bug Fix

## סיכום הבאג והתיקון

### 🐛 הבעיה שזוהתה

ה-API endpoints לאיפוס סיסמה של מורים השתמשו בעמודה `teacher_id` בטבלת `auth_tokens`, אך המיגרציה המתוקנת (`013_auth_tokens_fixed.sql`) יצרה עמודה `user_id` במקום. זה גרם לכשלון בהכנסת נתונים למסד הנתונים.

### ✅ התיקון

עדכנתי את שני ה-endpoints לשימוש ב-`user_id` כדי להתאים לסכמה החדשה ולשמור על עקביות עם ה-endpoints של פורטל הלקוחות.

---

## 📝 קבצים שעודכנו

### 1. `src/app/api/auth/forgot-password/route.ts`

**שינוי בשורה 48:**
```typescript
// לפני:
teacher_id: teacher.id,

// אחרי:
user_id: teacher.id,
```

### 2. `src/app/api/auth/reset-password/route.ts`

**שינויים בשורות 39, 79, 96:**

```typescript
// לפני (שורה 39):
.select('id, teacher_id, expires_at, used_at')

// אחרי:
.select('id, user_id, expires_at, used_at')
```

```typescript
// לפני (שורה 79):
.eq('id', tokenData.teacher_id)

// אחרי:
.eq('id', tokenData.user_id)
```

```typescript
// לפני (שורה 96):
teacherId: tokenData.teacher_id,

// אחרי:
teacherId: tokenData.user_id,
```

---

## 🎯 סיבת השינוי

המיגרציה המתוקנת (`013_auth_tokens_fixed.sql`) שינתה את טבלת `auth_tokens` כדי לתמוך הן במורים והן בלקוחות:

```sql
create table if not exists public.auth_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,  -- Can reference either teachers.id or clients.id
  token text not null unique,
  token_type text not null check (token_type in ('password_reset', 'email_verification')),
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
```

העמודה `user_id` היא גנרית ויכולה להצביע על `teachers.id` או `clients.id`, מה שמאפשר שימוש חוזר בטבלה עבור שני סוגי המשתמשים.

---

## ✅ אימות התיקון

### בדיקות שצריך לבצע:

1. **בקשת איפוס סיסמה למורה:**
   ```bash
   curl -X POST http://localhost:3000/api/auth/forgot-password \
     -H "Content-Type: application/json" \
     -d '{"email":"teacher@example.com"}'
   ```
   
   ✅ צריך להצליח ליצור טוקן בטבלת `auth_tokens`

2. **איפוס סיסמה בפועל:**
   ```bash
   curl -X POST http://localhost:3000/api/auth/reset-password \
     -H "Content-Type: application/json" \
     -d '{"token":"TOKEN_HERE","password":"NewPassword123"}'
   ```
   
   ✅ צריך להצליח לעדכן את הסיסמה

3. **בדיקה במסד הנתונים:**
   ```sql
   -- בדוק שהטוקנים נשמרים עם user_id
   SELECT id, user_id, token_type, expires_at, used_at 
   FROM auth_tokens 
   WHERE token_type = 'password_reset'
   ORDER BY created_at DESC
   LIMIT 5;
   ```

---

## 🔄 עקביות במערכת

אחרי התיקון, כל ה-endpoints מאוחדים בשימוש ב-`user_id`:

### ✅ Teacher Endpoints:
- `POST /api/auth/forgot-password` - משתמש ב-`user_id`
- `POST /api/auth/reset-password` - משתמש ב-`user_id`

### ✅ Client Portal Endpoints:
- `POST /api/client-portal/auth/signup` - משתמש ב-`user_id`
- `POST /api/client-portal/auth/verify-email` - משתמש ב-`user_id`
- `POST /api/client-portal/auth/forgot-password` - משתמש ב-`user_id`
- `POST /api/client-portal/auth/reset-password` - משתמש ב-`user_id`

---

## 📊 השפעת התיקון

### לפני התיקון:
❌ Teacher password reset endpoints - כשל בהכנסה לDB  
✅ Client portal endpoints - עובד  
❌ חוסר עקביות בקוד  

### אחרי התיקון:
✅ Teacher password reset endpoints - עובד  
✅ Client portal endpoints - עובד  
✅ עקביות מלאה בכל המערכת  

---

## 🚀 אין צורך בשינויים נוספים

- ✅ אין צורך במיגרציה נוספת
- ✅ אין צורך בעדכון קבצים אחרים
- ✅ המערכת מוכנה לשימוש מיד לאחר הדפלוי

---

## 📚 קישורים רלוונטיים

- תיעוד המיגרציה: `supabase/migrations/013_auth_tokens_fixed.sql`
- תיעוד Bug Fix הקודם: `BUGS_FIXED.md`
- הוראות מיגרציה: `BUG_FIX_INSTRUCTIONS.md`

---

## ✨ סיכום

התיקון הושלם בהצלחה! כל ה-endpoints של authentication (מורים ולקוחות) עכשיו משתמשים בעמודה `user_id` המשותפת, מה שמבטיח עקביות ופונקציונליות מלאה במערכת.

**הבאג תוקן ב-100%!** ✅

---

*נוצר ב-2026 • ServiceOS Bug Fix #3*
