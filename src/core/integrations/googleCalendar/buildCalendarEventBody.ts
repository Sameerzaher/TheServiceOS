import type { AppointmentRecord } from "@/core/types/appointment";
import { AppointmentStatus } from "@/core/types/appointment";

import type { calendar_v3 } from "./calendarEventTypes";
import { getGoogleCalendarDefaultTimezone, getPublicAppBaseUrl } from "./env";

function serviceNameFromAppointment(a: AppointmentRecord): string {
  const cf = a.customFields;
  const s =
    (typeof cf.serviceName === "string" && cf.serviceName.trim()) ||
    (typeof cf.serviceLabel === "string" && cf.serviceLabel.trim()) ||
    (typeof cf.bookingServiceName === "string" && cf.bookingServiceName.trim());
  return s || "תור";
}

function notesFromAppointment(a: AppointmentRecord): string {
  const n = a.customFields.notes;
  return typeof n === "string" ? n.trim() : "";
}

function applyDescriptionTemplate(
  template: string | null | undefined,
  vars: Record<string, string>,
): string {
  const base =
    template?.trim() ||
    "לקוח: {{clientName}}\nשירות: {{serviceName}}\nטלפון: {{phone}}\n{{notesLine}}{{linkLine}}";
  let out = base;
  for (const [k, v] of Object.entries(vars)) {
    out = out.split(`{{${k}}}`).join(v);
  }
  return out;
}

export function buildCalendarEventPayload(params: {
  appointment: AppointmentRecord;
  clientName: string;
  clientPhone: string;
  descriptionTemplate: string | null | undefined;
}): calendar_v3.Schema$Event {
  const { appointment: a, clientName, clientPhone, descriptionTemplate } =
    params;
  const tz = getGoogleCalendarDefaultTimezone();
  const service = serviceNameFromAppointment(a);
  const notes = notesFromAppointment(a);

  const startMs = new Date(a.startAt).getTime();
  const endRaw = a.customFields.bookingSlotEnd;
  let endMs = startMs + 45 * 60 * 1000;
  if (typeof endRaw === "string" && endRaw.trim()) {
    const t = new Date(endRaw.trim()).getTime();
    if (Number.isFinite(t) && t > startMs) endMs = t;
  }

  const startIso = new Date(startMs).toISOString();
  const endIso = new Date(endMs).toISOString();

  const base = getPublicAppBaseUrl();
  const link =
    base.length > 0
      ? `${base}/clients/${encodeURIComponent(a.clientId)}`
      : "";

  const notesLine = notes.length > 0 ? `הערות: ${notes}\n` : "";
  const linkLine = link.length > 0 ? `קישור ב-ServiceOS: ${link}\n` : "";

  const description = applyDescriptionTemplate(descriptionTemplate, {
    clientName,
    serviceName: service,
    phone: clientPhone || "—",
    notesLine,
    linkLine,
    notes: notes || "—",
    startAt: startIso,
    endAt: endIso,
  });

  const cancelled =
    a.status === AppointmentStatus.Cancelled ||
    a.status === AppointmentStatus.NoShow;

  const summary = cancelled
    ? `[בוטל] ${clientName} · ${service}`
    : `${clientName} · ${service}`;

  return {
    summary,
    description,
    start: { dateTime: startIso, timeZone: tz },
    end: { dateTime: endIso, timeZone: tz },
  };
}
