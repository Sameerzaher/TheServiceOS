import type { calendar_v3 } from "./calendarEventTypes";

export async function insertCalendarEvent(params: {
  accessToken: string;
  calendarId: string;
  body: calendar_v3.Schema$Event;
}): Promise<{ id: string } | null> {
  const calId = encodeURIComponent(params.calendarId || "primary");
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${calId}/events`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${params.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params.body),
    },
  );
  const data = (await res.json()) as { id?: string; error?: { message?: string } };
  if (!res.ok || !data.id) {
    console.error("[googleCalendar] insert event", res.status, data);
    return null;
  }
  return { id: data.id };
}

export async function updateCalendarEvent(params: {
  accessToken: string;
  calendarId: string;
  eventId: string;
  body: calendar_v3.Schema$Event;
}): Promise<boolean> {
  const calId = encodeURIComponent(params.calendarId || "primary");
  const evId = encodeURIComponent(params.eventId);
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${calId}/events/${evId}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${params.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params.body),
    },
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("[googleCalendar] update event", res.status, err);
    return false;
  }
  return true;
}

export async function deleteCalendarEvent(params: {
  accessToken: string;
  calendarId: string;
  eventId: string;
}): Promise<boolean> {
  const calId = encodeURIComponent(params.calendarId || "primary");
  const evId = encodeURIComponent(params.eventId);
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${calId}/events/${evId}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${params.accessToken}` },
    },
  );
  if (res.status === 404) return true;
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("[googleCalendar] delete event", res.status, err);
    return false;
  }
  return true;
}
