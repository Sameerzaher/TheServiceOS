/** Keys stored on `appointments.custom_fields` for Google Calendar sync. */
export const GOOGLE_CALENDAR_EVENT_ID_KEY = "googleCalendarEventId";
export const GOOGLE_CALENDAR_SYNCED_AT_KEY = "googleCalendarSyncedAt";
export const GOOGLE_CALENDAR_LAST_ERROR_KEY = "googleCalendarLastError";

export function getGoogleEventId(
  customFields: Record<string, unknown>,
): string | null {
  const v = customFields[GOOGLE_CALENDAR_EVENT_ID_KEY];
  return typeof v === "string" && v.trim().length > 0 ? v.trim() : null;
}

export function patchGoogleCalendarSyncFields(
  customFields: Record<string, unknown>,
  patch: {
    eventId?: string | null;
    syncedAt?: string | null;
    lastError?: string | null;
  },
): Record<string, unknown> {
  const next = { ...customFields };
  if (patch.eventId === null) {
    delete next[GOOGLE_CALENDAR_EVENT_ID_KEY];
  } else if (typeof patch.eventId === "string") {
    next[GOOGLE_CALENDAR_EVENT_ID_KEY] = patch.eventId;
  }
  if (patch.syncedAt === null) {
    delete next[GOOGLE_CALENDAR_SYNCED_AT_KEY];
  } else if (typeof patch.syncedAt === "string") {
    next[GOOGLE_CALENDAR_SYNCED_AT_KEY] = patch.syncedAt;
  }
  if (patch.lastError === null) {
    delete next[GOOGLE_CALENDAR_LAST_ERROR_KEY];
  } else if (typeof patch.lastError === "string") {
    next[GOOGLE_CALENDAR_LAST_ERROR_KEY] = patch.lastError;
  }
  return next;
}
