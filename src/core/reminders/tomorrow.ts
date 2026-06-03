import type { AppointmentRecord } from "@/core/types/appointment";

function startOfLocalDay(d: Date): Date {
  const next = new Date(d);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addLocalDays(d: Date, delta: number): Date {
  const next = new Date(d);
  next.setDate(next.getDate() + delta);
  return next;
}

/**
 * Whether `startAt` (ISO string) falls on the same local calendar day as `day`.
 */
export function isLocalCalendarDay(
  startAtIso: string,
  day: Date,
): boolean {
  const t = new Date(startAtIso);
  if (Number.isNaN(t.getTime())) return false;
  return (
    t.getFullYear() === day.getFullYear() &&
    t.getMonth() === day.getMonth() &&
    t.getDate() === day.getDate()
  );
}

/**
 * True if the appointment starts on **tomorrow** relative to `reference` (local date).
 * Useful for labeling rows or building reminder queues before a channel (e.g. WhatsApp) exists.
 */
export function isTomorrowAppointment(
  appointment: AppointmentRecord,
  reference: Date = new Date(),
): boolean {
  const tomorrow = addLocalDays(startOfLocalDay(reference), 1);
  return isLocalCalendarDay(appointment.startAt, tomorrow);
}

/**
 * Returns appointments scheduled for **tomorrow** (local calendar), sorted by start time ascending.
 * Intended for reminder delivery; channel integration (e.g. WhatsApp) can call this and send messages later.
 */
export function getTomorrowAppointments(
  appointments: readonly AppointmentRecord[],
  reference: Date = new Date(),
): AppointmentRecord[] {
  const tomorrow = addLocalDays(startOfLocalDay(reference), 1);
  return [...appointments]
    .filter((a) => isLocalCalendarDay(a.startAt, tomorrow))
    .sort(
      (a, b) =>
        new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
    );
}

/**
 * Appointments on the same local calendar day as `reference`, with start time ≥ `reference`.
 * For same-day reminder workflows (manual or future cron).
 */
export function getTodayFutureAppointments(
  appointments: readonly AppointmentRecord[],
  reference: Date = new Date(),
): AppointmentRecord[] {
  const now = reference.getTime();
  return [...appointments]
    .filter(
      (a) =>
        isLocalCalendarDay(a.startAt, reference) &&
        new Date(a.startAt).getTime() >= now,
    )
    .sort(
      (a, b) =>
        new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
    );
}
