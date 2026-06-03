import { heUi } from "@/config";
import { AppointmentStatus, type AppointmentRecord } from "@/core/types/appointment";

/** Allowed keys → appointment `customFields` from public booking (allowlist). */
export const PUBLIC_BOOKING_CUSTOM_FIELD_KEYS = [
  "pickupLocation",
  "transmissionType",
  "treatmentType",
  "treatmentArea",
  "carType",
] as const;

export type PublicBookingCustomFieldKey =
  (typeof PUBLIC_BOOKING_CUSTOM_FIELD_KEYS)[number];

export function sanitizePublicBookingCustomFields(
  raw: unknown,
): Record<string, string> {
  const out: Record<string, string> = {};
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return out;
  const o = raw as Record<string, unknown>;
  for (const key of PUBLIC_BOOKING_CUSTOM_FIELD_KEYS) {
    const v = o[key];
    if (typeof v === "string") {
      const t = v.trim();
      if (t.length > 0) out[key] = t;
    }
  }
  return out;
}

export interface PublicBookingPayload {
  fullName: string;
  phone: string;
  notes: string;
  slotStart: string;
  slotEnd: string;
  bookingCustomFields: Record<string, string>;
}

export function normalizePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, "");
}

export function rangesOverlap(
  aStartMs: number,
  aEndMs: number,
  bStartMs: number,
  bEndMs: number,
): boolean {
  return aStartMs < bEndMs && bStartMs < aEndMs;
}

export function isDateBlocked(
  slotStart: string,
  blockedDates: Array<{ date: string; isRecurring: boolean }>,
): boolean {
  const slotDate = new Date(slotStart);
  const slotDateStr = slotDate.toISOString().split("T")[0];

  return blockedDates.some((block) => {
    if (block.isRecurring) {
      // Check month and day only (ignore year)
      const blockDate = new Date(block.date);
      return (
        slotDate.getMonth() === blockDate.getMonth() &&
        slotDate.getDate() === blockDate.getDate()
      );
    }
    // Exact date match
    return block.date === slotDateStr;
  });
}

/**
 * Same overlap heuristic as the legacy client flow: use the requested slot
 * duration as the implied end for existing appointments when comparing windows.
 */
export function bookingOverlapsExistingAppointments(
  slotStart: string,
  slotEnd: string,
  appointments: readonly Pick<
    AppointmentRecord,
    "startAt" | "status" | "customFields"
  >[],
): boolean {
  const slotStartMs = new Date(slotStart).getTime();
  const slotEndMs = new Date(slotEnd).getTime();
  if (!Number.isFinite(slotStartMs) || !Number.isFinite(slotEndMs)) return true;
  if (slotEndMs <= slotStartMs) return true;

  const slotDurationMs = slotEndMs - slotStartMs;

  return appointments.some((appt) => {
    if (!appt || typeof appt !== "object") return false;
    if (appt.status === AppointmentStatus.Cancelled) return false;
    const apptStartMs = new Date(appt.startAt).getTime();
    if (!Number.isFinite(apptStartMs)) return false;
    const endRaw = appt.customFields?.bookingSlotEnd;
    let apptEndMs: number;
    if (typeof endRaw === "string") {
      const t = new Date(endRaw.trim()).getTime();
      apptEndMs = Number.isFinite(t) ? t : apptStartMs + slotDurationMs;
    } else {
      apptEndMs = apptStartMs + slotDurationMs;
    }
    return rangesOverlap(slotStartMs, slotEndMs, apptStartMs, apptEndMs);
  });
}

export function parsePublicBookingBody(raw: unknown):
  | { ok: true; data: PublicBookingPayload }
  | { ok: false; errorHe: string } {
  if (!raw || typeof raw !== "object") {
    return { ok: false, errorHe: heUi.publicBooking.errInvalidPayload };
  }
  const o = raw as Record<string, unknown>;
  const fullName = typeof o.fullName === "string" ? o.fullName.trim() : "";
  const phone = typeof o.phone === "string" ? o.phone.trim() : "";
  const notes = typeof o.notes === "string" ? o.notes.trim() : "";
  const slotStart = typeof o.slotStart === "string" ? o.slotStart.trim() : "";
  const slotEnd = typeof o.slotEnd === "string" ? o.slotEnd.trim() : "";

  const bookingCustomFields = sanitizePublicBookingCustomFields(
    o.bookingCustomFields,
  );
  const pickupLegacy =
    typeof o.pickupLocation === "string" ? o.pickupLocation.trim() : "";
  const carLegacy = typeof o.carType === "string" ? o.carType.trim() : "";
  if (pickupLegacy) bookingCustomFields.pickupLocation = pickupLegacy;
  if (carLegacy) bookingCustomFields.carType = carLegacy;

  if (!fullName) {
    return { ok: false, errorHe: heUi.publicBooking.errFullName };
  }
  if (!phone) {
    return { ok: false, errorHe: heUi.publicBooking.errPhone };
  }
  if (!slotStart || !slotEnd) {
    return { ok: false, errorHe: heUi.publicBooking.errSlotInvalid };
  }

  const slotStartMs = new Date(slotStart).getTime();
  const slotEndMs = new Date(slotEnd).getTime();
  if (!Number.isFinite(slotStartMs) || !Number.isFinite(slotEndMs)) {
    return { ok: false, errorHe: heUi.publicBooking.errSlotInvalid };
  }
  if (slotEndMs <= slotStartMs) {
    return { ok: false, errorHe: heUi.publicBooking.errSlotRange };
  }

  const nowMs = Date.now();
  if (slotStartMs < nowMs) {
    return { ok: false, errorHe: heUi.publicBooking.errSlotPast };
  }

  return {
    ok: true,
    data: {
      fullName,
      phone,
      notes,
      slotStart,
      slotEnd,
      bookingCustomFields,
    },
  };
}

/**
 * Whole-day offset from "today" to the slot's calendar day (runtime local timezone).
 * Used by the public booking API; should match `generateAvailableSlots` date-window logic.
 */
export function localCalendarDayOffsetFromNow(
  slotStartMs: number,
  nowMs: number,
): number {
  const startOfDay = (ms: number) => {
    const d = new Date(ms);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  };
  return Math.round(
    (startOfDay(slotStartMs) - startOfDay(nowMs)) / 86_400_000,
  );
}

/** `daysAhead` is the number of calendar days allowed starting today (today = offset 0). */
export function publicSlotOutsideBookingHorizon(
  slotStartMs: number,
  nowMs: number,
  daysAhead: number,
): boolean {
  const off = localCalendarDayOffsetFromNow(slotStartMs, nowMs);
  return off < 0 || off >= daysAhead;
}
