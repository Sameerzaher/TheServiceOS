import {
  DEFAULT_MVP_TEACHER_ID,
  getSupabaseDefaultTeacherId,
} from "@/core/config/supabaseEnv";

/** Local time in 24h format (HH:mm). */
export type LocalTimeString = string;

export type WeekdayKey =
  | "sunday"
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday";

export interface DayAvailability {
  enabled: boolean;
  startTime: LocalTimeString;
  endTime: LocalTimeString;
}

/** Weekly availability with all seven days required. */
export interface WeeklyAvailability {
  sunday: DayAvailability;
  monday: DayAvailability;
  tuesday: DayAvailability;
  wednesday: DayAvailability;
  thursday: DayAvailability;
  friday: DayAvailability;
  saturday: DayAvailability;
}

export interface AvailabilitySettings {
  /** Owning teacher for this availability / booking row. */
  teacherId: string;
  bookingEnabled: boolean;
  slotDurationMinutes: number;
  daysAhead: number;
  weeklyAvailability: WeeklyAvailability;
  enableAutoReminders?: boolean;
  reminder24hBefore?: boolean;
  reminder1hBefore?: boolean;
  reminderCustomMessage?: string;
}

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
const MIN_SLOT_DURATION_MINUTES = 15;
const MAX_SLOT_DURATION_MINUTES = 180;
const MIN_DAYS_AHEAD = 1;
const MAX_DAYS_AHEAD = 365;

const DEFAULT_DAY: DayAvailability = {
  enabled: false,
  startTime: "09:00",
  endTime: "17:00",
};

export const DEFAULT_AVAILABILITY_SETTINGS: AvailabilitySettings = {
  teacherId: DEFAULT_MVP_TEACHER_ID,
  bookingEnabled: false,
  slotDurationMinutes: 45,
  daysAhead: 30,
  enableAutoReminders: false,
  reminder24hBefore: true,
  reminder1hBefore: true,
  reminderCustomMessage: "",
  weeklyAvailability: {
    sunday: { ...DEFAULT_DAY, enabled: true },
    monday: { ...DEFAULT_DAY, enabled: true },
    tuesday: { ...DEFAULT_DAY, enabled: true },
    wednesday: { ...DEFAULT_DAY, enabled: true },
    thursday: { ...DEFAULT_DAY, enabled: true },
    friday: { ...DEFAULT_DAY, enabled: false },
    saturday: { ...DEFAULT_DAY, enabled: false },
  },
};

/** Sunday–Thursday 09:00–14:00; Friday/Saturday off (Israel-oriented work week). */
export function defaultWeeklyAvailabilityNewTeacher(): WeeklyAvailability {
  const workDay: DayAvailability = {
    enabled: true,
    startTime: "09:00",
    endTime: "14:00",
  };
  const off: DayAvailability = {
    enabled: false,
    startTime: "09:00",
    endTime: "14:00",
  };
  return {
    sunday: { ...workDay },
    monday: { ...workDay },
    tuesday: { ...workDay },
    wednesday: { ...workDay },
    thursday: { ...workDay },
    friday: { ...off },
    saturday: { ...off },
  };
}

/** Defaults for newly provisioned teachers (public booking + dashboard). */
export function buildDefaultBookingSettingsForNewTeacher(
  teacherId: string,
): AvailabilitySettings {
  const tid = typeof teacherId === "string" ? teacherId.trim() : "";
  return {
    teacherId: tid,
    bookingEnabled: true,
    slotDurationMinutes: 60,
    daysAhead: 14,
    weeklyAvailability: defaultWeeklyAvailabilityNewTeacher(),
    enableAutoReminders: false,
    reminder24hBefore: true,
    reminder1hBefore: true,
    reminderCustomMessage: "",
  };
}

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

/** Postgres/JSON sometimes yields non-boolean types — avoids toggles snapping back. */
function coerceBool(v: unknown, fallback: boolean): boolean {
  if (typeof v === "boolean") return v;
  if (v === null || v === undefined) return fallback;
  if (typeof v === "number" && Number.isFinite(v)) return v !== 0;
  if (typeof v === "string") {
    const t = v.trim().toLowerCase();
    if (t === "true" || t === "1" || t === "t" || t === "yes") return true;
    if (t === "false" || t === "0" || t === "f" || t === "no") return false;
  }
  return fallback;
}

