import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Legacy links may use `/book/<slug>/<extra>/...`. The app only serves `/book/<slug>`.
 * Redirect extra segments to the canonical URL (replaces a catch-all route that conflicted
 * with `app/book/[slug]` and could break the production client module graph).
 */
export function middleware(request: NextRequest) {
  const parts = request.nextUrl.pathname.split("/").filter(Boolean);
  if (parts[0] !== "book" || parts.length <= 2) {
    return NextResponse.next();
  }
  const slug = parts[1];
  if (!slug) return NextResponse.next();
  const url = request.nextUrl.clone();
  url.pathname = `/book/${encodeURIComponent(slug)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/book/:path*"],
};
