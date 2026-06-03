import { NextResponse } from "next/server";

import {
  getGoogleCalendarClientId,
  getGoogleCalendarRedirectUri,
  isGoogleCalendarOAuthConfigured,
} from "@/core/integrations/googleCalendar/env";
import { signOAuthState } from "@/core/integrations/googleCalendar/oauthState";
import { validateSession } from "@/lib/auth/session";
import { isSupabaseAdminConfigured } from "@/lib/supabase/adminClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Redirects the browser to Google OAuth consent.
 * TODO: Add authorized redirect URI in Google Cloud Console to match GOOGLE_CALENDAR_REDIRECT_URI.
 */
export async function GET(req: Request): Promise<NextResponse> {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      { ok: false, error: "Unavailable" },
      { status: 503 },
    );
  }

  const session = await validateSession(req);
  if (!session.ok || !session.teacherId || !session.businessId) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (!isGoogleCalendarOAuthConfigured()) {
    return NextResponse.redirect(
      new URL("/settings?googleCalendar=misconfigured", req.url),
    );
  }

  const clientId = getGoogleCalendarClientId()!;
  const redirectUri = getGoogleCalendarRedirectUri()!;

  const state = signOAuthState({
    teacherId: session.teacherId,
    businessId: session.businessId,
    exp: Date.now() + 15 * 60 * 1000,
  });
  if (!state) {
    return NextResponse.redirect(
      new URL("/settings?googleCalendar=state_error", req.url),
    );
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: [
      "https://www.googleapis.com/auth/calendar.events",
      "https://www.googleapis.com/auth/userinfo.email",
    ].join(" "),
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state,
  });

  const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  return NextResponse.redirect(url);
}
