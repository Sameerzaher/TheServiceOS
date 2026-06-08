import { NextResponse } from "next/server";

import { scheduleAppointmentReminders } from "@/core/reminders/autoSchedule";
import {
  getSupabaseAdminClient,
  isSupabaseAdminConfigured,
} from "@/lib/supabase/adminClient";
import { messagingService } from "@/lib/messaging/messagingService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PendingReminder = {
  id: string;
  business_id: string;
  teacher_id: string;
  appointment_id: string;
  reminder_type: "24h" | "2h" | "1h" | "custom";
  scheduled_for: string;
};

type ReminderSettingsRow = {
  reminder_24h_type: "sms" | "whatsapp";
  reminder_2h_type: "sms" | "whatsapp";
  reminder_1h_type: "sms" | "whatsapp";
  payment_reminder_enabled: boolean;
  payment_reminder_days_after: number;
  payment_reminder_type: "sms" | "whatsapp";
};

function isAuthorizedCron(req: Request): boolean {
  if (req.headers.get("x-vercel-cron") === "1") return true;
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return process.env.NODE_ENV === "development";
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

function messageTypeForReminder(
  reminderType: PendingReminder["reminder_type"],
  settings: ReminderSettingsRow,
): "sms" | "whatsapp" {
  switch (reminderType) {
    case "24h":
      return settings.reminder_24h_type;
    case "2h":
      return settings.reminder_2h_type;
    case "1h":
      return settings.reminder_1h_type;
    default:
      return "whatsapp";
  }
}

/**
 * GET /api/reminders/process
 * Cron job: send due appointment reminders + payment reminders.
 */
export async function GET(req: Request): Promise<NextResponse> {
  if (!isAuthorizedCron(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      { ok: false, error: "Supabase not configured" },
      { status: 503 },
    );
  }

  const supabase = getSupabaseAdminClient();
  const nowIso = new Date().toISOString();
  let sent = 0;
  let failed = 0;
  let paymentSent = 0;

  const { data: dueReminders, error: dueError } = await supabase
    .from("appointment_reminders")
    .select("id, business_id, teacher_id, appointment_id, reminder_type, scheduled_for")
    .eq("status", "pending")
    .lte("scheduled_for", nowIso)
    .order("scheduled_for", { ascending: true })
    .limit(50);

  if (dueError) {
    console.error("[reminders/process] Fetch due reminders error:", dueError);
    return NextResponse.json(
      { ok: false, error: "Failed to load reminders" },
      { status: 500 },
    );
  }

  for (const reminder of (dueReminders ?? []) as PendingReminder[]) {
    try {
      const { data: appointment } = await supabase
        .from("appointments")
        .select(
          `
          id,
          start_at,
          status,
          clients ( id, full_name, phone ),
          teachers ( business_name )
        `,
        )
        .eq("id", reminder.appointment_id)
        .maybeSingle();

      if (!appointment || appointment.status === "cancelled") {
        await supabase
          .from("appointment_reminders")
          .update({ status: "cancelled", updated_at: nowIso })
          .eq("id", reminder.id);
        continue;
      }

      const client = Array.isArray(appointment.clients)
        ? appointment.clients[0]
        : appointment.clients;
      const teacher = Array.isArray(appointment.teachers)
        ? appointment.teachers[0]
        : appointment.teachers;

      if (!client?.phone) {
        await supabase
          .from("appointment_reminders")
          .update({
            status: "failed",
            error_message: "Missing client phone",
            updated_at: nowIso,
          })
          .eq("id", reminder.id);
        failed += 1;
        continue;
      }

      const { data: settings } = await supabase
        .from("reminder_settings")
        .select(
          "reminder_24h_type, reminder_2h_type, reminder_1h_type, payment_reminder_enabled, payment_reminder_days_after, payment_reminder_type",
        )
        .eq("teacher_id", reminder.teacher_id)
        .maybeSingle();

      const reminderSettings = (settings as ReminderSettingsRow | null) ?? {
        reminder_24h_type: "whatsapp",
        reminder_2h_type: "whatsapp",
        reminder_1h_type: "sms",
        payment_reminder_enabled: true,
        payment_reminder_days_after: 3,
        payment_reminder_type: "whatsapp",
      };

      const messageType = messageTypeForReminder(
        reminder.reminder_type,
        reminderSettings,
      );

      const result = await messagingService.sendAppointmentReminder(
        client.phone,
        client.full_name ?? "לקוח",
        new Date(appointment.start_at),
        teacher?.business_name ?? "העסק",
        messageType,
      );

      await supabase.from("message_logs").insert({
        business_id: reminder.business_id,
        appointment_id: reminder.appointment_id,
        client_id: client.id,
        phone_number: client.phone,
        message_type: messageType,
        message_purpose: "appointment_reminder",
        message_content: `Auto reminder (${reminder.reminder_type}) for ${appointment.start_at}`,
        status: result.success ? "sent" : "failed",
        provider: result.provider,
        provider_message_id: result.messageId,
        error_message: result.error,
        sent_at: result.success ? nowIso : null,
      });

      await supabase
        .from("appointment_reminders")
        .update({
          status: result.success ? "sent" : "failed",
          sent_at: result.success ? nowIso : null,
          error_message: result.error ?? null,
          updated_at: nowIso,
        })
        .eq("id", reminder.id);

      if (result.success) sent += 1;
      else failed += 1;
    } catch (e) {
      console.error("[reminders/process] Reminder error:", reminder.id, e);
      await supabase
        .from("appointment_reminders")
        .update({
          status: "failed",
          error_message: String(e),
          updated_at: nowIso,
        })
        .eq("id", reminder.id);
      failed += 1;
    }
  }

  // Payment reminders: unpaid completed appointments past due window
  const { data: paymentSettingsRows } = await supabase
    .from("reminder_settings")
    .select(
      "teacher_id, payment_reminder_enabled, payment_reminder_days_after, payment_reminder_type",
    )
    .eq("payment_reminder_enabled", true);

  for (const row of paymentSettingsRows ?? []) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - row.payment_reminder_days_after);

    const { data: unpaidAppointments } = await supabase
      .from("appointments")
      .select(
        `
        id,
        amount,
        start_at,
        business_id,
        clients ( id, full_name, phone ),
        teachers ( business_name )
      `,
      )
      .eq("teacher_id", row.teacher_id)
      .eq("status", "completed")
      .in("payment_status", ["unpaid", "pending", "partial"])
      .lte("start_at", cutoff.toISOString())
      .limit(20);

    for (const apt of unpaidAppointments ?? []) {
      const { data: existingLog } = await supabase
        .from("message_logs")
        .select("id")
        .eq("appointment_id", apt.id)
        .eq("message_purpose", "payment_reminder")
        .eq("status", "sent")
        .maybeSingle();

      if (existingLog) continue;

      const client = Array.isArray(apt.clients) ? apt.clients[0] : apt.clients;
      const teacher = Array.isArray(apt.teachers) ? apt.teachers[0] : apt.teachers;
      if (!client?.phone) continue;

      const result = await messagingService.sendPaymentReminder(
        client.phone,
        client.full_name ?? "לקוח",
        apt.amount ?? 0,
        teacher?.business_name ?? "העסק",
        row.payment_reminder_type,
      );

      await supabase.from("message_logs").insert({
        business_id: apt.business_id,
        appointment_id: apt.id,
        client_id: client.id,
        phone_number: client.phone,
        message_type: row.payment_reminder_type,
        message_purpose: "payment_reminder",
        message_content: `Payment reminder for appointment ${apt.start_at}`,
        status: result.success ? "sent" : "failed",
        provider: result.provider,
        provider_message_id: result.messageId,
        error_message: result.error,
        sent_at: result.success ? nowIso : null,
      });

      if (result.success) paymentSent += 1;
    }
  }

  return NextResponse.json({
    ok: true,
    processed: (dueReminders ?? []).length,
    sent,
    failed,
    paymentSent,
  });
}
