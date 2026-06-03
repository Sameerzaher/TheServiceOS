import {
  CustomFieldInputKind,
  type VerticalPreset,
} from "@/core/types/vertical";

/** Cosmetic clinic / doctor — patients, appointments as תור / טיפול. */
export const cosmeticClinicVerticalPreset = {
  id: "cosmetic_clinic",
  slug: "cosmetic_clinic",
  labels: {
    student: "מטופל",
    students: "מטופלים",
    client: "לקוח",
    clients: "לקוחות",
    lesson: "תור",
    lessons: "תורים",
    treatment: "טיפול",
    treatments: "טיפולים",
    addStudent: "הוספת מטופל",
    addLesson: "קביעת תור",
    editStudent: "עריכת מטופל",
    nextLesson: "התור הבא",
    appTitle: "ניהול",
    appTagline:
      "מטופלים, תורים ותזכורות — נעים לנהל, קל לשמור על סדר.",
  },
  clientFields: [],
  appointmentFields: [
    {
      key: "treatmentType",
      label: "סוג טיפול",
      kind: CustomFieldInputKind.Text,
      required: false,
    },
    {
      key: "treatmentArea",
      label: "אזור טיפול",
      kind: CustomFieldInputKind.Text,
      required: false,
    },
  ],
  publicBookingFields: [
    {
      key: "treatmentType",
      label: "סוג טיפול / שירות מבוקש",
      kind: CustomFieldInputKind.Text,
      required: false,
    },
    {
      key: "treatmentArea",
      label: "אזור בגוף / פנים",
      kind: CustomFieldInputKind.Text,
      required: false,
    },
  ],
  defaultServices: [
    {
      name: "ייעוץ והערכה (30 דקות)",
      duration: 30,
      price: 0,
    },
    {
      name: "טיפול (60 דקות)",
      duration: 60,
      price: 0,
    },
  ],
} satisfies VerticalPreset;

export type CosmeticClinicVerticalPreset = typeof cosmeticClinicVerticalPreset;
