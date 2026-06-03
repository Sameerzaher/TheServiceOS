/**
 * Pure helpers for asserting tenant isolation in tests or browser DevTools.
 * No network — pass API response bodies or hook state.
 */

import type { Client } from "@/core/types/client";
import type { AppointmentRecord } from "@/core/types/appointment";

export type BookingListRow = {
  teacherId?: string;
  id?: string;
};

/** True if every item's `teacherId` equals `expected` (strict). */
export function allClientsScopedToTeacher(
  clients: readonly Client[],
  expectedTeacherId: string,
): boolean {
  const exp = expectedTeacherId.trim();
  return clients.every((c) => c.teacherId.trim() === exp);
}

/** True if every appointment's `teacherId` equals `expected`. */
export function allAppointmentsScopedToTeacher(
  rows: readonly AppointmentRecord[],
  expectedTeacherId: string,
): boolean {
  const exp = expectedTeacherId.trim();
  return rows.every((a) => a.teacherId.trim() === exp);
}

/** True if every booking list row has matching `teacherId` (dashboard GET /api/bookings). */
export function allBookingsListScopedToTeacher(
  rows: readonly BookingListRow[],
  expectedTeacherId: string,
): boolean {
  const exp = expectedTeacherId.trim();
  return rows.every(
    (b) => typeof b.teacherId === "string" && b.teacherId.trim() === exp,
  );
}

/** Public booking URLs must differ when slugs differ. */
export function publicBookingUrlsAreDistinct(
  slugA: string,
  slugB: string,
  origin = "https://example.com",
): { urlA: string; urlB: string; distinct: boolean } {
  const pathA = `/book/${encodeURIComponent(slugA.trim())}`;
  const pathB = `/book/${encodeURIComponent(slugB.trim())}`;
  const urlA = `${origin.replace(/\/$/, "")}${pathA}`;
  const urlB = `${origin.replace(/\/$/, "")}${pathB}`;
  return { urlA, urlB, distinct: urlA !== urlB };
}
