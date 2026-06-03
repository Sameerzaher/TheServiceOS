export const PRODUCT_BRANDING = {
  // Product name & tagline
  name: "תור פה",
  nameEn: "TorPo",
  tagline: "מערכת ניהול תורים חכמה ומהירה לעסקים קטנים",
  taglineEn: "Smart & Fast Appointment Management for Small Businesses",
  
  // Emoji/Icon
  icon: "📅",
  
  // Target audiences with enhanced icons
  audiences: [
    { id: "driving_instructor", label: "מורי נהיגה", icon: "🚗" },
    { id: "cosmetic_clinic", label: "מרפאות קוסמטיקה", icon: "💉" },
    { id: "personal_trainer", label: "מאמנים אישיים", icon: "💪" },
    { id: "tutoring", label: "מורים פרטיים", icon: "📚" },
    { id: "beauty_salon", label: "מעצבי שיער", icon: "✂️" },
  ],
  
  /** Legacy list — still used in some previews */
  benefits: [
    "📱 הזמנת תורים אונליין 24/7",
    "📆 ניהול יומן אוטומטי וחכם",
    "💬 התראות ווטסאפ אוטומטיות",
  ],

  /** Emotional owner pitch (headline EN + body HE for local market) */
  ownerPitchBenefits: [
    {
      icon: "📈",
      headline: "Get more clients",
      body: "לקוחות קובעים לבד — גם כשאתם לא ליד הטלפון. פחות פספוסים, יותר תורים סגורים.",
    },
    {
      icon: "⏱️",
      headline: "Save time",
      body: "פחות בלגן ביומן ובהודעות. יותר זמן לעבודה שבאמת מכניסה כסף.",
    },
    {
      icon: "📵",
      headline: "No phone calls",
      body: "פחות שיחות חוזרות. הלקוחות מבינים לבד, ואתם שומעים רק את מה שחשוב — בווטסאפ.",
    },
  ],

  /** Onboarding / signup reassurance */
  setupTimeLabel: "Setup takes 2 minutes",
  setupTimeLabelHe: "ההתחלה לוקחת בערך 2 דקות",
  
  // Social proof
  socialProof: {
    monthlyBookings: "1,200+",
    activeBusinesses: "50+",
    avgRating: 4.9,
  },
  
  // Contact & support
  contact: {
    email: "hello@torpo.co.il",
    phone: "050-000-0000",
    whatsapp: "972500000000",
  },
  
  // Social links
  social: {
    facebook: "https://facebook.com/torpo",
    instagram: "https://instagram.com/torpo.app",
    linkedin: "https://linkedin.com/company/torpo",
  },
} as const;

export type AudienceId = typeof PRODUCT_BRANDING.audiences[number]["id"];
