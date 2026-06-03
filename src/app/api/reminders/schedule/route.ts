import { NextResponse } from "next/server";

import {
  getSupabaseAdminClient,
  isSupabaseAdminConfigured,
} from "@/lib/supabase/adminClient";
import { validateSession } from "@/lib/auth/session";

export const runtime = "nodejs";

/**
 * POST /api/reminders/schedule
 * 
 * Schedule automatic reminders for an appointment
 * Body: { appointmentId: string, clientName: string, clientPhone: string, startAt: string }
 */
export async function POST(req: Request): Promise<NextResponse> {
  console.log("[reminders/schedule] Scheduling reminders...");

  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      { ok: false, error: "שירות אינו זמין" },
      { status: 503 }
    );
  }

  try {
    const supabase = getSupabaseAdminClient();

    // Validate session
    const sessionValidation = await validateSession(req);
    if (!sessionValidation.ok) {
      console.error("[reminders/schedule] Session validation failed");
      return NextResponse.json(
        { ok: false, error: "לא מאומת" },
        { status: 401 }
      );
    }

    const teacherId = sessionValidation.teacherId ?? "";
    const businessId = sessionValidation.businessId ?? "";
    if (!teacherId || !businessId) {
      console.error("[reminders/schedule] Missing session scope:", sessionValidation);
      return NextResponse.json(
        { ok: false, error: "שגיאת הרשאות" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const { appointmentId, clientName, clientPhone, startAt } = body;

    if (!appointmentId || !startAt) {
      return NextResponse.json(
        { ok: false, error: "נתונים חסרים" },
        { status: 400 }
      );
    }

    // Check if reminders are enabled
    const { data: settings } = await supabase
      .from("booking_settings")
      .select("enable_auto_reminders, reminder_24h_before, reminder_1h_before")
      .eq("business_id", businessId)
      .eq("teacher_id", teacherId)
      .single();

    if (!settings?.enable_auto_reminders) {
      console.log("[reminders/schedule] Auto reminders disabled");
      return NextResponse.json({ ok: true, scheduled: 0 });
    }

    const appointmentTime = new Date(startAt);
    const now = new Date();
    const reminders = [];

    // Schedule 24h reminder
    if (settings.reminder_24h_before) {
      const remind24h = new Date(appointmentTime.getTime() - 24 * 60 * 60 * 1000);
      if (remind24h > now) {
        reminders.push({
          business_id: businessId,
          teacher_id: teacherId,
          appointment_id: appointmentId,
          reminder_type: "24h",
          scheduled_for: remind24h.toISOString(),
          status: "pending",
          created_at: now.toISOString(),
          updated_at: now.toISOString(),
        });
      }
    }

    // Schedule 1h reminder
    if (settings.reminder_1h_before) {
      const remind1h = new Date(appointmentTime.getTime() - 60 * 60 * 1000);
      if (remind1h > now) {
        reminders.push({
          business_id: businessId,
          teacher_id: teacherId,
          appointment_id: appointmentId,
          reminder_type: "1h",
          scheduled_for: remind1h.toISOString(),
          status: "pending",
          created_at: now.toISOString(),
          updated_at: now.toISOString(),
        });
      }
    }

    if (reminders.length > 0) {
      const { error } = await supabase
        .from("appointment_reminders")
        .insert(reminders);

      if (error) {
        console.error("[reminders/schedule] Insert error:", error);
        return NextResponse.json(
          { ok: false, error: "שגיאה בתזמון תזכורות" },
          { status: 500 }
        );
      }

      console.log(`[reminders/schedule] Scheduled ${reminders.length} reminders for appointment ${appointmentId}`);
    }

    return NextResponse.json({ ok: true, scheduled: reminders.length });
  } catch (e) {
    console.error("[reminders/schedule] Unexpected error:", e);
    return NextResponse.json(
      { ok: false, error: "שגיאה בלתי צפויה" },
      { status: 500 }
    );
  }
}
