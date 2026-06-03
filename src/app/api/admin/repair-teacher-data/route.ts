import { NextResponse } from "next/server";

import { getSupabaseAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/adminClient";
import { runTeacherDataRepair } from "@/core/services/teacherDataRepair";

export const runtime = "nodejs";

export const dynamic = "force-dynamic";

const HE_ERR_UNAVAILABLE = "השירות אינו זמין כרגע.";
const HE_ERR_AUTH = "נדרשת התחברות.";
const HE_ERR_FORBIDDEN = "רק מנהל יכול להריץ תיקון נתונים.";

/**
 * POST: repair broken teacher ↔ business ↔ booking_settings links (admin only).
 * Body: `{ "dryRun"?: boolean }`
 */
export async function POST(req: Request): Promise<NextResponse> {
  console.log("[admin/repair-teacher-data] POST");

  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ ok: false as const, error: HE_ERR_UNAVAILABLE }, { status: 503 });
  }

  try {
    const supabase = getSupabaseAdminClient();
    const { cookies } = await import("next/headers");
    const sessionToken = cookies().get("session_token")?.value;

    if (!sessionToken) {
      return NextResponse.json({ ok: false as const, error: HE_ERR_AUTH }, { status: 401 });
    }

    const { data: session } = await supabase
      .from("sessions")
      .select("teacher_id")
      .eq("token", sessionToken)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (!session) {
      return NextResponse.json({ ok: false as const, error: HE_ERR_AUTH }, { status: 401 });
    }

    const { data: currentTeacher } = await supabase
      .from("teachers")
      .select("id, role")
      .eq("id", session.teacher_id)
      .eq("is_active", true)
      .maybeSingle();

    if (!currentTeacher || currentTeacher.role !== "admin") {
      return NextResponse.json({ ok: false as const, error: HE_ERR_FORBIDDEN }, { status: 403 });
    }

    let dryRun = false;
    try {
      const body = await req.json();
      if (body && typeof body === "object" && body.dryRun === true) dryRun = true;
    } catch {
      /* empty body */
    }

    const report = await runTeacherDataRepair(supabase, { dryRun });

    return NextResponse.json({
      ok: true as const,
      dryRun,
      report,
    });
  } catch (e) {
    console.error("[admin/repair-teacher-data]", e);
    return NextResponse.json(
      { ok: false as const, error: "אירעה תקלה בהרצת התיקון." },
      { status: 500 },
    );
  }
}
