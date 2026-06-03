import { NextResponse } from "next/server";

import { getSupabaseBusinessId } from "@/core/config/supabaseEnv";
import {
  loadBookingSettings,
  persistBookingSettings,
} from "@/core/repositories/supabase/bookingSettingsRepository";
import { normalizeAvailabilitySettings } from "@/core/types/availability";
import { resolveTeacherIdFromRequest } from "@/lib/api/resolveTeacherId";
import {
  getSupabaseAdminClient,
  isSupabaseAdminConfigured,
} from "@/lib/supabase/adminClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HE_ERR_UNAVAILABLE =
  "שמירת זמינות אינה זמינה כרגע. בדקו את מפתח השרת של Supabase.";
const HE_ERR_INVALID = "נתוני זמינות לא תקינים.";
const HE_ERR_GENERIC = "אירעה תקלה בטעינת או שמירת הזמינות.";

export async function GET(req: Request): Promise<NextResponse> {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      { ok: false as const, error: HE_ERR_UNAVAILABLE },
      { status: 503 },
    );
  }

  try {
    const supabase = getSupabaseAdminClient();
    const businessId = getSupabaseBusinessId();
    const teacherId = resolveTeacherIdFromRequest(req);
    const settings = await loadBookingSettings(supabase, businessId, teacherId);
    return NextResponse.json({ ok: true as const, settings });
  } catch (e) {
    console.error("[availability-settings/get]", e);
    return NextResponse.json(
      { ok: false as const, error: HE_ERR_GENERIC },
      { status: 500 },
    );
  }
}

export async function PUT(req: Request): Promise<NextResponse> {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      { ok: false as const, error: HE_ERR_UNAVAILABLE },
      { status: 503 },
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

  try {
    const supabase = getSupabaseAdminClient();
    const businessId = getSupabaseBusinessId();
    const teacherId = resolveTeacherIdFromRequest(req, raw);
    const next = normalizeAvailabilitySettings({
      ...(raw as Record<string, unknown>),
      teacherId,
    });

    await persistBookingSettings(supabase, businessId, teacherId, next);
    return NextResponse.json({ ok: true as const, settings: next });
  } catch (e) {
    console.error("[availability-settings/put]", e);
    return NextResponse.json(
      { ok: false as const, error: HE_ERR_GENERIC },
      { status: 500 },
    );
  }
}
