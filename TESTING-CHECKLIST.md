# ✅ בדיקת Multi-Tenant - ServiceOS

## סדר הבדיקות:

### 1. בדיקת Teacher Switcher
- [ ] רענן את הדף (Ctrl+R)
- [ ] וודא שיש dropdown בראש הדף עם "Sameer Driving" ו-"Dr Avi Clinic"
- [ ] נסה להחליף ביניהם - הדף אמור להתרענן

### 2. בדיקת Isolation - Clients
- [ ] בחר "Sameer Driving"
- [ ] לך ל-`/clients` והוסף לקוח: "דני כהן - 050-1111111"
- [ ] החלף ל-"Dr Avi Clinic"
- [ ] וודא שהרשימה **ריקה**
- [ ] הוסף לקוח: "שרה לוי - 050-2222222"
- [ ] חזור ל-"Sameer Driving"
- [ ] וודא ש"דני כהן" שם, אבל "שרה לוי" **לא**

### 3. בדיקת Isolation - Appointments
- [ ] בחר "Sameer Driving"
- [ ] לך ל-`/appointments` והוסף תור עבור "דני כהן"
- [ ] החלף ל-"Dr Avi Clinic"
- [ ] וודא שאין תורים
- [ ] הוסף תור עבור "שרה לוי"
- [ ] חזור ל-"Sameer Driving"
- [ ] וודא שרק התור של דני נראה

### 4. בדיקת Settings
- [ ] בחר "Sameer Driving"
- [ ] לך ל-`/settings`
- [ ] שנה את שם העסק ל-"בית ספר לנהיגה - סמיר"
- [ ] שמור
- [ ] החלף ל-"Dr Avi Clinic"
- [ ] שנה את שם העסק ל-"מרפאת ד״ר אבי"
- [ ] חזור ל-"Sameer Driving"
- [ ] וודא שהשם "בית ספר לנהיגה - סמיר"

### 5. בדיקת Public Booking URLs
- [ ] בחר "Sameer Driving"
- [ ] לך ל-`/booking`
- [ ] העתק את ה-URL: `http://localhost:3000/book/sameer-driving`
- [ ] פתח בחלון incognito
- [ ] וודא שהכותרת: "בית ספר לנהיגה - סמיר"
- [ ] וודא שהשדות: "מקום איסוף" ו-"תיבת הילוכים"
- [ ] נסה: `http://localhost:3000/book/dr-avi-clinic`
- [ ] וודא שהכותרת: "מרפאת ד״ר אבי"
- [ ] וודא שהשדות: "סוג טיפול" ו-"אזור טיפול"

---

## ✅ אם הכל עבר - המערכת עובדת מצוין!

## ❌ אם משהו לא עבד - תגיד לי מה ואתקן
