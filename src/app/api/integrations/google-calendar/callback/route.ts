import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getSupabaseBusinessId } from "@/core/config/supabaseEnv";
import {
  exchangeAuthorizationCode,
  fetchGoogleUserEmail,
} from "@/core/integrations/googleCalendar/googleTokenClient";
import { upsertGoogleCalendarIntegration } from "@/core/integrations/googleCalendar/integrationRepository";
import { verifyOAuthState } from "@/core/integrations/googleCalendar/oauthState";
import { isGoogleCalendarOAuthConfigured } from "@/core/integrations/googleCalendar/env";
import {
  getSupabaseAdminClient,
  isSupabaseAdminConfigured,
} from "@/lib/supabase/adminClient";

async function sessionTeacherIdFromCookies(): Promise<string | null> {
  const token = cookies().get("session_token")?.value;
  if (!token) return null;
  const supabase = getSupabaseAdminClient();
  const { data: session } = await supabase
    .from("sessions")
    .select("teacher_id")
    .eq("token", token)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  return session?.teacher_id ? String(session.teacher_id) : null;
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * OAuth redirect URI handler — exchanges code, stores encrypted refresh token.
 */
export async function GET(req: Request): Promise<NextResponse> {
  const base = new URL(req.url);

  if (!isSupabaseAdminConfigured() || !isGoogleCalendarOAuthConfigured()) {
    return NextResponse.redirect(
      new URL("/settings?googleCalendar=misconfigured", base.origin),
    );
  }

  const code = base.searchParams.get("code");
  const stateRaw = base.searchParams.get("state");
  const err = base.searchParams.get("error");

  if (err) {
    return NextResponse.redirect(
      new URL(
        `/settings?googleCalendar=denied&reason=${encodeURIComponent(err)}`,
        base.origin,
      ),
    );
  }

  if (!code || !stateRaw) {
    return NextResponse.redirect(
      new URL("/settings?googleCalendar=invalid", base.origin),
    );
  }

  const state = verifyOAuthState(stateRaw);
  if (!state) {
    return NextResponse.redirect(
      new URL("/settings?googleCalendar=bad_state", base.origin),
    );
  }

  const sessionTeacherId = await sessionTeacherIdFromCookies();
  if (!sessionTeacherId || sessionTeacherId !== state.teacherId) {
    return NextResponse.redirect(
      new URL("/settings?googleCalendar=session_mismatch", base.origin),
    );
  }

  const tokens = await exchangeAuthorizationCode(code);
  if (!tokens) {
    return NextResponse.redirect(
      new URL("/settings?googleCalendar=token_error", base.origin),
    );
  }

  const email = await fetchGoogleUserEmail(tokens.accessToken);
  const supabase = getSupabaseAdminClient();
  const businessId = getSupabaseBusinessId();

  if (state.businessId !== businessId) {
    console.warn("[googleCalendar] callback businessId mismatch");
  }

  const expiresAt = new Date(Date.now() + tokens.expiresIn * 1000);
  const ok = await upsertGoogleCalendarIntegration({
    supabase,
    businessId,
    teacherId: state.teacherId,
    googleAccountEmail: email ?? "",
    refreshToken: tokens.refreshToken,
    accessToken: tokens.accessToken,
    accessTokenExpiresAt: expiresAt,
  });

  if (!ok) {
    return NextResponse.redirect(
      new URL("/settings?googleCalendar=save_error", base.origin),
    );
  }

  return NextResponse.redirect(
    new URL("/settings?googleCalendar=connected", base.origin),
  );
}
