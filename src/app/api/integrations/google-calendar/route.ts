import { NextResponse } from "next/server";

import { getSupabaseBusinessId } from "@/core/config/supabaseEnv";
import {
  getGoogleCalendarIntegration,
  updateIntegrationSyncMeta,
} from "@/core/integrations/googleCalendar/integrationRepository";
import { isGoogleCalendarOAuthConfigured } from "@/core/integrations/googleCalendar/env";
import { validateSession } from "@/lib/auth/session";
import {
  getSupabaseAdminClient,
  isSupabaseAdminConfigured,
} from "@/lib/supabase/adminClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HE_ERR_UNAVAILABLE = "השירות אינו זמין כרגע.";
const HE_ERR_AUTH = "נדרשת התחברות.";
const HE_ERR_INVALID = "בקשה לא תקינה.";

/** GET — connection status for settings UI. */
export async function GET(req: Request): Promise<NextResponse> {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      { ok: false as const, error: HE_ERR_UNAVAILABLE },
      { status: 503 },
    );
  }

  const session = await validateSession(req);
  if (!session.ok || !session.teacherId || !session.businessId) {
    return NextResponse.json(
      { ok: false as const, error: HE_ERR_AUTH },
      { status: 401 },
    );
  }

  const supabase = getSupabaseAdminClient();
  const businessId = getSupabaseBusinessId();
  const row = await getGoogleCalendarIntegration(
    supabase,
    businessId,
    session.teacherId,
  );

  return NextResponse.json({
    ok: true as const,
    oauthConfigured: isGoogleCalendarOAuthConfigured(),
    connected: row != null,
    accountEmail: row?.google_account_email ?? null,
    syncEnabled: row?.sync_enabled ?? false,
    calendarId: row?.calendar_id ?? "primary",
    lastSyncAt: row?.last_sync_at ?? null,
    lastSyncStatus: row?.last_sync_status ?? null,
    lastSyncError: row?.last_sync_error ?? null,
    descriptionTemplate: row?.description_template ?? null,
  });
}

/** PATCH — update sync toggle / template / calendar id. */
export async function PATCH(req: Request): Promise<NextResponse> {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      { ok: false as const, error: HE_ERR_UNAVAILABLE },
      { status: 503 },
    );
  }

  const session = await validateSession(req);
  if (!session.ok || !session.teacherId || !session.businessId) {
    return NextResponse.json(
      { ok: false as const, error: HE_ERR_AUTH },
      { status: 401 },
    );
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false as const, error: HE_ERR_INVALID },
      { status: 400 },
    );
  }
  if (!raw || typeof raw !== "object") {
    return NextResponse.json(
      { ok: false as const, error: HE_ERR_INVALID },
      { status: 400 },
    );
  }
  const o = raw as Record<string, unknown>;

  const supabase = getSupabaseAdminClient();
  const businessId = getSupabaseBusinessId();

  const fields: Parameters<typeof updateIntegrationSyncMeta>[3] = {};
  if (typeof o.syncEnabled === "boolean") {
    fields.sync_enabled = o.syncEnabled;
  }
  if ("descriptionTemplate" in o) {
    fields.description_template =
      typeof o.descriptionTemplate === "string"
        ? o.descriptionTemplate
        : null;
  }
  if (typeof o.calendarId === "string" && o.calendarId.trim().length > 0) {
    fields.calendar_id = o.calendarId.trim();
  }

  if (Object.keys(fields).length === 0) {
    return NextResponse.json(
      { ok: false as const, error: HE_ERR_INVALID },
      { status: 400 },
    );
  }

  await updateIntegrationSyncMeta(
    supabase,
    businessId,
    session.teacherId,
    fields,
  );

  return NextResponse.json({ ok: true as const });
}
