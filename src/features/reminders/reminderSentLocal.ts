import type { ReminderKind } from "@/core/reminders/queue";

const PREFIX = "serviceos.reminderSent.v1";

/**
 * Tracks manual “sent today” in localStorage (per teacher, appointment, kind, calendar day).
 * Replace with server-side `appointment_reminders` or similar when automation is wired.
 */

export function getLocalDateYmd(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function reminderSentStorageKey(
  teacherId: string,
  appointmentId: string,
  kind: ReminderKind,
  sendDateYmd: string,
): string {
  return `${PREFIX}:${teacherId}:${kind}:${appointmentId}:${sendDateYmd}`;
}

export function isReminderMarkedSentLocal(
  teacherId: string,
  appointmentId: string,
  kind: ReminderKind,
  sendDateYmd: string,
): boolean {
  if (typeof window === "undefined") return false;
  try {
    const k = reminderSentStorageKey(
      teacherId,
      appointmentId,
      kind,
      sendDateYmd,
    );
    return window.localStorage.getItem(k) === "1";
  } catch {
    return false;
  }
}

export function markReminderSentLocal(
  teacherId: string,
  appointmentId: string,
  kind: ReminderKind,
  sendDateYmd: string,
): void {
  if (typeof window === "undefined") return;
  try {
    const k = reminderSentStorageKey(
      teacherId,
      appointmentId,
      kind,
      sendDateYmd,
    );
    window.localStorage.setItem(k, "1");
  } catch {
    /* quota / private mode */
  }
}
