/**
 * Reminder queue helpers for the dashboard and for future server/cron jobs.
 *
 * Background automation is not executed inside this app bundle — use these
 * functions from a scheduled worker or API route when you wire real delivery.
 */

import type { AppointmentRecord } from "@/core/types/appointment";
import { AppointmentStatus } from "@/core/types/appointment";
import { isDebtStatus } from "@/core/utils/insights";

import { getTodayFutureAppointments, getTomorrowAppointments } from "./tomorrow";

export type ReminderKind = "tomorrow" | "same_day" | "payment";

export type ReminderQueueItem = {
  kind: ReminderKind;
  appointment: AppointmentRecord;
};

/** Appointments that are still “live” for time-based reminders (not cancelled/completed/no-show). */
export function isEligibleForTimeReminder(a: AppointmentRecord): boolean {
  return (
    a.status !== AppointmentStatus.Cancelled &&
    a.status !== AppointmentStatus.Completed &&
    a.status !== AppointmentStatus.NoShow
  );
}

/** Outstanding balance — any non-cancelled row with debt. */
export function isEligibleForPaymentReminder(a: AppointmentRecord): boolean {
  return (
    a.status !== AppointmentStatus.Cancelled && isDebtStatus(a.paymentStatus)
  );
}

export function getTomorrowReminderCandidates(
  appointments: readonly AppointmentRecord[],
  reference: Date = new Date(),
): AppointmentRecord[] {
  return getTomorrowAppointments(appointments, reference).filter(
    isEligibleForTimeReminder,
  );
}

export function getSameDayReminderCandidates(
  appointments: readonly AppointmentRecord[],
  reference: Date = new Date(),
): AppointmentRecord[] {
  return getTodayFutureAppointments(appointments, reference).filter(
    isEligibleForTimeReminder,
  );
}

export function getPaymentReminderCandidates(
  appointments: readonly AppointmentRecord[],
): AppointmentRecord[] {
  return appointments
    .filter(isEligibleForPaymentReminder)
    .sort(
      (a, b) =>
        new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
    );
}

/** First occurrence wins — fixes duplicate rows from API/cache. */
export function uniqueAppointmentsById(
  rows: readonly AppointmentRecord[],
): AppointmentRecord[] {
  const seen = new Set<string>();
  const out: AppointmentRecord[] = [];
  for (const a of rows) {
    if (seen.has(a.id)) continue;
    seen.add(a.id);
    out.push(a);
  }
  return out;
}

/**
 * Each appointment appears in at most one reminder bucket, in priority order:
 * tomorrow → same_day → payment. Prevents the same client showing 2–3 identical cards
 * when a visit is both “tomorrow/same-day” and unpaid.
 */
export function dedupeReminderBuckets(
  tomorrow: readonly AppointmentRecord[],
  sameDay: readonly AppointmentRecord[],
  payment: readonly AppointmentRecord[],
): {
  tomorrow: AppointmentRecord[];
  sameDay: AppointmentRecord[];
  payment: AppointmentRecord[];
} {
  const t = uniqueAppointmentsById(tomorrow);
  const claimed = new Set(t.map((a) => a.id));

  const s = uniqueAppointmentsById(sameDay).filter((a) => {
    if (claimed.has(a.id)) return false;
    claimed.add(a.id);
    return true;
  });

  const p = uniqueAppointmentsById(payment).filter((a) => {
    if (claimed.has(a.id)) return false;
    claimed.add(a.id);
    return true;
  });

  return { tomorrow: t, sameDay: s, payment: p };
}

/**
 * Builds a flat queue for UI or a job runner. Respects feature toggles only at
 * the call site (dashboard passes booleans); this function always returns all
 * three kinds when data exists — filter before display if needed.
 */
export function buildReminderQueue(
  appointments: readonly AppointmentRecord[],
  reference: Date = new Date(),
): ReminderQueueItem[] {
  const out: ReminderQueueItem[] = [];
  for (const a of getTomorrowReminderCandidates(appointments, reference)) {
    out.push({ kind: "tomorrow", appointment: a });
  }
  for (const a of getSameDayReminderCandidates(appointments, reference)) {
    out.push({ kind: "same_day", appointment: a });
  }
  for (const a of getPaymentReminderCandidates(appointments)) {
    out.push({ kind: "payment", appointment: a });
  }
  return out;
}

/** Formats `amount` for {{amountDue}} in Hebrew locale (ILS). */
export function formatAmountDueForTemplate(amount: number): string {
  const n = Number.isFinite(amount) ? amount : 0;
  try {
    return new Intl.NumberFormat("he-IL", {
      style: "currency",
      currency: "ILS",
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `${n} ₪`;
  }
}
