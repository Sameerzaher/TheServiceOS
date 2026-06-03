# 📊 מערכת דוחות ואנליטיקה (Analytics System)

מערכת מקיפה לניתוח ביצועים עסקיים, מעקב אחר הכנסות, תורים ולקוחות.

## תכונות עיקריות

### 1. דשבורד אנליטיקה מלא
- **מדדים עיקריים (KPIs)**: הכנסות, תורים, לקוחות פעילים, ניצולת זמן
- **גרפים אינטראקטיביים**: תצוגה ויזואלית של הכנסות יומיות
- **סטטוס תשלומים**: פילוח תשלומים (שולם, בהמתנה, לא שולם)
- **טבלת לקוחות מובילים**: 10 הלקוחות עם ההוצאה הגבוהה ביותר
- **בחירת טווח תאריכים**: 7, 30, או 90 ימים אחרונים

### 2. ייצוא לאקסל (CSV)
ארבעה סוגי ייצוא זמינים:
- **דוח מלא**: סיכום מקיף של כל הנתונים
- **ייצוא הכנסות**: פירוט הכנסות יומי
- **ייצוא תורים**: רשימה מלאה של כל התורים
- **ייצוא לקוחות**: רשימת לקוחות עם סטטיסטיקות

### 3. סיכום מהיר בדשבורד
וידג'ט קומפקטי המציג:
- הכנסות 30 יום אחרונים
- סה"כ תורים והשלמות
- לקוחות פעילים וחדשים
- ניצולת זמן

## מבנה הקוד

```
src/
├── features/analytics/
│   ├── components/
│   │   ├── AnalyticsDashboard.tsx      # דשבורד מלא
│   │   └── AnalyticsSummaryWidget.tsx  # סיכום קצר לדף הבית
│   └── README.md
├── lib/analytics/
│   ├── calculateStats.ts               # חישובי סטטיסטיקה
│   └── exportToExcel.ts                # ייצוא CSV
└── app/(app)/
    └── analytics/
        └── page.tsx                     # עמוד הדוחות
```

## שימוש

### הצגת הדוח המלא
```typescript
import { AnalyticsDashboard } from '@/features/analytics/components/AnalyticsDashboard';

<AnalyticsDashboard 
  appointments={appointments} 
  clients={clients} 
/>
```

### הצגת סיכום בדשבורד
```typescript
import { AnalyticsSummaryWidget } from '@/features/analytics/components/AnalyticsSummaryWidget';

<AnalyticsSummaryWidget 
  appointments={appointments} 
  clients={clients} 
/>
```

### חישוב סטטיסטיקות
```typescript
import { calculateAnalyticsStats } from '@/lib/analytics/calculateStats';

const stats = calculateAnalyticsStats(appointments, clients, {
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-01-31')
});

console.log(stats.totalRevenue);        // סה"כ הכנסות
console.log(stats.utilizationRate);     // ניצולת זמן
console.log(stats.activeClients);       // לקוחות פעילים
```

### ייצוא נתונים
```typescript
import {
  exportAppointmentsToCSV,
  exportClientsToCSV,
  exportRevenueSummaryToCSV,
  exportFullAnalyticsReport
} from '@/lib/analytics/exportToExcel';

// ייצוא תורים
exportAppointmentsToCSV(appointments, clients);

// ייצוא דוח מלא
exportFullAnalyticsReport(appointments, clients, {
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-01-31')
});
```

## מדדי ביצועים

### 1. הכנסות (Revenue)
- **סה"כ הכנסות**: סכום כל התורים שהושלמו
- **הכנסות ששולמו**: רק תורים עם סטטוס "שולם"
- **הכנסות בהמתנה**: תורים עם סטטוס "בהמתנה" או "שולם חלקית"
- **הכנסות שלא שולמו**: תורים שהושלמו אך לא שולמו

