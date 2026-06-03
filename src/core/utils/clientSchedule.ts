import type { AppointmentRecord } from "@/core/types/appointment";

/** Earliest upcoming appointment for this client (inclusive of `reference` instant). */
export function getNextLesson(
  clientId: string,
  appointments: readonly AppointmentRecord[],
  reference: Date = new Date(),
): AppointmentRecord | null {
  const t0 = reference.getTime();
  const future = appointments
    .filter(
      (a) =>
        a.clientId === clientId && new Date(a.startAt).getTime() >= t0,
    )
    .sort(
      (a, b) =>
        new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
    );
  return future[0] ?? null;
}

/** Latest appointment by time (past or future) — for “last scheduled” display. */
export function getMostRecentAppointment(
  clientId: string,
  appointments: readonly AppointmentRecord[],
): AppointmentRecord | null {
  const rows = appointments.filter((a) => a.clientId === clientId);
  if (rows.length === 0) return null;
  return [...rows].sort(
    (a, b) =>
      new Date(b.startAt).getTime() - new Date(a.startAt).getTime(),
  )[0]!;
}

/** Most recent past appointment for this client. */
export function getLastLesson(
  clientId: string,
  appointments: readonly AppointmentRecord[],
  reference: Date = new Date(),
): AppointmentRecord | null {
  const t0 = reference.getTime();
  const past = appointments
    .filter((a) => a.clientId === clientId && new Date(a.startAt).getTime() < t0)
    .sort(
      (a, b) =>
        new Date(b.startAt).getTime() - new Date(a.startAt).getTime(),
    );
  return past[0] ?? null;
}
