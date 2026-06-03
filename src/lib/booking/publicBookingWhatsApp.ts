import { buildWhatsAppHref } from "@/core/utils/whatsapp";

/** Hebrew confirmation line for the business / instructor WhatsApp. */
export function buildPublicBookingConfirmationMessage(
  dateLabel: string,
  timeLabel: string,
): string {
  return `היי, קבעתי שיעור בתאריך ${dateLabel} בשעה ${timeLabel}`;
}

export function formatBookingDateHe(isoStart: string): string {
  try {
    const d = new Date(isoStart);
    if (!Number.isFinite(d.getTime())) return "";
    return new Intl.DateTimeFormat("he-IL", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(d);
  } catch {
    return "";
  }
}

/** Single start time, e.g. "14:30". */
export function formatBookingStartTimeHe(isoStart: string): string {
  try {
    const d = new Date(isoStart);
    if (!Number.isFinite(d.getTime())) return "";
    return new Intl.DateTimeFormat("he-IL", { timeStyle: "short" }).format(d);
  } catch {
    return "";
  }
}

export function publicInstructorWhatsAppHref(
  instructorPhone: string,
  isoSlotStart: string,
  _isoSlotEnd: string,
): string | null {
  const dateLabel = formatBookingDateHe(isoSlotStart);
  const timeLabel = formatBookingStartTimeHe(isoSlotStart);
  if (!dateLabel || !timeLabel) return null;
  const msg = buildPublicBookingConfirmationMessage(dateLabel, timeLabel);
  return buildWhatsAppHref(instructorPhone, msg);
}

/** Message: "היי, קבעתי תור ל־… בשעה …" — optional service name. */
export function buildFlowBookingWhatsAppMessage(
  isoSlotStart: string,
  serviceName?: string | null,
): string {
  const dateLabel = formatBookingDateHe(isoSlotStart);
  const timeLabel = formatBookingStartTimeHe(isoSlotStart);
  const s = serviceName?.trim();
  if (s) {
    return `היי, קבעתי תור לשירות «${s}» ב־${dateLabel} בשעה ${timeLabel}`;
  }
  return `היי, קבעתי תור ל־${dateLabel} בשעה ${timeLabel}`;
}

export function publicFlowWhatsAppHref(
  instructorPhone: string,
  isoSlotStart: string,
  serviceName?: string | null,
): string | null {
  const msg = buildFlowBookingWhatsAppMessage(isoSlotStart, serviceName);
  return buildWhatsAppHref(instructorPhone, msg);
}
