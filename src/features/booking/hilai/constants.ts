import type { PublicBookingFormCopy } from "@/features/booking/components/PublicBookingForm";

/** Public booking slug for the Hilai Nails demo tenant. */
export const HILAI_NAILS_SLUG = "hilai-nails" as const;

export const HILAI_NAILS_SERVICES: readonly string[] = [
  "מניקור",
  "מבנה אנטומי",
  "בנייה בטיפסים הפוכים",
  "חיזוק בג׳ל",
  "תיקון ציפורן",
  "קישוטים",
] as const;

/** Emoji per service — aligned with `HILAI_NAILS_SERVICES` order */
export const HILAI_SERVICE_EMOJI: Record<string, string> = {
  מניקור: "💅",
  "מבנה אנטומי": "✨",
  "בנייה בטיפסים הפוכים": "🌸",
  "חיזוק בג׳ל": "💎",
  "תיקון ציפורן": "🩷",
  קישוטים: "✨",
};

/** English display labels (stored value stays Hebrew for `treatmentType`). */
export const HILAI_SERVICE_LABEL_EN: Record<string, string> = {
  מניקור: "Manicure",
  "מבנה אנטומי": "Anatomy structure",
  "בנייה בטיפסים הפוכים": "Sculpted extensions",
  "חיזוק בג׳ל": "Gel strengthening",
  "תיקון ציפורן": "Nail repair",
  קישוטים: "Nail art & accents",
};

/** Premium English booking UI — conversion-focused */
export const HILAI_PREMIUM = {
  heroHeadline: "Book your appointment in 30 seconds",
  heroSub: "No calls, no waiting",
  /** Shown under hero — conversion microcopy */
  heroTrustMicro: "Fast confirmation • Easy booking • Mobile friendly",
  galleryHeading: "Fresh from the studio",
  reviewsHeading: "Loved by regulars",
  sectionServices: "Choose your service",
  sectionDate: "Pick a date & time",
  sectionContact: "Almost there",
  dateLabel: "Pick a date",
  slotIntro: "Available times",
  slotEmptyTitle: "No open slots that day",
  slotEmptyDescription:
    "Try another date this week, or check back soon — openings update often.",
  bookingClosedFriendly:
    "Online booking is paused for a moment. Please try again later or message the studio.",
  serviceRequired: "Please choose a service to continue.",
  submitCta: "Book Now",
  ctaHelper: "We’ll confirm your booking via WhatsApp.",
  trustLine: "Real studio · Real results · Zero hassle",
  /** Shown when today is selected and slots exist (honest scarcity) */
  urgencyLimitedToday: "Limited slots today",
  urgencyLimitedTodaySub: "Popular times go fast — grab yours now.",
  studioWhatsAppCta: "Questions? WhatsApp the studio",
  trustNoCalls: "No phone calls needed",
  trustQuickConfirm: "Quick confirmation",
  trustPrivacy: "Your details stay private",
} as const;

export const HILAI_GALLERY_IMAGES: readonly { src: string; alt: string }[] = [
  {
    src: "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=720&q=80",
    alt: "Elegant manicured nails with soft pink polish",
  },
  {
    src: "https://images.unsplash.com/photo-1519014816548-bf646fa0462b?auto=format&fit=crop&w=720&q=80",
    alt: "Nail artist working in a bright studio",
  },
  {
    src: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=720&q=80",
    alt: "Close-up of detailed nail art",
  },
  {
    src: "https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=720&q=80",
    alt: "Hands with polished nails in natural light",
  },
] as const;

export const HILAI_PREMIUM_REVIEWS: readonly {
  id: string;
  name: string;
  rating: number;
  text: string;
}[] = [
  {
    id: "1",
    name: "Maya R.",
    rating: 5,
    text: "Flawless gel every time — I book from my phone and skip the WhatsApp thread.",
  },
  {
    id: "2",
    name: "Linoy K.",
    rating: 5,
    text: "So fast. Picked a slot at night and got confirmed the same day. Feels premium.",
  },
  {
    id: "3",
    name: "Noa S.",
    rating: 5,
    text: "Warm studio vibe, zero chaos. This is how booking should feel.",
  },
];

export const HILAI_SUCCESS_COPY = {
  successTitle: "You’re booked — we’ll be in touch shortly",
  inlineSuccess:
    "Your request is saved. We’ll confirm or suggest another time if needed.",
  whatsappConfirmButton: "Message on WhatsApp",
  bookAnotherButton: "Book another visit",
  successSummaryTitle: "Your visit",
  summaryDate: "Date",
  summaryTime: "Time",
  addToCalendarSoon: "Add to calendar (coming soon)",
} as const;

export const HILAI_PREMIUM_FORM_COPY = {
  labels: {
    selectedSlot: "Your time",
    noSlotSelected: "Choose a time to continue",
    fullName: "Full name",
    phone: "Mobile number",
    notes: "Notes (optional)",
  },
  messages: {
    errFullName: "Please enter your name.",
    errFullNameShort: "Name should be at least 2 characters.",
    errPhone: "Please add a phone number we can reach you on.",
    errPhoneInvalid: "Please enter a valid phone number (at least 8 digits).",
    errSlot: "Pick a date and time before continuing.",
    errSlotInvalid: "That time isn’t valid anymore. Choose another slot.",
    errSlotTaken: "Someone just grabbed that slot. Please pick another time.",
  },
  submitSubmitting: "Sending your request…",
} as const satisfies PublicBookingFormCopy;
