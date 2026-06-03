# 🔔 מערכת נוטיפיקציות - הזמנות חדשות

## סקירה כללית

כאשר לקוח מזמין תור דרך הטופס הציבורי (`/book/[slug]`), המערכת:
1. ✅ יוצרת את התור במצב "pending" (ממתין לאישור)
2. ✅ שולחת נוטיפיקציה לבעל העסק
3. ✅ מציגה badge אדום עם מספר ההודעות החדשות
4. ✅ מנגנת צליל (אופציונלי)
5. ✅ מציגה browser notification (אם המשתמש אישר)

---

## שלב 1: הפעלת הטבלה בבסיס הנתונים

הרץ את הקובץ SQL הבא ב-Supabase SQL Editor:

```sql
-- קובץ: supabase/CREATE-NOTIFICATIONS-TABLE.sql
```

זה יוצר:
- ✅ טבלת `notifications` 
- ✅ Indexes לביצועים
- ✅ RLS policies למורים

---

## שלב 2: איך זה עובד

### כאשר לקוח מזמין תור:

**1. API יוצר notification:**

```typescript
// src/app/api/public-booking/route.ts
await supabase.from("notifications").insert({
  business_id: businessId,
  teacher_id: teacherId,
  type: "new_booking",
  title: "הזמנה חדשה ממתינה לאישור",
  message: `${fullName} הזמין תור ל-${date}`,
  entity_type: "appointment",
  entity_id: appointmentId,
  is_read: false,
});
```

**2. המערכת מציגה בפינה:**
- 🔔 פעמון עם badge אדום
- מספר ההודעות שלא נקראו
- לחיצה פותחת dropdown עם כל ההודעות

**3. לחיצה על הודעה:**
- מסמנת אותה כ-"נקראה"
- מעבירה לדף Booking Requests (אם זו הזמנה חדשה)

---

## שלב 3: בדיקה

### בדיקה ידנית:

1. **פתח 2 חלונות דפדפן:**
   - חלון A: התחבר כ-admin בדשבורד
   - חלון B: פתח את הטופס הציבורי (`/book/[slug]`)

2. **בחלון B: הזמן תור**
   - מלא את הפרטים
   - שלח את הטופס

3. **בחלון A: תראה תוך 30 שניות (או רענן):**
   - ✅ פעמון אדום עם "1"
   - ✅ צליל (אם התקבל אישור)
   - ✅ browser notification (אם התקבל אישור)

4. **לחץ על הפעמון:**
   - תראה את ההודעה החדשה
   - לחץ עליה - תעבור ל-Booking Requests

5. **סמן הכל כנקרא:**
   - לחץ "סמן הכל כנקרא"
   - הבadge ייעלם

---

## API Endpoints

### GET `/api/notifications`
טוען את כל ההודעות של המורה המחובר (50 אחרונות)

**Response:**
```json
{
  "ok": true,
  "notifications": [
    {
      "id": "uuid",
      "type": "new_booking",
      "title": "הזמנה חדשה ממתינה לאישור",
      "message": "יוסי כהן הזמין תור ל-29/03/2026, 10:00",
      "entityType": "appointment",
      "entityId": "appointment-uuid",
      "isRead": false,
      "createdAt": "2026-03-28T10:00:00Z"
    }
  ]
}
```

### PUT `/api/notifications`
מסמן הודעות כנקראו

**Body (specific IDs):**
```json
{
  "notificationIds": ["uuid1", "uuid2"]
}
```

**Body (all unread):**
```json
{
  "notificationIds": []
}
```

---

## קבצים שנוצרו/שונו

### קבצים חדשים:
1. ✅ `supabase/CREATE-NOTIFICATIONS-TABLE.sql` - טבלת notifications
2. ✅ `src/app/api/notifications/route.ts` - API endpoints
3. ✅ `src/components/NotificationBell.tsx` - UI component

### קבצים ששונו:
1. ✅ `src/app/api/public-booking/route.ts` - יוצר notification
2. ✅ `src/components/AppShell.tsx` - מציג את הפעמון

---

## תכונות מתקדמות

### Polling אוטומטי
הנוטיפיקציות נטענות אוטומטית כל 30 שניות

### Browser Notifications
המערכת מבקשת אישור בפעם הראשונה ואז מציגה notifications של הדפדפן

### צליל
נגנה צליל קצר כשמגיעה הודעה חדשה (רק אם הדף פתוח)

### Real-time (עתיד)
אפשר להוסיף Supabase Realtime או WebSockets לעדכונים מיידיים

---

## הערות חשובות

⚠️ **Security:**
- כל המורים רואים רק את ההודעות שלהם (RLS)
- רק admin client יכול ליצור הודעות
- מורים יכולים לעדכן רק `is_read` על ההודעות שלהם

📊 **Performance:**
- Indexes על `teacher_id` ו-`is_read` למהירות
- Limit של 50 הודעות אחרונות
- Polling כל 30 שניות (לא real-time)

🔧 **Extensibility:**
- ניתן להוסיף סוגי notifications נוספים:
  - `booking_approved`
  - `booking_cancelled`
  - `payment_received`
  - `system`
- ניתן להוסיף filters (הצג רק unread, לפי type וכו')

---

## מוכן לשימוש! 🎉

רק צריך:
1. להריץ את `CREATE-NOTIFICATIONS-TABLE.sql`
2. לרענן את הדפדפן
3. לבדוק שהפעמון מופיע בפינה הימנית העליונה
