# 📲 מערכת תזכורות אוטומטיות - מדריך מלא

## 🎉 מה נבנה?

מערכת מקצועית לשליחת תזכורות אוטומטיות ב-SMS ו-WhatsApp!

### ✅ תכונות

1. **תזכורות לתורים**
   - 24 שעות לפני
   - 2 שעות לפני
   - שעה לפני
   - בחירה בין SMS ל-WhatsApp לכל תזכורת

2. **תזכורות תשלום**
   - תזכורת אוטומטית לתשלומים ממתינים
   - הגדרת מספר ימים אחרי התור

3. **שליחה ידנית**
   - אפשרות לשלוח תזכורת ידנית מעמוד התורים

4. **לוג הודעות**
   - מעקב אחר כל ההודעות שנשלחו
   - סטטוס: נשלח/נכשל/נמסר/נקרא

5. **תבניות מותאמות**
   - תבניות בעברית
   - אפשרות להתאמה אישית

---

## 📂 הקבצים שנוצרו

```
✅ שירות הודעות
├── src/lib/messaging/messagingService.ts

✅ Database
└── supabase/migrations/014_messaging_reminders.sql

✅ API Endpoints
├── src/app/api/reminders/send/route.ts
└── src/app/api/reminders/settings/route.ts

✅ UI Pages
├── src/app/(app)/reminders/page.tsx
└── src/components/AppShell.tsx (עודכן)

✅ תיעוד
├── REMINDERS_SETUP.md (קובץ זה)
└── .env (עודכן)
```

---

## 🚀 התקנה מהירה

### שלב 1: הרץ Migration

```bash
# ב-Supabase Dashboard:
# 1. SQL Editor → New Query
# 2. העתק את התוכן מ: supabase/migrations/014_messaging_reminders.sql
# 3. הדבק והרץ
```

### שלב 2: הפעל מחדש את השרת

```bash
npm run dev
```

### שלב 3: בדוק את הפיצ'ר

1. גש ל: `http://localhost:3000/reminders`
2. תראה דף הגדרות תזכורות
3. הפעל/כבה תזכורות
4. בחר בין SMS ל-WhatsApp

---

## 🧪 מצב פיתוח (Console Mode)

כרגע המערכת ב**מצב פיתוח** - ההודעות לא נשלחות באמת, אלא מודפסות ל-Terminal!

### איך זה נראה:

```bash
📱 ════════════════════════════════════════════════
📱 SMS Message (Development Mode - Not Sent)
📱 ════════════════════════════════════════════════
To: +972501234567
─────────────────────────────────────────────────
שלום יוסי 👋

תזכורת לתור שלך ב-ServiceOS:
📅 יום שלישי, 5 ביוני
🕐 14:00

אם צריך לשנות/לבטל, אנא עדכן אותנו.

בברכה,
ServiceOS
════════════════════════════════════════════════
```

זה מצוין לפיתוח ובדיקה!

---

## 💰 הגדרת Twilio (הודעות אמיתיות)

### למה Twilio?

- ✅ תומך ב-SMS וב-WhatsApp
- ✅ $15 קרדיט חינם בהרשמה
- ✅ אמין ומהיר
- ✅ תיעוד מעולה
- ✅ תמיכה בעברית וישראל

### מחירים

