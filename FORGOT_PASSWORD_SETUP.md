# 🔐 מערכת Forgot Password & Email Verification

מערכת מלאה לאיפוס סיסמה ואימות אימייל!

## ✅ מה נבנה?

### 1. **Forgot Password (שכחתי סיסמה)**
- ✅ דף בקשת איפוס סיסמה (`/forgot-password`)
- ✅ שליחת אימייל עם קישור לאיפוס
- ✅ דף איפוס סיסמה (`/reset-password?token=...`)
- ✅ אבטחה מלאה (טוקנים עם תפוגה, שימוש חד פעמי)

### 2. **Email Verification (אימות אימייל)**
- ✅ שליחת אימייל אימות בהרשמה
- ✅ אימות אוטומטי בלחיצה על קישור
- ✅ מעקב אחר משתמשים מאומתים/לא מאומתים

### 3. **Email Service (שירות אימייל)**
- ✅ תמיכה ב-Resend (מומלץ - חינמי עד 100 אימיילים ליום)
- ✅ מצב פיתוח (Console) - מדפיס לקונסול
- ✅ תבניות אימייל יפות בעברית
- ✅ קל להרחבה (SendGrid, SMTP, וכו')

## 📋 הקבצים שנוצרו

```
✅ תשתית ושירותים
├── src/lib/email/emailService.ts                 # שירות שליחת אימיילים
├── src/lib/auth/passwordUtils.ts                 # כלי סיסמאות (כבר היה)
├── supabase/migrations/013_auth_tokens.sql       # טבלת טוקנים

✅ API Endpoints
├── src/app/api/auth/forgot-password/route.ts     # בקשת איפוס סיסמה
├── src/app/api/auth/reset-password/route.ts      # איפוס סיסמה

✅ דפי Frontend
├── src/app/(marketing)/forgot-password/page.tsx  # דף "שכחתי סיסמה"
├── src/app/(marketing)/reset-password/page.tsx   # דף איפוס סיסמה
└── src/app/(marketing)/login/page.tsx            # (כבר יש לינק)

✅ תיעוד
├── FORGOT_PASSWORD_SETUP.md                      # קובץ זה
└── scripts/manage-user.js                        # (עדכנו קודם)
```

## 🚀 התקנה מהירה

### שלב 1: הרץ Migration

הרץ את המיגרציה כדי ליצור את טבלת הטוקנים:

```bash
# ב-Supabase Dashboard:
# 1. לחץ על SQL Editor
# 2. העתק את התוכן מ: supabase/migrations/013_auth_tokens.sql
# 3. הדבק והרץ
```

או באמצעות סקריפט (אם יש לך):
```bash
node scripts/run-migration.js 013_auth_tokens.sql
```

### שלב 2: עדכן משתני סביבה

הקובץ `.env` כבר מכיל את ההגדרות! בדוק שיש:

```bash
# אימיילים במצב פיתוח (מדפיס לקונסול)
EMAIL_PROVIDER=console
EMAIL_FROM=noreply@serviceos.com
```

### שלב 3: התחל את השרת

```bash
npm run dev
```

זהו! המערכת מוכנה! 🎉

## 💻 שימוש - Flow מלא

### תרחיש 1: שכחתי סיסמה

1. **משתמש לוחץ על "שכחתי סיסמה"**
   - נכנס ל: `http://localhost:3000/forgot-password`

2. **משתמש מזין אימייל ולוחץ "שלח"**
   - המערכת יוצרת טוקן איפוס (תקף לשעה)
   - שולחת אימייל עם קישור

3. **משתמש לוחץ על הקישור באימייל**
   - נכנס ל: `http://localhost:3000/reset-password?token=...`
   - רואה טופס להזנת סיסמה חדשה

4. **משתמש מזין סיסמה חדשה**
   - הסיסמה מתעדכנת
   - הטוקן מסומן כ"נוצל"
   - מועבר אוטומטית לדף התחברות

### תרחיש 2: אימות אימייל (עתידי)

1. משתמש נרשם למערכת
2. מקבל אימייל עם קישור אימות
3. לוחץ על הקישור
4. האימייל מסומן כמאומת
5. יכול להתחיל להשתמש במערכת

## 🔧 הגדרת Resend (אימיילים אמיתיים)

אם רוצה לשלוח אימיילים אמיתיים:

### 1. הירשם ל-Resend

- גש ל: https://resend.com
- הירשם (חינם!)
- קבל 100 אימיילים ליום בחינם

### 2. קבל API Key

- לחץ על "API Keys"
- צור API Key חדש
- העתק את המפתח

### 3. עדכן `.env`

```bash
# שנה את זה:
EMAIL_PROVIDER=console

# לזה:
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_your_actual_api_key_here
```

### 4. אמת דומיין (אופציונלי אבל מומלץ)

ב-Resend Dashboard:
1. לחץ על "Domains"
2. הוסף את הדומיין שלך (למשל: `serviceos.com`)
3. עדכן DNS records
4. עדכן `.env`:
   ```bash
   EMAIL_FROM=noreply@yourdomain.com
   ```

## 📧 תבניות האימייל

### 1. Password Reset Email

```
נושא: 🔐 איפוס סיסמה - ServiceOS

שלום {שם},

קיבלנו בקשה לאיפוס הסיסמה שלך.

[כפתור: איפוס סיסמה]

הקישור תקף ל-1 שעה בלבד.
```

### 2. Email Verification

```
נושא: ✉️ אימות אימייל - ServiceOS

שלום {שם},

ברוכים הבאים ל-ServiceOS!

[כפתור: אמת אימייל]

אחרי האימות תוכל להתחיל להשתמש במערכת.
```

### 3. Welcome Email

```
נושא: 🎉 ברוכים הבאים ל-ServiceOS!

חשבונך אומת בהצלחה!

תכונות המערכת:
- ניהול תורים
- ניהול לקוחות
- מעקב תשלומים
- דוחות ואנליטיקה

[כפתור: התחל עכשיו]
```

## 🔒 אבטחה

### טוקנים מאובטחים

```typescript
// יצירת טוקן (32 בייטים רנדומליים)
const resetToken = randomBytes(32).toString('hex');

// טוקן תקף לשעה
const expiresAt = new Date();
expiresAt.setHours(expiresAt.getHours() + 1);

// נשמר ב-DB עם:
- teacher_id
- token_type ('password_reset' או 'email_verification')
- expires_at
- used_at (null עד שימוש)
```

### הגנות

✅ **Email Enumeration Protection**: לא מגלים אם אימייל קיים או לא  
✅ **Token Expiration**: טוקן תקף רק לשעה אחת  
✅ **One-Time Use**: לא ניתן להשתמש בטוקן פעמיים  
✅ **Strong Passwords**: בדיקת חוזק סיסמה (8+ תווים, אותיות וספרות)  
✅ **HTTPS Ready**: מוכן לסביבת production  

## 🧪 בדיקות

### בדיקה בסיסית (Console Mode)

1. הרץ `npm run dev`
2. פתח `http://localhost:3000/login`
3. לחץ על "שכחתי סיסמה"
4. הזן אימייל קיים
5. בדוק ב-Terminal את האימייל שהודפס
6. העתק את ה-token מה-URL
7. נווט ל: `http://localhost:3000/reset-password?token={TOKEN}`
8. הזן סיסמה חדשה
9. התחבר עם הסיסמה החדשה

### בדיקה עם Resend

1. הגדר Resend (ראה למעלה)
2. הרץ את אותו תהליך
3. בדוק את תיבת הדואר שלך
4. לחץ על הקישור באימייל

## 🐛 פתרון בעיות

### האימייל לא נשלח?

**בדוק:**
- ✅ `EMAIL_PROVIDER=console` ב-`.env`?
- ✅ האם יש `RESEND_API_KEY` אם `EMAIL_PROVIDER=resend`?
- ✅ בדוק ב-Terminal אם יש הדפסת האימייל (console mode)

### הטוקן לא עובד?

**בדוק:**
- ✅ האם עברה שעה מאז קבלת הקישור?
- ✅ האם כבר השתמשת בטוקן?
- ✅ האם ה-URL מכיל את הטוקן המלא (32 תווים hex)?
- ✅ האם הרצת את Migration 013?

### הסיסמה לא מתעדכנת?

**בדוק:**
- ✅ הסיסמה עומדת בתנאים? (8+ תווים, אות גדולה, קטנה, ספרה)
- ✅ שתי הסיסמאות תואמות?
- ✅ בדוק את הקונסול לשגיאות

## 📊 ניטור

### לוגים חשובים

```bash
# Forgot password request
[forgot-password] Password reset requested: { email, tokenCreated, emailSent }

# Reset password success
[reset-password] Password reset successful: { teacherId }

# Token errors
[reset-password] Token not found
[reset-password] Token already used
[reset-password] Token expired
```

### שאילתות שימושיות

```sql
-- כמה טוקנים פעילים?
SELECT count(*) FROM auth_tokens WHERE used_at IS NULL AND expires_at > now();

-- מי ביקש איפוס לאחרונה?
SELECT t.email, at.created_at, at.token_type
FROM auth_tokens at
JOIN teachers t ON t.id = at.teacher_id
ORDER BY at.created_at DESC
LIMIT 10;

-- כמה משתמשים אימתו אימייל?
SELECT count(*) FROM teachers WHERE email_verified = true;

-- נקה טוקנים ישנים
SELECT cleanup_expired_auth_tokens();
```

## 🎯 תכונות עתידיות

רעיונות להרחבה:

- [ ] Email Verification חובה לפני התחברות
- [ ] "Remember this device" - לא לבקש סיסמה שוב למשך 30 יום
- [ ] Two-Factor Authentication (2FA)
- [ ] Security notifications (התחברות ממכשיר חדש)
- [ ] Password history (לא לאפשר סיסמה ישנה)
- [ ] מגבלת ניסיונות (Rate limiting)
- [ ] Captcha להגנה מפני bots

## 🔗 קישורים

- **Resend Docs**: https://resend.com/docs
- **OWASP Password Guidelines**: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
- **Email Best Practices**: https://postmarkapp.com/guides/transactional-email-best-practices

---

## 🎉 סיכום

המערכת מוכנה! עכשיו יש לך:

✅ שכחתי סיסמה מלא  
✅ אימות אימייל (תשתית מוכנה)  
✅ שליחת אימיילים יפים  
✅ אבטחה ברמה גבוהה  
✅ תיעוד מקיף  

**מה הלאה?**
1. הרץ את ה-Migration
2. נסה את הפיצ'ר
3. הגדר Resend לשליחת אימיילים אמיתיים
4. תיהנה! 🚀