function coerceClampedInt(
  v: unknown,
  fallback: number,
  min: number,
  max: number,
): number {
  const n =
    typeof v === "number"
      ? v
      : typeof v === "string"
        ? Number.parseInt(v.trim(), 10)
        : Number.NaN;
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

function normalizeLocalTime(
  v: unknown,
  fallback: LocalTimeString,
): LocalTimeString {
  if (typeof v !== "string") return fallback;
  const next = v.trim();
  return TIME_PATTERN.test(next) ? next : fallback;
}

function normalizeDayAvailability(
  raw: unknown,
  fallback: DayAvailability,
): DayAvailability {
  if (!isRecord(raw)) return { ...fallback };
  return {
    enabled:
      typeof raw.enabled === "boolean" ? raw.enabled : fallback.enabled,
    startTime: normalizeLocalTime(raw.startTime, fallback.startTime),
    endTime: normalizeLocalTime(raw.endTime, fallback.endTime),
  };
}

/**
 * Merges persisted or partial availability settings with defaults.
 * Always returns all 7 weekdays with safe values.
 */
export function normalizeAvailabilitySettings(raw: unknown): AvailabilitySettings {
  if (!isRecord(raw)) {
    return {
      ...DEFAULT_AVAILABILITY_SETTINGS,
      weeklyAvailability: { ...DEFAULT_AVAILABILITY_SETTINGS.weeklyAvailability },
    };
  }

  const weeklyRaw = isRecord(raw.weeklyAvailability)
    ? raw.weeklyAvailability
    : {};
  const defaults = DEFAULT_AVAILABILITY_SETTINGS.weeklyAvailability;

  const teacherIdRaw =
    typeof raw.teacherId === "string" ? raw.teacherId.trim() : "";
  const teacherId =
    teacherIdRaw.length > 0 ? teacherIdRaw : getSupabaseDefaultTeacherId();

  return {
    teacherId,
    bookingEnabled: coerceBool(
      raw.bookingEnabled,
      DEFAULT_AVAILABILITY_SETTINGS.bookingEnabled,
    ),
    slotDurationMinutes: coerceClampedInt(
      raw.slotDurationMinutes,
      DEFAULT_AVAILABILITY_SETTINGS.slotDurationMinutes,
      MIN_SLOT_DURATION_MINUTES,
      MAX_SLOT_DURATION_MINUTES,
    ),
    daysAhead: coerceClampedInt(
      raw.daysAhead,
      DEFAULT_AVAILABILITY_SETTINGS.daysAhead,
      MIN_DAYS_AHEAD,
      MAX_DAYS_AHEAD,
    ),
    weeklyAvailability: {
      sunday: normalizeDayAvailability(weeklyRaw.sunday, defaults.sunday),
      monday: normalizeDayAvailability(weeklyRaw.monday, defaults.monday),
      tuesday: normalizeDayAvailability(weeklyRaw.tuesday, defaults.tuesday),
      wednesday: normalizeDayAvailability(
        weeklyRaw.wednesday,
        defaults.wednesday,
      ),
      thursday: normalizeDayAvailability(
        weeklyRaw.thursday,
        defaults.thursday,
      ),
      friday: normalizeDayAvailability(weeklyRaw.friday, defaults.friday),
      saturday: normalizeDayAvailability(weeklyRaw.saturday, defaults.saturday),
    },
    enableAutoReminders: coerceBool(
      raw.enableAutoReminders,
      DEFAULT_AVAILABILITY_SETTINGS.enableAutoReminders ?? false,
    ),
    reminder24hBefore: coerceBool(
      raw.reminder24hBefore,
      DEFAULT_AVAILABILITY_SETTINGS.reminder24hBefore ?? true,
    ),
    reminder1hBefore: coerceBool(
      raw.reminder1hBefore,
      DEFAULT_AVAILABILITY_SETTINGS.reminder1hBefore ?? true,
    ),
    reminderCustomMessage:
      typeof raw.reminderCustomMessage === "string"
        ? raw.reminderCustomMessage
        : (DEFAULT_AVAILABILITY_SETTINGS.reminderCustomMessage ?? ""),
  };
}

/**
 * Never throws — use for public booking + slot generation when DB/json may be partial.
 */
export function safeNormalizeAvailabilitySettings(
  raw: unknown,
  teacherIdFallback?: string,
): AvailabilitySettings {
  try {
    const base = normalizeAvailabilitySettings(raw);
    const tid =
      typeof teacherIdFallback === "string" && teacherIdFallback.trim().length > 0
        ? teacherIdFallback.trim()
        : base.teacherId;
    return { ...base, teacherId: tid };
  } catch (e) {
    console.error("[ServiceOS] safeNormalizeAvailabilitySettings", e);
    return normalizeAvailabilitySettings({
      teacherId:
        typeof teacherIdFallback === "string" && teacherIdFallback.trim().length > 0
          ? teacherIdFallback.trim()
          : getSupabaseDefaultTeacherId(),
      bookingEnabled: false,
    });
  }
}

