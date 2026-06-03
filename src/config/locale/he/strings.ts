/**
 * App-wide UI copy (Hebrew). Domain terms (student, lesson, …) come from the active
 * `VerticalPreset.labels`; this file holds shell copy, validation, and templates.
 */

export const heUi = {
  errors: {
    pageTitle: "לא הצלחנו לטעון את העמוד",
    pageDescription:
      "קרתה תקלה זמנית. רעננו את הדף, או חזרו לדף הראשי והמשיכו משם.",
    tryAgain: "נסו שוב",
    goHome: "חזרה לדף הבית",
    globalTitle: "המערכת לא נטענת כרגע",
    globalDescription:
      "רעננו את הדף או סגרו את האפליקציה ופתחו שוב. אם זה חוזר — בדקו חיבור לאינטרנט.",
  },

  loading: {
    /** למסכי קוראים בלבד כשמוצג ספינר בלי טקסט גלוי */
    ariaBusy: "טוען",
    summary: "טוען תמונת מצב עדכנית...",
    /** טעינת רשימת הלקוחות (דף לקוחות ופרופיל) */
    students: "טוען לקוחות...",
    lessons: "טוען את היומן...",
    settings: "טוען את ההגדרות...",
    bookingSettings: "טוען את הגדרות ההזמנה...",
    default: "טוען נתונים...",
  },

  /** Load / sync failures for Supabase-backed data */
  data: {
    loadFailedTitle: "לא הצלחנו לטעון את הנתונים",
    loadFailedHint:
      "בדקו שהרשת זמינה. נסו שוב — אם זה נמשך, רעננו את הדף.",
    syncFailedTitle: "השמירה לענן לא הושלמה",
    syncFailedHint:
      "מה שרואים אצלכם במסך עדיין כאן. נסו שוב לשמור, או רעננו ונסו שוב.",
    settingsLoadFailedTitle: "לא הצלחנו לטעון הגדרות",
    availabilityLoadFailedTitle: "לא הצלחנו לטעון זמינות להזמנות",
    clientsLoadFailedTitle: "לא הצלחנו לטעון את רשימת הלקוחות",
    clientsLoadFailedHint:
      "בדקו חיבור לרשת ואת הגדרות Supabase בשרת. נסו שוב — ואם נדרש, רעננו את הדף.",
    clientsSyncFailedTitle: "לא הצלחנו לשמור או לעדכן את רשימת הלקוחות",
    clientsSyncFailedHint:
      "השינוי לא נשמר בשרת. נסו שוב — ואם זה נמשך, רעננו את הדף ובדקו את החיבור.",
  },

  sections: {
    summary: "סיכום ופעולות",
    reminders: "תזכורות",
    settings: "הגדרות",
  },

  /** First-time flow until at least one lesson exists */
  onboarding: {
    welcomeTitle: "התחלה חכמה בדקה",
    welcomeHint:
      "שלושה צעדים קצרים ואתם באוויר: לקוח ראשון, שיעור ראשון, ותזכורת מוכנה לשליחה.",
    progressLabel: (done: number, total: number) => `התקדמות: ${done}/${total} הושלמו`,
    checklistAddClient: "הוספת לקוח או תלמיד ראשון",
    checklistAddLesson: "קביעת השיעור הראשון",
    checklistReviewReminders: "תזכורת אחת למחר",
    jumpToClientForm: "הוספת לקוח",
    jumpToLessonForm: "קביעת שיעור",
    markRemindersReviewed: "סימון כהושלם",
    dismiss: "סגירה לעכשיו",
  },

  toast: {
    clientCreated:
      "✅ הלקוח נוסף בהצלחה — אפשר לקבוע לו שיעור מהרשימה או מהפרופיל.",
    clientUpdated: "✅ הפרטים עודכנו והשינויים נשמרו.",
    clientDeleted: "הלקוח הוסר מהמערכת יחד עם השיעורים המשויכים אליו.",
    lessonCreated:
      "✅ השיעור נקבע בהצלחה — תמצאו אותו ברשימה, ביומן ובתזכורות למחר.",
    lessonUpdated: "✅ השיעור עודכן והפרטים נשמרו.",
    bookingApproved: "✅ הבקשה אושרה והשיעור עודכן ביומן.",
    bookingRejected: "הבקשה נדחתה והשיעור בוטל.",
    lessonDeleted: "השיעור הוסר מהיומן.",
    paymentToggled: "סטטוס התשלום עודכן.",
    paymentCycled: "תשלום עודכן (לא שולם ← חלקי ← שולם).",
    reminderCopied: "ההודעה בלוח — פתחו וואטסאפ, הדביקו ושלחו.",
    bookingLinkCopied: "קישור ההזמנה הועתק — אפשר להדביק ולשלוח לתלמידים.",
    settingsSaved:
      "✅ ההגדרות נשמרו. השם, הטלפון ותבנית התזכורת יופיעו הלאה בהודעות.",
    demoLoaded: "נתוני הדגמה נטענו — אפשר לנווט בין המסכים ולהתרגל.",
    demoReset: "המערכת הוחזרה למצב ריק.",
    exportStudents: "הקובץ ירד — אפשר לפתוח בגיליון אלקטרוני.",
    exportLessons: "ייצוא השיעורים הושלם — הקובץ בדרך.",
    backupExported: "גיבוי מלא ירד למכשיר — שמרו אותו במקום בטוח.",
    backupRestored: "הנתונים שוחזרו מהגיבוי. בדקו שסיכום המספרים נראה תקין.",
    storageSchemaReset:
      "האחסון המקומי אופס בגלל תאימות גרסאות. אם יש לכם גיבוי — שחזרו ממנו. אחרת התחילו לבנות נתונים מחדש.",
    actionFailed: "לא הצלחנו להשלים את הפעולה. נסו שוב בעוד רגע.",
  },

  /** Fallbacks when a preset omits optional label keys */
  defaults: {
    lessonSingular: "שיעור",
    lessonPlural: "שיעורים",
    studentSingular: "תלמיד",
    studentPlural: "תלמידים",
    records: "רשומות",
    appointments: "שיעורים",
  },

  dialog: {
    confirm: "הבנתי",
    cancel: "ביטול",
    backdropClose: "סגור",
    confirmDeleteClient: "מחק לקוח",
    confirmDeleteAppointment: "מחק שיעור",
    confirmResetDemo: "איפוס מלא",
    deleteClientTitle: "למחוק את הלקוח?",
    deleteClientMessage:
      "יימחקו גם כל השיעורים של הלקוח מהמערכת. אי אפשר לבטל אחרי האישור.",
    deleteAppointmentTitle: "למחוק את השיעור?",
    deleteAppointmentMessage:
      "השיעור יוסר מהיומן. אם זה בטעות — אפשר לקבוע שיעור חדש מיד אחרי.",
    resetDemoTitle: "מחיקת כל הנתונים במכשיר",
    resetDemoMessage:
      "כל הלקוחות, השיעורים וההגדרות במכשיר זה יימחקו. לפני שממשיכים — מומלץ לייצא גיבוי. האם לאפס?",
    loadDemoTitle: "טעינת נתוני הדגמה",
    loadDemoMessage:
      "הנתונים הקיימים במכשיר יוחלפו בדוגמה מוכנה. רוצים להמשיך?",
  },

  forms: {
    fullName: "שם מלא",
    phone: "טלפון",
    phonePrefix: "טלפון: ",
    notes: "הערות",
    save: "שמירת פרטים",
    saveChanges: "שמירת שינויים",
    cancelEdit: "ביטול עריכה",
    saveLesson: "קביעת שיעור",
    saving: "שומר…",
    editLesson: "עריכת שיעור",
    amount: "סכום (₪)",
    defaultAmountHint: (ils: number) => `ברירת מחדל מההגדרות: ${ils} ₪`,
    searchClients: "חיפוש לפי שם או טלפון…",
    selectPlaceholder: "בחרו מהרשימה…",
    selectStudentPlaceholder: "בחרו לקוח…",
    appointmentStudent: "לקוח",
    appointmentDatetime: "תאריך ושעה",
    appointmentDate: "תאריך",
    appointmentTime: "שעה",
    /** First option in the time dropdown */
    appointmentTimePlaceholder: "בחרו שעה…",
    paymentStatus: "סטטוס תשלום",
    /** Shown when date, time, and default duration from settings are set */
    suggestedLessonEnd: (endTime: string) => `שעת סיום משוערת (לפי משך מההגדרות): ${endTime}`,
  },

  filters: {
    dateAll: "כל התאריכים",
    dateToday: "היום",
    dateTomorrow: "מחר",
    dateThisWeek: "השבוע",
    paymentAll: "כל סטטוסי התשלום",
    paymentPaid: "שולם",
    paymentUnpaid: "טרם שולם",
    sort: "מיון",
    sortByDate: "תאריך (מהמרוך לרחוק)",
    sortByName: "שם (א–ת)",
    filterResultsEmpty: "אין תוצאות בסינון הזה — נסו טווח אחר או איפוס מסנן.",
  },

  validation: {
    fieldRequiredShort: "שדה חובה.",
    fullNameRequired: "נא למלא שם מלא (לפחות שני תווים).",
    studentRequired: "בחרו לקוח מהרשימה כדי לשייך את השיעור.",
    datetimeInvalid: "בחרו תאריך ושעה תקינים לשיעור.",
    phoneInvalid: "מספר הטלפון נראה קצר מדי — ודאו לפחות 9 ספרות.",
  },

  settings: {
    businessType: "סוג עסק",
    businessTypeHint:
      "מילות ממשק (תלמיד/מטופל, שיעור/תור), שדות בטופס הזמנה ציבורי וטפסים פנימיים — לפי סוג העסק.",
    activePresetDrivingInstructor: "מורה נהיגה / מורה פרטי",
    activePresetCosmeticClinic: "קליניקה לאסתטיקה / רופא מטפל",
    businessName: "שם העסק",
    businessNameHint: "מוצג בראש המסך, בדף ההזמנה הציבורי ובהודעות תזכורת.",
    teacherName: "שם המורה / בעל העסק",
    teacherNamePlaceholder: "למשל: דניאל לוי",
    businessPhone: "טלפון ליצירת קשר",
    businessPhoneHint:
      "ייכנס לתבנית התזכורת ({{businessPhone}}) כדי שלקוחות יהיה קל להשיב.",
    defaultLessonPrice: "מחיר ברירת מחדל לשיעור (₪)",
    defaultLessonPriceHint:
      "יתמלא בשיעור חדש — תמיד אפשר לשנות לפני השמירה.",
    defaultLessonDuration: "משך שיעור ברירת מחדל (דקות)",
    defaultLessonDurationHint:
      "מחשב «שעת סיום משוערת» בטופס השיעור בלבד; לא נשמר כחלק מהאירוע.",
    lessonBuffer: "מרווח בין שיעורים (דקות)",
    lessonBufferHint:
      "מרווח תפעולי מומלץ בין שיעור לשיעור לתכנון נוח יותר.",
    bookingEnabled: "פתיחת עמוד ההזמנה לתלמידים",
    workingHours: "שעות עבודה ברירת מחדל",
    workingHoursHint:
      "הגדרה מהירה לשעות פתיחה. תחול על חלון הזמינות השבועי במסך ההזמנות.",
    workingHoursStart: "שעת התחלה",
    workingHoursEnd: "שעת סיום",
    reminderTemplate: "תבנית תזכורת לשיעור (מחר / ברירת מחדל להיום)",
    reminderTemplateHint:
      "משתנים: {{name}}, {{time}}, {{date}}, {{business}} או {{businessName}}, {{businessPhone}}, {{amountDue}}.",
    sameDayReminderTemplate: "תבנית נפרדת לתזכורת באותו היום (אופציונלי)",
    sameDayReminderTemplateHint:
      "אם תשאירו ריק — תשתמש המערכת באותה תבנית כמו למעלה. מתאים לניסוח «היום ב-{{time}}».",
    paymentReminderTemplate: "תבנית תזכורת תשלום",
    paymentReminderTemplateHint:
      "למשל יתרה פתוחה. חובה לכלול לפחות {{amountDue}}; אפשר גם {{name}}, {{businessName}}, {{date}}, {{time}}.",
    remindersEnabled: "הפעלת תזכורות בדף הבית",
    remindersEnabledHint:
      "כבו אם אינכם רוצים רשימת תזכורות או שליחה ידנית בוואטסאפ מהמסך הראשי.",
    reminderChannelTomorrow: "תזכורות לשיעורים מחר",
    reminderChannelSameDay: "תזכורות לשיעורים היום (עתידיים)",
    reminderChannelPayment: "רשימת תזכורות תשלום (יתרה פתוחה)",
    reminderPreviewTitle: "איך זה ייראה",
    paymentReminderPreviewTitle: "תצוגה מקדימה — תשלום",
    previewAmountDue: "₪120",
    previewStudentName: "יוסי כהן",
    previewLessonTime: "09:00",
    previewLessonDate: "מחר, 15 בינואר 2026",
    previewBusinessFallback: "בית ספר לנהיגה",
    previewPhoneFallback: "050-1234567",
    googleCalendarTitle: "Google Calendar",
    googleCalendarIntro:
      "סנכרון תורים ליומן Google — אירוע נוצר ומתעדכן כשמוסיפים או משנים שיעור במערכת.",
    googleCalendarNotConfigured:
      "חיבור Google לא הוגדר בשרת (חסרים משתני סביבה). פנה למנהל המערכת.",
    googleCalendarConnect: "חיבור ל-Google",
    googleCalendarDisconnect: "ניתוק",
    googleCalendarReconnect: "חיבור מחדש",
    googleCalendarConnectedAs: (email: string) => `מחובר כ-${email}`,
    googleCalendarSyncEnabled: "סנכרון אוטומטי ליומן",
    googleCalendarSyncEnabledHint:
      "כבוי — לא יווצרו אירועים חדשים (חיבור Google נשמר).",
    googleCalendarDescriptionTemplate: "תבנית תיאור באירוע",
    googleCalendarDescriptionTemplateHint:
      "משתנים: {{clientName}}, {{serviceName}}, {{phone}}, {{notes}}, {{notesLine}}, {{linkLine}}, {{startAt}}, {{endAt}}",
    googleCalendarCalendarId: "מזהה יומן (Calendar ID)",
    googleCalendarCalendarIdHint:
      "ברירת מחדל: primary. בחירת יומן אחר — בפיתוח.",
    googleCalendarLastSync: "סנכרון אחרון",
    googleCalendarLastError: "שגיאה אחרונה",
    googleCalendarSaveIntegration: "שמירת הגדרות סנכרון",
    googleCalendarToastConnected: "Google Calendar חובר בהצלחה",
    googleCalendarStatusOk: "תקין",
    googleCalendarStatusError: "שגיאה",
    googleCalendarNone: "—",
    save: "שמירת הגדרות",
    saving: "שומר…",
    sectionHint: "פרטי העסק והטקסטים שיוצגו ללקוחות בהודעות ובדף ההזמנה.",
    bookingTitle: "הזמנה אונליין",
    bookingHint:
      "דף ציבורי שבו לקוחות בוחרים מועד פנוי ומשאירים פרטים — אתם מאשרים ומנהלים מהמערכת.",
    bookingPublicLink: "פתיחת דף ההזמנה (לשיתוף עם לקוחות)",
    bookingPublicUrlLabel: "קישור ציבורי לשיתוף",
    bookingCopyLink: "העתקת קישור",
    bookingShareWhatsapp: "שיתוף בוואטסאפ",
    bookingShareText: (url: string) =>
      `היי, אפשר לקבוע מועד דרך הקישור הזה:\n${url}`,
  },

  backup: {
    sectionTitle: "גיבוי ושחזור",
    description:
      "ייצוא או ייבוא מלא: לקוחות, שיעורים והגדרות בקובץ JSON אחד, נשמר אצלכם במכשיר.",
    export: "ייצוא גיבוי (JSON)",
    import: "ייבוא מגיבוי",
    importHint: "בחרו קובץ JSON שיוצא מהמערכת הזו.",
    actionsHint:
      "לפני ייבוא מומלץ לייצא גיבוי של המצב הנוכחי — כך תמיד אפשר לחזור אחורה.",
    importConfirmTitle: "שחזור מהגיבוי",
    importConfirmMessage:
      "כל הנתונים במכשיר יוחלפו בתוכן הקובץ. לא ניתן לבטל לאחר האישור. להמשיך?",
    confirmRestore: "שחזור עכשיו",
    errors: {
      notObject: "הקובץ לא בפורמט שהמערכת מזהה.",
      badVersion: "גרסת הגיבוי לא נתמכת בגרסה הנוכחית.",
      parseJson: "לא הצלחנו לקרוא את הקובץ — ודאו שזה קובץ JSON תקין.",
      invalidFileType: "יש לבחור קובץ בסיומת .json בלבד.",
      fileTooLarge: "הקובץ גדול מדי לטעינה בדפדפן — נסו במחשב או קיצרו את הגיבוי.",
    },
  },

  demo: {
    load: "התחלה עם נתוני דוגמה",
    reset: "איפוס כל הנתונים",
    activeBadge: "מצב הדגמה פעיל",
    activeDescription:
      "אתם רואים נתונים לדוגמה. אפשר לאפס ולחזור לעבודה על עסק אמיתי בכל רגע.",
    reloadDemo: "טעינה מחדש של הדגמה",
    returnToEmpty: "מחיקת הדגמה ומעבר לריק",
    emptyHint:
      "עדיין אין נתונים — טענו דוגמה כדי לראות איך המסכים נראים עם לקוחות ושיעורים.",
    bannerTitle: "הכל מוכן להתחלה",
    bannerDescription:
      "דוגמה מלאה: לקוחות, שיעורים קרובים, תשלומים ותזכורת למחר — טובה להתרשמות או הדרכה.",
  },

  export: {
    students: "ייצוא רשימת לקוחות (CSV)",
    noStudentsToExport: "אין עדיין לקוחות לייצוא — הוסיפו לקוח ונסו שוב.",
    noLessonsToExport:
      "אין שיעורים בטווח שבחרתם. נסו תאריכים רחבים יותר או בטלו סינון.",
    lessonsTitle: "ייצוא שיעורים (CSV)",
    lessonsHint:
      "סננו לפי תאריכים (ריק = בלי גבול) ולפי סטטוס תשלום, ואז הורידו את הקובץ.",
    dateFrom: "מתאריך",
    dateTo: "עד תאריך",
    paymentFilterLabel: "סטטוס תשלום",
    exportCsv: "הורדת קובץ",
    exporting: "מייצא…",
    invalidDateRange: "תאריך ההתחלה חייב להיות לפני או זהה לתאריך הסיום — בדקו את הבחירה.",
  },

  empty: {
    clientsTitle: (studentsLabel: string) =>
      `עדיין אין ${studentsLabel} — בואו נוסיף את הראשון`,
    clientsFallback: "אין נתונים עדיין",
    clientsDescription:
      "לקוח ראשון ברשימה = תזכורות, יומן ועקיבה אחרי תשלומים. לחצו על «הוספת לקוח» למעלה.",
    appointmentsTitle: (lessonsLabel: string) =>
      `עדיין אין ${lessonsLabel} — הגיע הזמן לקבוע`,
    /** רשימת שיעורים ריקה (ללא סינון) */
    lessonsListEmpty: "אין שיעורים עדיין",
    appointmentsFallback: "אין נתונים עדיין",
    appointmentsDescription:
      "קבעו שיעור ללקוח קיים או הוסיפו לקוח חדש — וכל האירועים יופיעו כאן.",
    noStudentsForAppointmentTitle: "קודם צריך לקוח ברשימה",
    noStudentsForAppointmentDescription:
      "הוסיפו לקוח אחד לפחות, ואז חזרו לכאן כדי לקבוע שיעור.",
  },

  boolean: {
    yes: "כן",
    no: "לא",
  },

  dashboard: {
    quickActionsTitle: "פעולה מהירה להתחלה",
    quickAddClient: "הוספת לקוח",
    quickAddAppointment: "קביעת שיעור",
    remindersSectionTitle: "תזכורות",
    /** כותרת מתקפלת לייצוא ודמו בדף הבית */
    exportToolsSummary: "ייצוא, דמו וכלים",
    kpiToday: "שיעורים היום",
    kpiTomorrow: "שיעורים מחר",
    kpiUnpaid: "ממתינים לתשלום",
    kpiClients: "סה״כ לקוחות",
    kpiAppointmentsTotal: "סה״כ שיעורים",
    kpiPendingBookings: "בקשות הזמנה ממתינות",
    statTotal: (lessonsWord: string) => `סה״כ ${lessonsWord}`,
    statToday: "היום",
    statUnpaid: "טרם שולם",
    statTotalIncome: "הכנסות (שולמו)",
    statUnpaidAmount: "יתרה לגבייה",
    statTodayRevenue: "הכנסות היום",
    statStudentsWithDebt: "עם יתרה לגבייה",
    statPartialAmount: "סכום בתשלומים חלקיים",
    summaryParagraph: (args: {
      total: number;
      lessonWord: string;
      lessonsWord: string;
      todayCount: number;
      unpaidCount: number;
      clientsCount: number;
      studentWord: string;
      studentsWord: string;
    }) => {
      const {
        total,
        lessonWord,
        lessonsWord,
        todayCount,
        unpaidCount,
        clientsCount,
        studentWord,
        studentsWord,
      } = args;
      const lessonNoun = total === 1 ? lessonWord : lessonsWord;
      const unpaidNoun =
        unpaidCount === 1 ? `${lessonWord} ללא תשלום` : `${lessonsWord} ללא תשלום`;
      let text =
        `סה״כ ${total} ${lessonNoun}: ${todayCount} מתוכננים להיום, ו־${unpaidCount} ${unpaidNoun}.`;
      if (clientsCount > 0) {
        const people = clientsCount === 1 ? studentWord : studentsWord;
        text += ` ברשימה ${clientsCount} ${people}.`;
      }
      return text;
    },
    todaySectionTitle: (lessonsWord: string) => `${lessonsWord} להיום`,
    emptyTodayTitle: (lessonsWord: string) =>
      `אין ${lessonsWord} מתוכננים להיום`,
    emptyTodayDescription:
      "היום ריק ביומן — אפשר לקבוע שיעור מהיר מהכפתור למעלה.",
    statWeeklyRevenue: "הכנסות השבוע",
    debtListTitle: "חמשת הלקוחות המובילים ביתרה",
    upcomingListTitle: "שיעורים קרובים",
    emptyDebtList: "אין יתרות לגבייה — הכול שולם.",
    emptyUpcoming: "אין שיעורים מתוכננים קדימה — הגיע הזמן לסגור תורים.",
    unpaidBadge: "טרם שולם",
    bookingRequestsTitle: "בקשות הזמנה",
    bookingRequestsEmpty: "אין בקשות עדיין",
    bookingRequesterName: "שם",
    bookingRequesterPhone: "טלפון",
    bookingRequesterDate: "תאריך",
    bookingRequesterTime: "שעה",
    bookingRequesterDateTime: "מועד",
    bookingRequesterStatus: "סטטוס",
    bookingStatusPending: "ממתין",
    bookingStatusConfirmed: "אושר",
    bookingStatusCancelled: "בוטל",
    bookingActionConfirm: "אשר",
    bookingActionCancel: "בטל",
  },

  appointments: {
    listDateLabel: "תאריך:",
    listTimeLabel: "שעה:",
    paymentPrefix: "תשלום: ",
    amountPrefix: "סכום: ",
    phonePrefix: "טלפון: ",
    statusPrefix: "סטטוס: ",
    statusScheduled: "נקבע",
    statusConfirmed: "מאושר",
    statusInProgress: "בתהליך",
    statusCompleted: "הושלם",
    statusCancelled: "בוטל",
    statusNoShow: "לא הגיע",
    delete: "מחיקה",
    edit: "עריכה",
    markPaid: "סמן כשולם",
    markUnpaid: "סמן כטרם שולם",
    tomorrowBadge: "מחר",
    tomorrowBadgeTitle: "שיעור מחר — מתאים לתזכורת",
    paidBadge: "שולם",
    unpaidBadge: "טרם שולם",
    pendingApprovalBadge: "ממתין לאישור",
    approvedRequestBadge: "אושר",
    rejectedRequestBadge: "נדחה",
    approveRequest: "אשר בקשה",
    approveAndSendWhatsapp: "אשר ושלח וואטסאפ",
    rejectRequest: "דחה בקשה",
    approvalWhatsappText: (args: { name: string; dateTime: string }) =>
      `היי ${args.name}, בקשתך אושרה ✅\nנשמח לראות אותך ב-${args.dateTime}.`,
    serviceLabel: "שירות",
    reschedule: "שינוי מועד",
    sendReminder: "תזכורת בוואטסאפ",
    cyclePayment: "סטטוס תשלום",
    quickComplete: "סימון כהושלם",
  },

  paymentsPage: {
    title: "תשלומים ויתרות",
    subtitle: "סיכום מהיר לפי שיעורים ולקוחות",
    totalPaid: "סה״כ שולם",
    totalUnpaid: "יתרה פתוחה",
    debtByClient: "יתרות לפי לקוח",
    emptyDebt: "אין יתרות פתוחות",
    emptyDebtHint: "כשיש שיעורים ללא תשלום מלא, הם יופיעו כאן.",
    reminderCta: "תזכורת תשלום בוואטסאפ",
  },

  dashboardKpi: {
    todayAppointments: "היום ביומן",
    expectedIncome: "צפי גבייה היום",
    unpaidBalance: "יתרה פתוחה",
  },

  reminders: {
    title: "תזכורות למחר",
    workflowTitle: "תזכורות",
    workflowIntro:
      "רשימות לפי סוג — שליחה ידנית בוואטסאפ בלחיצה. סימון «נשלח היום» נשמר במכשיר עד לחיבור אוטומציה לשרת.",
    empty: "מחר אין שיעורים ביומן",
    emptyHint:
      "כשנקבע שיעור למחר, תופיע כאן הודעה מוכנה — או תוכלו לנסח אוטומטית.",
    workflowEmptyTitle: "אין כרגע תזכורות לטיפול",
    workflowEmptyHint:
      "כשיופיעו שיעורים מחר, היום או עם יתרה — הם יוצגו כאן לפי ההגדרות.",
    disabledTitle: "תזכורות כבויות",
    disabledHint: "הפעילו תזכורות בהגדרות כדי לראות רשימות ושליחה בוואטסאפ.",
    allChannelsOffTitle: "כל סוגי התזכורות כבויים",
    allChannelsOffHint: "בחרו לפחות סוג אחד (מחר, היום או תשלום) בהגדרות.",
    openSettings: "מעבר להגדרות תזכורות",
    sectionTomorrow: "מחר",
    sectionSameDay: "היום",
    sectionPayment: "תשלום",
    emptyTomorrowSection: "אין שיעורים מחר",
    emptyTomorrowSectionHint: "כשנקבע שיעור למחר, הוא יופיע כאן.",
    emptySameDaySection: "אין שיעורים עתידיים להיום",
    emptySameDaySectionHint: "שיעורים שעדיין לא התחילו היום יופיעו כאן.",
    emptyPaymentSection: "אין יתרות פתוחות",
    emptyPaymentSectionHint:
      "שיעורים עם תשלום חלקי או שלא שולם יופיעו כאן לתזכורת תשלום.",
    sentTodayBadge: "נשלח היום",
    notSentBadge: "טרם סומן",
    copyWhatsapp: "העתקת הודעה לוואטסאפ",
    copied: "הועתק",
    clipboardError:
      "לא הצלחנו להעתיק — ודאו הרשאות לדפדפן או העתיקו ידנית מהתיבה.",
    templateHint:
      'תבנית לדוגמה: "היי {{name}}, תזכורת לשיעור מחר ב־{{time}}"',
    aiGenerate: "ניסוח עם AI",
    aiGenerating: "מנסחים…",
    aiCopy: "העתקה",
    openWhatsapp: "פתיחת וואטסאפ עם ההודעה",
    automationNote:
      "שליחה אוטומטית ברקע (למשל בלילה) אינה פעילה באפליקציה — השתמשו בכפתור או חברו מאוחר יותר משימה מתוזמנת לשרת.",
  },

  /** כפתורי פעולה — וואטסאפ ללקוח */
  whatsapp: {
    openChat: "פתיחת צ׳אט בוואטסאפ",
    sendMessage: "שליחה בוואטסאפ",
    quickReminder: "תזכורת מהירה",
    paymentPing: "תזכורת תשלום",
    followUp: "מעקב אחרי ביקור",
    listRowChat: "וואטסאפ",
    noPhone: "אין מספר טלפון",
    noPhoneDetail: "הוסיפו מספר בכרטיס הלקוח כדי לשלוח הודעה.",
  },

  clientsPage: {
    /** כפתור לכיווץ טופס הוספת לקוח כשאין עריכה פעילה */
    closeAddPanel: "סגור",
    addClientTeaser: "בלחיצה נפתח טופס — הפרטים יישמרו ברשימת הלקוחות למטה.",
    listEmptyTitle: "אין לקוחות עדיין",
    listEmptyDescription:
      "לחצו על כפתור ההוספה למעלה. הנתונים נשמרים בענן ואז מסתנכרנים לכל המסכים.",
    filterAll: "הכל",
    filterDebt: "עם יתרה",
    filterUpcoming: "עם תור קרוב",
    colDebt: "יתרה",
    colLastVisit: "ביקור אחרון",
    colNext: "הבא בתור",
  },

  clientCard: {
    nextLesson: "הפגישה הבאה",
    noUpcoming: "אין תור מתוכנן",
  },

  clientProfile: {
    overviewTitle: "סיכום מהיר",
    nextAppointment: "התור הבא",
    noNextAppointment: "אין תור עתידי מתוכנן",
    appointmentsHistory: "היסטוריית תורים",
    back: "חזרה לדף הבית",
    notFound: "לא מצאנו את הלקוח",
    notFoundHint:
      "אולי הרשומה נמחקה או שהקישור לא מעודכן. חזרו לרשימה בדף הבית.",
    lessonsTotal: "סה״כ שיעורים",
    paidTotal: "שולם (סה״כ)",
    unpaidTotal: "טרם שולם (סה״כ)",
    debtTitle: "יתרה לגבייה",
    paymentSummaryTitle: "סיכום תשלומים",
    detailsTitle: "פרטים",
    appointmentsTitle: "שיעורים",
    appointmentsEmptyTitle: "עדיין אין שיעורים ללקוח הזה",
    appointmentsEmptyHint:
      "חזרו לדף הבית או למסך השיעורים כדי לקבוע את הפגישה הראשונה.",
    lastLesson: "שיעור אחרון",
    noLastLesson: "אין שיעור קודם ברשומה",
    openWhatsapp: "שליחה בוואטסאפ",
    debtWhatsappHint: "תזכורת ידידותית על יתרה",
  },

  nav: {
    home: "בית",
    back: "חזרה",
    brand: "ServiceOS",
    dashboard: "ראשי",
    clients: "לקוחות",
    lessons: "שיעורים",
    payments: "תשלומים",
    booking: "הזמנה",
    teachers: "מורים",
    settings: "הגדרות",
    teacherContext: "הקשר מורה",
  },

  pwa: {
    installRegionLabel: "התקנה על המסך",
    installTitle: "הוספת ServiceOS למסך הבית",
    installChromeBody:
      "תקבלו אייקון מהיר, ופתיחה נוחה יותר כמו באפליקציה.",
    installIosBody:
      "ב־Safari: לחצו על שיתוף ובחרו «הוסף למסך הבית».",
    installAction: "הוספה",
    installDismiss: "לא עכשיו",
    offlineTitle: "אין חיבור לאינטרנט",
    offlineBody:
      "לא ניתן לטעון את העמוד מהרשת. נתונים שכבר נטענו במכשיר עשויים להישאר זמינים לזמן מה.",
    offlineRetry: "נסו שוב",
    offlineHome: "דף הבית",
    offlineStatusOnline: "מחוברים",
    offlineStatusOffline: "לא מקוונים",
  },

  list: {
    profile: "כרטיס לקוח",
    edit: "עריכה",
    delete: "מחיקה",
    /** Quick action on client card — opens add-lesson form with client pre-selected */
    addLessonForClient: "קביעת שיעור",
  },

  /** דף ההזמנה הציבורי (/book/[slug]) והטפסים שלו */
  publicBooking: {
    pageTitle: "קביעת שיעור נהיגה",
    pageSubtitle:
      "בוחרים תאריך ושעה פנויה, משאירים פרטים — ואנחנו מאשרים ומעדכנים אתכם.",
    /** Short hero line — mobile conversion */
    heroSubtitle: "קבעו תור תוך פחות מדקה",
    /** One-line trust under hero */
    heroTrustMicro: "אישור מהיר • קל ופשוט • מותאם לנייד",
    trustNoCalls: "בלי צורך בשיחות טלפון",
    trustQuickConfirm: "אישור מהיר",
    trustPrivacy: "הפרטים נשמרים אישית ומאובטחים",
    sectionServices: "בחירת שירות",
    serviceRequiredSelect: "נא לבחור שירות מהרשימה.",
    durationMinutesShort: "דק׳",
    priceFormatted: "₪{price}",
    whatsappHelper: "נאשר את התור בוואטסאפ בהקדם",
    addToCalendarSoon: "הוספה ליומן (בקרוב)",
    successSummaryTitle: "סיכום התור",
    summaryDate: "תאריך",
    summaryTime: "שעה",
    trustLine:
      "המועד נשמר כבקשה. ניצור קשר לאישור סופי או שינוי — אין חיוב מהדף הזה.",
    sectionDate: "בחירת מועד",
    sectionContact: "פרטים לאישור ויצירת קשר",
    sectionContactShort: "פרטי קשר",
    dateLabel: "תאריך",
    bookingClosed:
      "ההזמנה המקוונת סגורה כרגע. אפשר לנסות שוב מאוחר יותר או לפנות ישירות לעסק.",
    bookingDataIncomplete:
      "לא הצלחנו לטעון את הגדרות הזמינות. נסו שוב בעוד רגע או פנו לעסק.",
    /** Business tenant could not be resolved for this booking link */
    businessNotFound: "העסק לא נמצא",
    businessScopeError:
      "לא ניתן לטעון את פרטי העסק לקישור הזה. פנו לעסק או נסו שוב מאוחר יותר.",
    slotHeading: "שעות פנויות",
    slotEmptyTitle: "אין בשעה הזו שעות פנויות",
    slotEmptyDescription: "נסו תאריך אחר באותו השבוע, או חזרו מחר לבדיקה.",
    selectedSlotLabel: "שעה שנבחרה",
    noSlotSelected: "עדיין לא נבחרה שעה",
    successTitle: "הבקשה נשלחה בהצלחה, ניצור איתך קשר בקרוב",
    inlineSuccess: "הבקשה נרשמה במערכת. נעדכן אתכם לאישור.",
    whatsappConfirmButton: "שלח אישור בוואטסאפ",
    bookAnotherButton: "קביעת שיעור נוסף",
    slotsEmptyShort: "אין זמנים פנויים",
    toastSubmitFailed: "לא הצלחנו לשלוח את הבקשה. נסו שוב.",
    toastNetworkError: "בעיית חיבור. בדקו את הרשת ונסו שוב.",
    fullNameLabel: "שם מלא",
    phoneLabel: "טלפון",
    notesLabel: "הערות (רשות)",
    pickupLabel: "מיקום איסוף (רשות)",
    carLabel: "סוג רכב / גיר (רשות)",
    pickupPlaceholder: "למשל: כתובת או שכונה",
    carPlaceholder: "למשל: אוטומט, ידני",
    submitSubmitting: "שולחים את הבקשה…",
    submitIdle: "שליחת בקשה לקביעת שיעור",
    errFullName: "נא למלא שם מלא.",
    errFullNameShort: "נא למלא שם מלא (לפחות שני תווים).",
    errPhone: "נא למלא מספר טלפון לחזרה.",
    errPhoneInvalid: "נא להזין מספר טלפון תקין (לפחות 8 ספרות).",
    errSlot: "בחרו תאריך ושעה מהרשימה לפני השליחה.",
    errInvalidPayload: "משהו בשליחה לא הסתדר. רעננו את הדף ונסו שוב.",
    errSlotInvalid: "המועד שנבחר לא תקין. בחרו שעה מחדש מהרשימה.",
    errSlotRange: "השעות שנבחרו לא מתאימות. בחרו מועד מהאפשרויות באתר.",
    errSlotPast: "השעה כבר עברה. בחרו מועד עתידי מהרשימה.",
    errUnavailable: "ההזמנה דרך האתר אינה זמינה כרגע. פנו לעסק ישירות או נסו שוב מאוחר יותר.",
    errSaveFailed: "לא הצלחנו לרשום את הבקשה. נסו שוב או בחרו מועד אחר.",
    errNetwork: "נתקענו בחיבור לרשת. בדקו אינטרנט ונסו שוב.",
    errSlotTaken:
      "השעה נתפסה רגע לפני כן על ידי מישהו אחר. בחרו מועד פנוי אחר.",
    errDateNotInRange:
      "לא ניתן להזמין את התאריך הזה לפי מדיניות ההזמנות של העסק. בחרו תאריך אחר.",
    errServerGeneric:
      "לא הצלחנו להשלים את הרישום. נסו שוב בעוד רגע או פנו לעסק.",
    /** קישור /book/[slug] שגוי או שלא הוגדר מורה עם המזהה הזה */
    invalidSlugTitle: "הקישור להזמנה אינו תקין",
    invalidSlugDescription:
      "ייתכן שהקישור פגום או שהמורה לא קיים במערכת. בקשו מהעסק קישור עדכני או נסו שוב.",
    invalidSlugMessage:
      "הקישור להזמנה אינו תקין. בקשו מהמורה או מהעסק קישור עדכני.",
    bootstrapLoadFailedTitle: "לא הצלחנו לטעון את דף ההזמנה",
    /** /book ללא slug */
    incompleteLinkTitle: "חסר מזהה מורה בקישור",
    incompleteLinkDescription:
      "ההזמנה המקוונת פועלת דרך קישור אישי לכל מורה. השתמשו בקישור המלא שנשלח אליכם (למשל מהודעה או מהעסק).",
  },
} as const;
