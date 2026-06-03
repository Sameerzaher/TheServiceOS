import {
  DEFAULT_MVP_TEACHER_ID,
  getSupabaseDefaultTeacherId,
} from "@/core/config/supabaseEnv";
import {
  type BusinessType,
  coerceBusinessType,
  DEFAULT_BUSINESS_TYPE,
} from "@/core/types/teacher";

/** Stored preferences key; values match `BusinessType` / `VERTICAL_REGISTRY` keys. */
export type ActivePreset = BusinessType;

/** App preferences stored locally (no backend yet). */
export interface AppSettings {
  /** Owning teacher for this settings row / tenant scope. */
  teacherId: string;
  /** Active industry preset — drives labels and custom fields in the UI. */
  activePreset: ActivePreset;
  /** Shown in header and exports; e.g. "בית ספר לנהיגה — דני". */
  businessName: string;
  /** Owner/teacher display name for outgoing communication. */
  teacherName: string;
  /** Default amount (₪) for new lessons in the form. */
  defaultLessonPrice: number;
  /** Suggested lesson length (minutes); used for end-time hint in the form. */
  defaultLessonDurationMinutes: number;
  /** Minutes to leave between lessons (operational planning hint). */
  lessonBufferMinutes: number;
  /** Default working day start (HH:mm). */
  workingHoursStart: string;
  /** Default working day end (HH:mm). */
  workingHoursEnd: string;
  /** Business contact for reminders (WhatsApp / SMS). */
  businessPhone: string;
  /** Master switch — dashboard reminder workflow and suggested queue (manual send until server jobs exist). */
  remindersEnabled: boolean;
  /** Include “tomorrow” appointments in the reminder workflow. */
  reminderTomorrow: boolean;
  /** Include same-day (today, still upcoming) appointments. */
  reminderSameDay: boolean;
  /** Include appointments with outstanding payment in the payment reminder list. */
  reminderPaymentUnpaid: boolean;
  /** WhatsApp template for tomorrow + default same-day; supports {{name}}, {{date}}, {{time}}, {{businessName}}, {{businessPhone}}, {{amountDue}}. */
  reminderTemplate: string;
  /** Optional override for same-day copy; when empty, {@link reminderTemplate} is used. */
  sameDayReminderTemplate: string;
  /** Template for payment reminders; {{amountDue}} is formatted (e.g. ₪120). */
  paymentReminderTemplate: string;
  /** Public HTTPS URL to a square logo (shown on the client booking page). */
  brandLogoUrl: string;
  /** Primary brand color (#RRGGBB) for booking page accents. */
  brandPrimaryColor: string;
  /** Secondary / CTA accent (#RRGGBB). */
  brandAccentColor: string;
  /** ISO timestamp when the owner finished the signup onboarding wizard (optional). */
  ownerOnboardingCompletedAt: string | null;
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  teacherId: DEFAULT_MVP_TEACHER_ID,
  activePreset: DEFAULT_BUSINESS_TYPE,
  businessName: "",
  teacherName: "",
  defaultLessonPrice: 0,
  defaultLessonDurationMinutes: 45,
  lessonBufferMinutes: 0,
  workingHoursStart: "09:00",
  workingHoursEnd: "17:00",
  businessPhone: "",
  remindersEnabled: true,
  reminderTomorrow: true,
  reminderSameDay: true,
  reminderPaymentUnpaid: true,
  reminderTemplate: "היי {{name}}, תזכורת לשיעור מחר ב-{{time}}",
  sameDayReminderTemplate: "",
  paymentReminderTemplate:
    "היי {{name}}, תזכורת ידידותית: עדיין יש לנו יתרה של {{amountDue}} — {{businessName}}",
  brandLogoUrl: "",
  brandPrimaryColor: "#059669",
  brandAccentColor: "#0d9488",
  ownerOnboardingCompletedAt: null,
};

function clampDurationMinutes(n: number): number {
  return Math.min(240, Math.max(15, Math.round(n)));
}

function coerceNonNegativeNumber(v: unknown, fallback: number): number {
  if (typeof v === "number" && Number.isFinite(v)) {
    return Math.max(0, v);
  }
  if (typeof v === "string") {
    const n = parseFloat(v.replace(",", ".").trim());
    if (Number.isFinite(n)) return Math.max(0, n);
  }
  return fallback;
}

function coerceActivePreset(v: unknown): ActivePreset {
  if (v === "driving_instructor" || v === "cosmetic_clinic") {
    return v;
  }
  /** Migrate legacy preset keys from earlier pilots. */
  if (v === "driving") return "driving_instructor";
  if (v === "beauty" || v === "fitness") return "cosmetic_clinic";
  return coerceBusinessType(v);
}

function coerceDurationMinutes(v: unknown, fallback: number): number {
  const n =
    typeof v === "number" && Number.isFinite(v)
      ? v
      : typeof v === "string"
        ? parseFloat(v.replace(",", ".").trim())
        : NaN;
  if (!Number.isFinite(n)) return fallback;
  return clampDurationMinutes(n);
}

function coerceBufferMinutes(v: unknown, fallback: number): number {
  const n =
    typeof v === "number" && Number.isFinite(v)
      ? v
      : typeof v === "string"
        ? parseFloat(v.replace(",", ".").trim())
        : Number.NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.min(120, Math.max(0, Math.round(n)));
}

