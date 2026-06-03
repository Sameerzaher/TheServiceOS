import { NextResponse } from "next/server";

import { getSupabaseBusinessId } from "@/core/config/supabaseEnv";
import {
  loadAppSettings,
  persistAppSettings,
} from "@/core/repositories/supabase/appSettingsRepository";
import { normalizeAppSettings } from "@/core/types/settings";
import {
  getSupabaseAdminClient,
  isSupabaseAdminConfigured,
} from "@/lib/supabase/adminClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HE_ERR_UNAVAILABLE = "השירות אינו זמין כרגע.";
const HE_ERR_GENERIC = "אירעה תקלה. נסו שוב.";

/**
 * Marks owner onboarding as finished (persists on app settings JSON).
 * Idempotent — safe to call more than once.
 */
export async function POST(req: Request): Promise<NextResponse> {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      { ok: false as const, error: HE_ERR_UNAVAILABLE },
      { status: 503 },
    );
  }

  try {
    const supabase = getSupabaseAdminClient();
    const businessId = getSupabaseBusinessId();

    const { cookies } = await import("next/headers");
    const sessionToken = cookies().get("session_token")?.value;
    if (!sessionToken) {
      return NextResponse.json(
        { ok: false as const, error: "נדרשת התחברות" },
        { status: 401 },
      );
    }

    const { data: session } = await supabase
      .from("sessions")
      .select("teacher_id")
      .eq("token", sessionToken)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (!session?.teacher_id) {
      return NextResponse.json(
        { ok: false as const, error: "נדרשת התחברות" },
        { status: 401 },
      );
    }

    const teacherId = session.teacher_id as string;

    const current = await loadAppSettings(supabase, businessId, teacherId);
    const next = normalizeAppSettings({
      ...current,
      ownerOnboardingCompletedAt: new Date().toISOString(),
    });
    await persistAppSettings(supabase, businessId, teacherId, next);

    return NextResponse.json({ ok: true as const });
  } catch (e) {
    console.error("[onboarding/complete]", e);
    return NextResponse.json(
      { ok: false as const, error: HE_ERR_GENERIC },
      { status: 500 },
    );
  }
}
