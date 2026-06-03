import { publicBookingPath } from "@/lib/booking/publicBookingPath";

/**
 * Full absolute URL for the public booking page for a teacher slug.
 * Use in QA scripts or copy-paste expectations.
 */
export function absolutePublicBookingUrl(
  origin: string,
  teacherSlug: string | null | undefined,
): string {
  const base = origin.replace(/\/$/, "");
  return `${base}${publicBookingPath(teacherSlug)}`;
}
