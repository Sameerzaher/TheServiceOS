import type { SupabaseClient } from "@supabase/supabase-js";

type ReminderSettingsRow = {
  reminders_enabled: boolean;
  reminder_24h_enabled: boolean;
  reminder_24h_type: "sms" | "whatsapp";
  reminder_2h_enabled: boolean;
  reminder_2h_type: "sms" | "whatsapp";
  reminder_1h_enabled: boolean;
  reminder_1h_type: "sms" | "whatsapp";
};

type ReminderInsert = {
  business_id: string;
  teacher_id: string;
  appointment_id: string;
  reminder_type: "24h" | "2h" | "1h";
  scheduled_for: string;
  status: "pending";
  created_at: string;
  updated_at: string;
};

const DEFAULT_SETTINGS: ReminderSettingsRow = {
  reminders_enabled: true,
  reminder_24h_enabled: true,
  reminder_24h_type: "whatsapp",
  reminder_2h_enabled: false,
  reminder_2h_type: "whatsapp",
  reminder_1h_enabled: false,
  reminder_1h_type: "sms",
};

async function getOrCreateReminderSettings(
  supabase: SupabaseClient,
  teacherId: string,
): Promise<ReminderSettingsRow> {
  const { data: settings } = await supabase
    .from("reminder_settings")
    .select(
      "reminders_enabled, reminder_24h_enabled, reminder_24h_type, reminder_2h_enabled, reminder_2h_type, reminder_1h_enabled, reminder_1h_type",
    )
    .eq("teacher_id", teacherId)
    .maybeSingle();

  if (settings) return settings as ReminderSettingsRow;

  const { data: created } = await supabase
    .from("reminder_settings")
    .insert({
      teacher_id: teacherId,
      ...DEFAULT_SETTINGS,
      payment_reminder_enabled: true,
      payment_reminder_days_after: 3,
      payment_reminder_type: "whatsapp",
    })
    .select(
      "reminders_enabled, reminder_24h_enabled, reminder_24h_type, reminder_2h_enabled, reminder_2h_type, reminder_1h_enabled, reminder_1h_type",
    )
    .single();

  return (created as ReminderSettingsRow | null) ?? DEFAULT_SETTINGS;
}

/** Inserts pending rows into `appointment_reminders` based on teacher settings. */
export async function scheduleAppointmentReminders(
  supabase: SupabaseClient,
  params: {
    businessId: string;
    teacherId: string;
    appointmentId: string;
    startAt: string;
  },
): Promise<number> {
  const { businessId, teacherId, appointmentId, startAt } = params;
  const settings = await getOrCreateReminderSettings(supabase, teacherId);

  if (!settings.reminders_enabled) return 0;

  const appointmentTime = new Date(startAt);
  if (!Number.isFinite(appointmentTime.getTime())) return 0;

  const now = new Date();
  const reminders: ReminderInsert[] = [];

  const pushReminder = (
    enabled: boolean,
    type: "24h" | "2h" | "1h",
    offsetMs: number,
  ) => {
    if (!enabled) return;
    const scheduledFor = new Date(appointmentTime.getTime() - offsetMs);
    if (scheduledFor <= now) return;
    reminders.push({
      business_id: businessId,
      teacher_id: teacherId,
      appointment_id: appointmentId,
      reminder_type: type,
      scheduled_for: scheduledFor.toISOString(),
      status: "pending",
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    });
  };

  pushReminder(settings.reminder_24h_enabled, "24h", 24 * 60 * 60 * 1000);
  pushReminder(settings.reminder_2h_enabled, "2h", 2 * 60 * 60 * 1000);
  pushReminder(settings.reminder_1h_enabled, "1h", 60 * 60 * 1000);

  if (reminders.length === 0) return 0;

  const { error } = await supabase.from("appointment_reminders").insert(reminders);
  if (error) {
    console.error("[autoSchedule] Insert error:", error);
    return 0;
  }

  return reminders.length;
}
