/** Path for the public booking page (`/book/[slug-or-id]`). */
export function publicBookingPath(teacherSlug: string | null | undefined): string {
  const s = typeof teacherSlug === "string" ? teacherSlug.trim() : "";
  if (s.length === 0) return "/book";
  return `/book/${encodeURIComponent(s)}`;
}
