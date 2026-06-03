import { NextResponse } from "next/server";

import { getSupabaseBusinessId } from "@/core/config/supabaseEnv";
import { deleteGoogleCalendarIntegration } from "@/core/integrations/googleCalendar/integrationRepository";
import { validateSession } from "@/lib/auth/session";
import {
  getSupabaseAdminClient,
  isSupabaseAdminConfigured,
} from "@/lib/supabase/adminClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request): Promise<NextResponse> {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      { ok: false as const, error: "Unavailable" },
      { status: 503 },
    );
  }

  const session = await validateSession(req);
  if (!session.ok || !session.teacherId) {
    return NextResponse.json(
      { ok: false as const, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const supabase = getSupabaseAdminClient();
  const businessId = getSupabaseBusinessId();
  await deleteGoogleCalendarIntegration(
    supabase,
    businessId,
    session.teacherId,
  );

  return NextResponse.json({ ok: true as const });
}