### 2. תורים (Appointments)
- **סה"כ תורים**: כל התורים בטווח התאריכים
- **תורים שהושלמו**: סטטוס "הושלם"
- **תורים שבוטלו**: סטטוס "בוטל" או "לא הגיע"
- **תורים עתידיים**: תורים מתוזמנים או מאושרים בעתיד

### 3. לקוחות (Clients)
- **לקוחות פעילים**: לקוחות עם תור בטווח התאריכים
- **לקוחות חדשים**: לקוחות שנוצרו בטווח התאריכים
- **לקוח פעיל**: לקוח עם תור ב-30 יום אחרונים

### 4. ניצולת (Utilization)
- **ניצולת זמן**: אחוז השעות העומסות (מתוך 8 שעות עבודה ביום)
- **ממוצע תורים ליום**: מספר תורים חלקי מספר ימים

### 5. תשלומים (Payments)
- **אחוז תשלום**: אחוז תורים ששולמו מתוך כל התורים שהושלמו
- **ממוצע הכנסה לתור**: סה"כ הכנסות חלקי מספר תורים שהושלמו

## ייצוא CSV - פורמט

### קובץ תורים (Appointments)
```csv
תאריך,שעה,שם לקוח,טלפון,סטטוס,סטטוס תשלום,סכום,הערות
01/01/2024,10:00,ישראל ישראלי,050-1234567,הושלם,שולם,300,
```

### קובץ לקוחות (Clients)
```csv
שם,טלפון,סה"כ תורים,תורים שהושלמו,סה"כ הוצאה,תור אחרון,הערות
ישראל ישראלי,050-1234567,10,8,2400,01/01/2024,
```

### קובץ הכנסות (Revenue Summary)
```csv
תאריך,הכנסות (₪),מספר תורים,ממוצע לתור (₪)
01/01/2024,1200,4,300.00
סה"כ,1200,4,300.00
```

## התאמה אישית

### שינוי שעות עבודה ליום
ערוך את `calculateStats.ts`:
```typescript
// שנה את 8 למספר שעות העבודה שלך
const totalWorkingMinutes = daysDiff * 8 * 60;
```

### שינוי משך תור ברירת מחדל
ערוך את `calculateStats.ts`:
```typescript
// שנה את 60 למשך התור בדקות
const totalAppointmentMinutes = appointmentsInRange.length * 60;
```

### הוספת מדד מותאם אישית
```typescript
// ב-calculateStats.ts
export interface AnalyticsStats {
  // ... מדדים קיימים
  customMetric: number; // מדד חדש
}

// בתוך calculateAnalyticsStats
return {
  // ... מדדים קיימים
  customMetric: calculateCustomMetric(), // חישוב מותאם אישית
};
```

## טיפים לשימוש

1. **השווה תקופות**: השתמש בכפתורי טווח התאריכים להשוואת ביצועים
2. **עקוב אחר מגמות**: צפה בגרף ההכנסות היומי לזיהוי דפוסים
3. **זהה לקוחות מובילים**: השתמש בטבלת הלקוחות המובילים לתכנון שיווקי
4. **ייצא באופן קבוע**: ייצא דוחות בסוף כל חודש לצורך הנהלת חשבונות
5. **בדוק ניצולת**: אם הניצולת נמוכה מ-70%, שקול להגדיל שיעורי פרסום

## תמיכה בעברית

- כל הממשקים בעברית
- קבצי CSV כוללים BOM לתמיכה מלאה באקסל
- פורמט תאריכים בסגנון ישראלי (DD/MM/YYYY)
- מטבע בשקלים (₪)

## תכונות עתידיות אפשריות

- [ ] גרפים נוספים (עוגה, קו מגמה)
- [ ] השוואת תקופות side-by-side
- [ ] התראות אוטומטיות (למשל: הכנסות נמוכות מהרגיל)
- [ ] ייצוא PDF עם גרפים
- [ ] אינטגרציה עם Google Analytics
- [ ] דוחות מותאמים אישית (custom reports)
- [ ] תחזיות AI (revenue forecasting)
