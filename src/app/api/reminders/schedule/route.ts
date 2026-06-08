import { NextResponse } from "next/server";

import { scheduleAppointmentReminders } from "@/core/reminders/autoSchedule";
import {
  getSupabaseAdminClient,
  isSupabaseAdminConfigured,
} from "@/lib/supabase/adminClient";
import { validateSession } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/reminders/schedule
 * Schedule automatic reminders for an appointment.
 */
export async function POST(req: Request): Promise<NextResponse> {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      { ok: false, error: "שירות אינו זמין" },
      { status: 503 },
    );
  }

  try {
    const sessionValidation = await validateSession(req);
    if (!sessionValidation.ok) {
      return NextResponse.json(
        { ok: false, error: "לא מאומת" },
        { status: 401 },
      );
    }

    const teacherId = sessionValidation.teacherId ?? "";
    const businessId = sessionValidation.businessId ?? "";
    if (!teacherId || !businessId) {
      return NextResponse.json(
        { ok: false, error: "שגיאת הרשאות" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const { appointmentId, startAt } = body;

    if (!appointmentId || !startAt) {
      return NextResponse.json(
        { ok: false, error: "נתונים חסרים" },
        { status: 400 },
      );
    }

    const supabase = getSupabaseAdminClient();
    const scheduled = await scheduleAppointmentReminders(supabase, {
      businessId,
      teacherId,
      appointmentId,
      startAt,
    });

    return NextResponse.json({ ok: true, scheduled });
  } catch (e) {
    console.error("[reminders/schedule] Unexpected error:", e);
    return NextResponse.json(
      { ok: false, error: "שגיאה בלתי צפויה" },
      { status: 500 },
    );
  }
}
