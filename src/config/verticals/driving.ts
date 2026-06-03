import {
  CustomFieldInputKind,
  type VerticalPreset,
} from "@/core/types/vertical";

/** Driving instructor — students, lessons, pickup & transmission on bookings. */
export const drivingVerticalPreset = {
  id: "driving_instructor",
  slug: "driving_instructor",
  labels: {
    student: "תלמיד",
    students: "תלמידים",
    client: "לקוח",
    clients: "לקוחות",
    lesson: "שיעור",
    lessons: "שיעורים",
    addStudent: "הוספת תלמיד",
    addLesson: "קביעת שיעור",
    editStudent: "עריכת תלמיד",
    nextLesson: "שיעור הבא",
    transmission: "תיבת הילוכים",
    pickup: "איסוף",
    vehicle: "רכב",
    appTitle: "ניהול",
    appTagline:
      "יומן, לקוחות ותזכורות במקום אחד — מוכנים ליום עבודה אמיתי.",
  },
  clientFields: [
    {
      key: "lessonCount",
      label: "מספר שיעורים",
      kind: CustomFieldInputKind.Number,
      required: false,
    },
  ],
  appointmentFields: [
    {
      key: "pickupLocation",
      label: "מיקום איסוף",
      kind: CustomFieldInputKind.TextArea,
      required: false,
    },
    {
      key: "transmissionType",
      label: "סוג הילוכים",
      kind: CustomFieldInputKind.Select,
      required: false,
      options: ["ידני", "אוטומט"] as const,
    },
  ],
  publicBookingFields: [
    {
      key: "pickupLocation",
      label: "מיקום איסוף",
      kind: CustomFieldInputKind.TextArea,
      required: false,
    },
    {
      key: "transmissionType",
      label: "סוג הילוכים",
      kind: CustomFieldInputKind.Select,
      required: true,
      options: ["ידני", "אוטומט"] as const,
    },
  ],
  defaultServices: [
    {
      name: "שיעור נהיגה (40 דקות)",
      duration: 40,
      price: 0,
    },
    {
      name: "שיעור כפול (80 דקות)",
      duration: 80,
      price: 0,
    },
  ],
} satisfies VerticalPreset;

export type DrivingVerticalPreset = typeof drivingVerticalPreset;
