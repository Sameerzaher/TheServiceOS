import type { AppointmentRecord } from "@/core/types/appointment";
import { AppointmentStatus, PaymentStatus } from "@/core/types/appointment";
import type { Client } from "@/core/types/client";
import { isLocalCalendarDay } from "@/core/reminders/tomorrow";
import { isInLocalWeek } from "@/core/utils/week";

export function isPaidStatus(status: PaymentStatus): boolean {
  return status === PaymentStatus.Paid;
}

export function isDebtStatus(status: PaymentStatus): boolean {
  return (
    status === PaymentStatus.Unpaid ||
    status === PaymentStatus.Pending ||
    status === PaymentStatus.Partial
  );
}

export function sumAmount(
  rows: readonly AppointmentRecord[],
  predicate: (a: AppointmentRecord) => boolean,
): number {
  return rows.reduce((sum, a) => {
    if (!predicate(a)) return sum;
    return sum + (a.amount ?? 0);
  }, 0);
}

export function sumPaidTotal(appointments: readonly AppointmentRecord[]): number {
  return sumAmount(appointments, (a) => isPaidStatus(a.paymentStatus));
}

export function sumUnpaidDebt(appointments: readonly AppointmentRecord[]): number {
  return sumAmount(appointments, (a) => isDebtStatus(a.paymentStatus));
}

export function sumClientDebt(
  appointments: readonly AppointmentRecord[],
  clientId: string,
): number {
  return sumAmount(
    appointments,
    (a) =>
      a.clientId === clientId && isDebtStatus(a.paymentStatus),
  );
}

export function sumClientPaid(
  appointments: readonly AppointmentRecord[],
  clientId: string,
): number {
  return sumAmount(
    appointments,
    (a) =>
      a.clientId === clientId && isPaidStatus(a.paymentStatus),
  );
}

/** Sum of `amount` for paid appointments that start on the same local day as `reference`. */
export function sumTodayPaidRevenue(
  appointments: readonly AppointmentRecord[],
  reference: Date = new Date(),
): number {
  return sumAmount(
    appointments,
    (a) =>
      isPaidStatus(a.paymentStatus) &&
      isLocalCalendarDay(a.startAt, reference),
  );
}

/** Sum of lesson amounts marked as partial payment (still tracked as open balance). */
export function sumPartialAmount(appointments: readonly AppointmentRecord[]): number {
  return sumAmount(
    appointments,
    (a) => a.paymentStatus === PaymentStatus.Partial,
  );
}

/** Paid revenue for lessons whose start falls in the current local calendar week (Sun–Sat). */
export function sumWeekPaidRevenue(
  appointments: readonly AppointmentRecord[],
  reference: Date = new Date(),
): number {
  return sumAmount(
    appointments,
    (a) =>
      isPaidStatus(a.paymentStatus) && isInLocalWeek(a.startAt, reference),
  );
}

export interface ClientDebtRow {
  client: Client;
  debt: number;
}

/** Clients with positive debt, highest first (for dashboard lists). */
export function topClientsByDebt(
  clients: Client[],
  appointments: readonly AppointmentRecord[],
  limit = 5,
): ClientDebtRow[] {
  return clients
    .map((c) => ({ client: c, debt: sumClientDebt(appointments, c.id) }))
    .filter((row) => row.debt > 0)
    .sort((a, b) => b.debt - a.debt)
    .slice(0, limit);
}

export function countClientsWithDebt(
  clients: Client[],
  appointments: readonly AppointmentRecord[],
): number {
  return clients.filter((c) => sumClientDebt(appointments, c.id) > 0).length;
}

/** Appointments starting today (local), excluding cancelled. */
export function countTodayAppointments(
  appointments: readonly AppointmentRecord[],
  reference: Date = new Date(),
): number {
  return appointments.filter(
    (a) =>
      a.status !== AppointmentStatus.Cancelled &&
      isLocalCalendarDay(a.startAt, reference),
  ).length;
}

/**
 * Sum of amounts still “open” for today’s appointments (unpaid / partial / pending).
 * Rough expected cash still to collect from today’s schedule.
 */
export function sumTodayExpectedCollections(
  appointments: readonly AppointmentRecord[],
  reference: Date = new Date(),
): number {
  return sumAmount(
    appointments,
    (a) =>
      a.status !== AppointmentStatus.Cancelled &&
      isLocalCalendarDay(a.startAt, reference) &&
      isDebtStatus(a.paymentStatus),
  );
}

/** Total unpaid debt across all appointments (same as sumUnpaidDebt). */
export function totalOutstandingDebt(
  appointments: readonly AppointmentRecord[],
): number {
  return sumUnpaidDebt(appointments);
}