function coerceHHmm(v: unknown, fallback: string): string {
  if (typeof v !== "string") return fallback;
  const next = v.trim();
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(next) ? next : fallback;
}

function coerceHttpUrl(v: unknown): string {
  if (typeof v !== "string") return "";
  const t = v.trim();
  if (t.length === 0) return "";
  if (!/^https:\/\//i.test(t)) return "";
  try {
    const u = new URL(t);
    return u.protocol === "https:" ? t : "";
  } catch {
    return "";
  }
}

function coerceHexColor(v: unknown, fallback: string): string {
  if (typeof v !== "string") return fallback;
  const t = v.trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(t)) return t;
  if (/^#[0-9A-Fa-f]{3}$/.test(t)) return t;
  return fallback;
}

function coerceBool(v: unknown, fallback: boolean): boolean {
  if (typeof v === "boolean") return v;
  if (v === "true") return true;
  if (v === "false") return false;
  return fallback;
}

function coerceOptionalIsoTimestamp(v: unknown): string | null {
  if (v === undefined || v === null) return null;
  if (typeof v !== "string") return null;
  const t = v.trim();
  if (!t) return null;
  const d = Date.parse(t);
  if (Number.isNaN(d)) return null;
  return new Date(d).toISOString();
}

/**
 * Merges persisted or partial settings with defaults (migration-safe).
 */
export function normalizeAppSettings(raw: unknown): AppSettings {
  if (!raw || typeof raw !== "object") {
    return { ...DEFAULT_APP_SETTINGS };
  }
  const o = raw as Record<string, unknown>;
  const template =
    typeof o.reminderTemplate === "string"
      ? o.reminderTemplate.trim() || DEFAULT_APP_SETTINGS.reminderTemplate
      : DEFAULT_APP_SETTINGS.reminderTemplate;

  const sameDayTemplate =
    typeof o.sameDayReminderTemplate === "string"
      ? o.sameDayReminderTemplate
      : DEFAULT_APP_SETTINGS.sameDayReminderTemplate;

  const paymentTemplate =
    typeof o.paymentReminderTemplate === "string"
      ? o.paymentReminderTemplate.trim() ||
        DEFAULT_APP_SETTINGS.paymentReminderTemplate
      : DEFAULT_APP_SETTINGS.paymentReminderTemplate;

  const teacherIdRaw = typeof o.teacherId === "string" ? o.teacherId.trim() : "";
  const teacherId =
    teacherIdRaw.length > 0 ? teacherIdRaw : getSupabaseDefaultTeacherId();

  return {
    teacherId,
    activePreset: coerceActivePreset(o.activePreset),
    businessName: typeof o.businessName === "string" ? o.businessName : "",
    teacherName: typeof o.teacherName === "string" ? o.teacherName : "",
    defaultLessonPrice: coerceNonNegativeNumber(
      o.defaultLessonPrice,
      DEFAULT_APP_SETTINGS.defaultLessonPrice,
    ),
    defaultLessonDurationMinutes: coerceDurationMinutes(
      o.defaultLessonDurationMinutes,
      DEFAULT_APP_SETTINGS.defaultLessonDurationMinutes,
    ),
    lessonBufferMinutes: coerceBufferMinutes(
      o.lessonBufferMinutes,
      DEFAULT_APP_SETTINGS.lessonBufferMinutes,
    ),
    workingHoursStart: coerceHHmm(
      o.workingHoursStart,
      DEFAULT_APP_SETTINGS.workingHoursStart,
    ),
    workingHoursEnd: coerceHHmm(
      o.workingHoursEnd,
      DEFAULT_APP_SETTINGS.workingHoursEnd,
    ),
    businessPhone: typeof o.businessPhone === "string" ? o.businessPhone : "",
    remindersEnabled: coerceBool(
      o.remindersEnabled,
      DEFAULT_APP_SETTINGS.remindersEnabled,
    ),
    reminderTomorrow: coerceBool(
      o.reminderTomorrow,
      DEFAULT_APP_SETTINGS.reminderTomorrow,
    ),
    reminderSameDay: coerceBool(
      o.reminderSameDay,
      DEFAULT_APP_SETTINGS.reminderSameDay,
    ),
    reminderPaymentUnpaid: coerceBool(
      o.reminderPaymentUnpaid,
      DEFAULT_APP_SETTINGS.reminderPaymentUnpaid,
    ),
    reminderTemplate: template,
    sameDayReminderTemplate: sameDayTemplate,
    paymentReminderTemplate: paymentTemplate,
    brandLogoUrl: coerceHttpUrl(o.brandLogoUrl),
    brandPrimaryColor: coerceHexColor(
      o.brandPrimaryColor,
      DEFAULT_APP_SETTINGS.brandPrimaryColor,
    ),
    brandAccentColor: coerceHexColor(
      o.brandAccentColor,
      DEFAULT_APP_SETTINGS.brandAccentColor,
    ),
    ownerOnboardingCompletedAt: coerceOptionalIsoTimestamp(
      o.ownerOnboardingCompletedAt,
    ),
  };
}