**SMS:**
- ישראל: ~$0.08 ל-SMS (~30 אגורות)
- 100 הודעות = $8 (30 ש"ח)

**WhatsApp:**
- 1,000 הודעות ראשונות **חינם** לחודש!
- אחר כך: ~$0.005 להודעה (2 אגורות)
- **הרבה יותר זול מ-SMS!**

---

## 📝 הרשמה ל-Twilio (צעד אחר צעד)

### 1. הרשמה

1. גש ל: https://www.twilio.com/try-twilio
2. לחץ "Sign up"
3. מלא פרטים:
   - Email
   - Password (חזקה!)
   - First/Last Name
4. אמת אימייל

### 2. אימות מספר טלפון

1. הזן את מספר הטלפון שלך (+972...)
2. קבל קוד ב-SMS
3. הזן את הקוד

### 3. קבל Account SID ו-Auth Token

1. בדף ה-Console הראשי תראה:
   - **Account SID** (מזהה חשבון)
   - **Auth Token** (מפתח סודי)
2. לחץ על "Show" ליד Auth Token
3. **העתק שניהם!**

### 4. קבל מספר טלפון

**SMS:**
1. לחץ "Get a number" / "Buy a number"
2. בחר מדינה: Israel (+972)
3. בחר מספר (בחינם!)
4. לחץ "Choose this number"

**WhatsApp:**
1. גש ל: "Messaging" → "Try it out" → "Send a WhatsApp message"
2. עקוב אחרי ההוראות
3. סרוק QR code בוואטסאפ
4. ה-Sandbox מספיק לבדיקה!

### 5. עדכן `.env`

```bash
# שנה מ-console ל-twilio
MESSAGING_PROVIDER=twilio

# הדבק את הפרטים שלך (מ-Twilio Console — אל תשים דוגמאות ב-git)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+972501234567
TWILIO_WHATSAPP_NUMBER=+14155238886
```

### 6. הפעל מחדש את השרת

```bash
# עצור (Ctrl+C) והתחל מחדש
npm run dev
```

### 7. נסה לשלוח!

עכשיו כשתשלח תזכורת, היא תישלח **באמת**! 🚀

---

## 🔧 שימוש במערכת

### 1. הגדרות תזכורות

```
http://localhost:3000/reminders
```

**תוכל להגדיר:**
- ✅ האם לשלוח תזכורות בכלל
- ✅ תזכורת 24 שעות לפני (SMS/WhatsApp)
- ✅ תזכורת 2 שעות לפני (SMS/WhatsApp)
- ✅ תזכורת שעה לפני (SMS/WhatsApp)
- ✅ תזכורות תשלום (מתי ואיך)

### 2. שליחה ידנית

מעמוד התורים:
1. לחץ על תור
2. לחץ "שלח תזכורת"
3. בחר SMS או WhatsApp
4. אשר

### 3. שליחה אוטומטית

המערכת תשלח אוטומטית לפי ההגדרות שקבעת!

**איך זה עובד?**
- צריך להוסיף Cron Job (נעשה בהמשך)
- או להריץ סקריפט כל כמה דקות
- או לדחוף ל-Vercel Cron

---

## 📊 תבניות ההודעות

### תזכורת לתור

```
שלום {שם לקוח} 👋

תזכורת לתור שלך ב-{שם עסק}:
📅 {תאריך}
🕐 {שעה}

אם צריך לשנות/לבטל, אנא עדכן אותנו.

בברכה,
{שם עסק}
```

### תזכורת תשלום

```
שלום {שם לקוח} 👋

תזכורת ידידותית לתשלום:
💰 סכום: ₪{סכום}

ניתן לשלם במזומן/העברה/אשראי.

תודה רבה!
{שם עסק}
```

### התאמה אישית

ניתן להתאים את התבניות בעמוד ההגדרות (בהמשך).

---

## 🔐 אבטחה

### מספרי טלפון

- ✅ כל המספרים חייבים להתחיל ב-`+`
- ✅ פורמט: `+972501234567`
- ✅ לא לשמור ללא קוד מדינה

### מפתחות Twilio

- ✅ לעולם אל תשתף את ה-Auth Token!
- ✅ שמור רק ב-`.env` (לא ב-git)
- ✅ סובב את המפתח אם חושד בדליפה

### Rate Limiting

- ✅ Twilio מגביל 1,000 הודעות לשעה
- ✅ שמור על כמות סבירה
- ✅ הוסף cooldown בין הודעות

---

## 📈 מעקב ולוגים

### טבלת message_logs

כל הודעה שנשלחת נשמרת ב-DB:

```sql
SELECT 
  phone_number,
  message_type,
  message_purpose,
  status,
  sent_at
FROM message_logs
ORDER BY created_at DESC
LIMIT 50;
```

### סטטוסים

- `pending` - ממתין לשליחה
- `sent` - נשלח
- `failed` - נכשל
- `delivered` - נמסר (Twilio callback)
- `read` - נקרא (WhatsApp)

---

## 🐛 פתרון בעיות

### ההודעה לא נשלחת?

**בדוק:**
- ✅ `MESSAGING_PROVIDER=twilio` ב-`.env`?
- ✅ יש `TWILIO_ACCOUNT_SID`?
- ✅ יש `TWILIO_AUTH_TOKEN`?
- ✅ יש `TWILIO_PHONE_NUMBER`?
- ✅ המספר נכון (עם +)?
- ✅ יש קרדיט ב-Twilio?

### השרת לא רואה את המשתנים?

```bash
# וודא שעצרת והתחלת מחדש
Ctrl+C
npm run dev
```

### Twilio error: "Unverified number"?

אם אתה ב-Trial mode, צריך לאמת כל מספר לפני השליחה:
1. גש ל-Twilio Console
2. "Phone Numbers" → "Verified Caller IDs"
3. הוסף את המספר
4. אמת עם SMS

### WhatsApp לא עובד?

- ✅ בדוק ש-WhatsApp Sandbox פעיל
- ✅ המספר הצטרף ל-Sandbox (סרק QR)
- ✅ השתמש במספר ה-Sandbox בשביל `TWILIO_WHATSAPP_NUMBER`

---

## 💡 טיפים

### 1. התחל עם Console Mode

לפני ש משלמים ל-Twilio, תבדוק שהכל עובד ב-Console mode!

### 2. WhatsApp זול יותר

- 1,000 הודעות חינם לחודש
- אחר כך 2 אגורות להודעה
- לעומת 30 אגורות ב-SMS

### 3. תזמן נכון

- תזכורת 24 שעות - מושלם!
- תזכורת 2 שעות - אופציונלי
- תזכורת שעה - רק אם ממש צריך

### 4. מסרים קצרים

SMS מוגבל ל-160 תווים. שמור על הודעות קצרות!

### 5. מעקב אחר הצלחה

בדוק את ה-message_logs לראות כמה הודעות נשלחו בהצלחה.

---

## 🚀 מה הלאה?

### תכונות עתידיות:

- [ ] Cron Job לשליחה אוטומטית
- [ ] תבניות מותאמות אישית בUI
- [ ] דוח הודעות חודשי
- [ ] A/B testing של תבניות
- [ ] Opt-out (לקוח מבקש להפסיק)
- [ ] תמיכה בשפות נוספות
- [ ] Webhook מ-Twilio לעדכון סטטוס
- [ ] שליחה המונית (broadcast)

---

## 🎯 סיכום

המערכת מוכנה! 🎉

**במצב פיתוח (Console):**
- ✅ כל ההודעות מודפסות ל-Terminal
- ✅ אפס עלויות
- ✅ מושלם לפיתוח

**במצב ייצור (Twilio):**
- ✅ הודעות אמיתיות
- ✅ SMS ו-WhatsApp
- ✅ מעקב מלא
- ✅ $15 חינם להתחלה

**הצלחה! 🚀**

---

## 📞 תמיכה

- **Twilio Docs**: https://www.twilio.com/docs
- **Twilio Console**: https://console.twilio.com
- **WhatsApp Sandbox**: https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn

יש שאלות? אני כאן! 😊
