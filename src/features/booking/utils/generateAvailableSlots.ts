import { AppointmentStatus, type AppointmentRecord } from "@/core/types/appointment";
import {
  safeNormalizeAvailabilitySettings,
  type AvailabilitySettings,
  type WeekdayKey,
} from "@/core/types/availability";

import { combineDateAndHHmmToIso, parseHHmm } from "./time";

export interface AvailableSlot {
  slotStart: string;
  slotEnd: string;
}

export interface GenerateAvailableSlotsInput {
  /** Local date in `YYYY-MM-DD` format. */
  date: string;
  availability: AvailabilitySettings | unknown;
  existingAppointments: readonly AppointmentRecord[] | unknown;
  /** Optional deterministic "now" (for tests). */
  now?: Date;
  /** When set (e.g. selected service duration), overrides `availability.slotDurationMinutes`. */
  slotDurationMinutesOverride?: number;
}

function toWeekdayKey(date: Date): WeekdayKey {
  const day = date.getDay();
  switch (day) {
    case 0:
      return "sunday";
    case 1:
      return "monday";
    case 2:
      return "tuesday";
    case 3:
      return "wednesday";
    case 4:
      return "thursday";
    case 5:
      return "friday";
    default:
      return "saturday";
  }
}

function rangesOverlap(
  aStartMs: number,
  aEndMs: number,
  bStartMs: number,
  bEndMs: number,
): boolean {
  return aStartMs < bEndMs && bStartMs < aEndMs;
}

function safeAppointments(
  raw: readonly AppointmentRecord[] | unknown,
): readonly AppointmentRecord[] {
  if (!Array.isArray(raw)) return [];
  return raw;
}

/**
 * Deterministically generates available booking slots for a date.
 * Never throws — returns [] on any malformed input or internal error.
 */
export function generateAvailableSlots({
  date,
  availability: availabilityRaw,
  existingAppointments: appointmentsRaw,
  now = new Date(),
  slotDurationMinutesOverride,
}: GenerateAvailableSlotsInput): AvailableSlot[] {
  try {
    const availability = safeNormalizeAvailabilitySettings(availabilityRaw);
    const existingAppointments = safeAppointments(appointmentsRaw);

    if (!availability.bookingEnabled) return [];

    const dateStr = typeof date === "string" ? date.trim() : "";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return [];

    const targetDate = new Date(`${dateStr}T00:00`);
    if (Number.isNaN(targetDate.getTime())) return [];

    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    ).getTime();
    const selectedStart = new Date(
      targetDate.getFullYear(),
      targetDate.getMonth(),
      targetDate.getDate(),
    ).getTime();
    const dayOffset = Math.round((selectedStart - todayStart) / 86_400_000);
    const daysAhead = Math.max(
      1,
      Math.min(
        365,
        Number.isFinite(availability.daysAhead) ? availability.daysAhead : 30,
      ),
    );
    if (dayOffset < 0 || dayOffset >= daysAhead) return [];

    const weekday = toWeekdayKey(targetDate);
    const wa = availability.weeklyAvailability;
    if (!wa || typeof wa !== "object") return [];

    const dayAvailability = wa[weekday];
    if (!dayAvailability || typeof dayAvailability.enabled !== "boolean") {
      return [];
    }
    if (!dayAvailability.enabled) return [];

    const start = parseHHmm(
      typeof dayAvailability.startTime === "string" ? dayAvailability.startTime : "",
    );
    const end = parseHHmm(
      typeof dayAvailability.endTime === "string" ? dayAvailability.endTime : "",
    );
    if (!start || !end) return [];
    if (end.totalMinutes <= start.totalMinutes) return [];

    const slotMinutes = Math.max(
      1,
      Math.trunc(
        Number.isFinite(slotDurationMinutesOverride)
          ? (slotDurationMinutesOverride as number)
          : Number.isFinite(availability.slotDurationMinutes)
            ? availability.slotDurationMinutes
            : 45,
      ),
    );
    const nowMs = now.getTime();

    const activeAppointments = existingAppointments.filter(
      (appt) =>
        appt &&
        typeof appt === "object" &&
        appt.status !== AppointmentStatus.Cancelled,
    );

    const slots: AvailableSlot[] = [];
    for (
      let currentStartMinutes = start.totalMinutes;
      currentStartMinutes + slotMinutes <= end.totalMinutes;
      currentStartMinutes += slotMinutes
    ) {
      const startHHmm = `${String(Math.floor(currentStartMinutes / 60)).padStart(2, "0")}:${String(
        currentStartMinutes % 60,
      ).padStart(2, "0")}`;
      const endTotal = currentStartMinutes + slotMinutes;
      const endHHmm = `${String(Math.floor(endTotal / 60)).padStart(2, "0")}:${String(
        endTotal % 60,
      ).padStart(2, "0")}`;

      const slotStart = combineDateAndHHmmToIso(dateStr, startHHmm);
      const slotEnd = combineDateAndHHmmToIso(dateStr, endHHmm);
      if (!slotStart || !slotEnd) continue;

      const slotStartMs = new Date(slotStart).getTime();
      const slotEndMs = new Date(slotEnd).getTime();
      if (!Number.isFinite(slotStartMs) || !Number.isFinite(slotEndMs)) continue;
      if (slotStartMs < nowMs) continue;

      const overlapsExisting = activeAppointments.some((appt) => {
        if (!appt || typeof appt !== "object") return false;
        if (!appt.startAt || typeof appt.startAt !== "string") return false;
        const apptStartMs = new Date(appt.startAt).getTime();
        if (!Number.isFinite(apptStartMs)) return false;
        const cf =
          appt.customFields && typeof appt.customFields === "object"
            ? appt.customFields
            : {};
        const endRaw = cf.bookingSlotEnd;
        let apptEndMs: number;
        if (typeof endRaw === "string") {
          const t = new Date(endRaw.trim()).getTime();
          apptEndMs = Number.isFinite(t) ? t : apptStartMs + slotMinutes * 60_000;
        } else {
          apptEndMs = apptStartMs + slotMinutes * 60_000;
        }
        return rangesOverlap(slotStartMs, slotEndMs, apptStartMs, apptEndMs);
      });
      if (overlapsExisting) continue;

      slots.push({ slotStart, slotEnd });
    }

    return slots;
  } catch (e) {
    console.error("[generateAvailableSlots] fatal (returning empty)", e);
    return [];
  }
}
