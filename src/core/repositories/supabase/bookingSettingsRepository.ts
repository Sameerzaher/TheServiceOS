import type { SupabaseClient } from "@supabase/supabase-js";

import { isMissingColumnError } from "@/core/repositories/supabase/postgrestErrors";
import {
  normalizeAvailabilitySettings,
  type AvailabilitySettings,
} from "@/core/types/availability";

function safeLoadingDefaults(): AvailabilitySettings {
  return normalizeAvailabilitySettings({ bookingEnabled: false });
}

function mapRowToPartial(row: Record<string, unknown>) {
  return {
    bookingEnabled: row.booking_enabled,
    weeklyAvailability: row.weekly_availability,
    slotDurationMinutes: row.slot_duration_minutes,
    daysAhead: row.days_ahead,
    enableAutoReminders: row.enable_auto_reminders,
    reminder24hBefore: row.reminder_24h_before,
    reminder1hBefore: row.reminder_1h_before,
    reminderCustomMessage: row.reminder_custom_message,
  };
}

/**
 * Public / instructor availability (`booking_settings` columns ↔ `AvailabilitySettings`).
 * Single source of truth for weekly slots and booking toggle.
 */
export async function loadBookingSettings(
  supabase: SupabaseClient,
  businessId: string,
  teacherId: string,
): Promise<AvailabilitySettings> {
  let data: Record<string, unknown> | null = null;
  const res = await supabase
    .from("booking_settings")
    .select("*")
    .eq("business_id", businessId)
    .eq("teacher_id", teacherId)
    .maybeSingle();

  if (res.error) {
    if (isMissingColumnError(res.error)) {
      const legacy = await supabase
        .from("booking_settings")
        .select("*")
        .eq("business_id", businessId)
        .maybeSingle();
      if (legacy.error) {
        console.error("[ServiceOS] loadBookingSettings (legacy)", legacy.error);
        throw legacy.error;
      }
      data = legacy.data as Record<string, unknown> | null;
    } else {
      console.error("[ServiceOS] loadBookingSettings", res.error);
      throw res.error;
    }
  } else {
    data = res.data as Record<string, unknown> | null;
  }

  if (!data || typeof data !== "object") {
    return normalizeAvailabilitySettings({ bookingEnabled: false, teacherId });
  }

  return normalizeAvailabilitySettings({
    ...mapRowToPartial(data),
    teacherId,
  });
}

/**
 * Same as {@link loadBookingSettings} but never throws — returns safe defaults on
 * empty scope, missing tables, or PostgREST errors (public bootstrap, cron, etc.).
 */
export async function loadBookingSettingsOrDefault(
  supabase: SupabaseClient,
  businessId: string,
  teacherId: string,
  logContext?: string,
): Promise<AvailabilitySettings> {
  const tid = typeof teacherId === "string" ? teacherId.trim() : "";
  const bid = typeof businessId === "string" ? businessId.trim() : "";
  if (!tid || !bid) {
    console.warn(
      "[ServiceOS] loadBookingSettingsOrDefault: missing business_id or teacher_id",
      logContext ?? "",
      { businessId: bid, teacherId: tid },
    );
    return normalizeAvailabilitySettings({
      bookingEnabled: false,
      teacherId: tid || teacherId,
    });
  }
  try {
    return await loadBookingSettings(supabase, bid, tid);
  } catch (e) {
    console.error(
      "[ServiceOS] loadBookingSettingsOrDefault failed; using defaults",
      logContext ?? "",
      e,
    );
    return normalizeAvailabilitySettings({
      bookingEnabled: false,
      teacherId: tid,
    });
  }
}

export async function persistBookingSettings(
  supabase: SupabaseClient,
  businessId: string,
  teacherId: string,
  settings: AvailabilitySettings,
): Promise<void> {
  const row = {
    business_id: businessId,
    teacher_id: teacherId,
    booking_enabled: settings.bookingEnabled,
    weekly_availability: settings.weeklyAvailability,
    slot_duration_minutes: settings.slotDurationMinutes,
    days_ahead: settings.daysAhead,
    enable_auto_reminders: settings.enableAutoReminders ?? false,
    reminder_24h_before: settings.reminder24hBefore ?? true,
    reminder_1h_before: settings.reminder1hBefore ?? true,
    reminder_custom_message:
      settings.reminderCustomMessage?.trim() || null,
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabase.from("booking_settings").upsert(row, {
    onConflict: "business_id,teacher_id",
  });
  if (!error) return;

  if (isMissingColumnError(error)) {
    const legacyRow = {
      business_id: businessId,
      booking_enabled: settings.bookingEnabled,
      weekly_availability: settings.weeklyAvailability,
      slot_duration_minutes: settings.slotDurationMinutes,
      days_ahead: settings.daysAhead,
      updated_at: new Date().toISOString(),
    };
    const { error: legacyErr } = await supabase
      .from("booking_settings")
      .upsert(legacyRow, { onConflict: "business_id" });
    if (legacyErr) throw legacyErr;
    return;
  }

  throw error;
}

/** @deprecated Use `loadBookingSettings`; kept for `ServiceStorage` shape. */
export const loadAvailabilitySettings = loadBookingSettings;

/** @deprecated Use `persistBookingSettings`; kept for `ServiceStorage` shape. */
export const persistAvailabilitySettings = persistBookingSettings;

export type PublicBookingGate =
  | { ok: true; bookingEnabled: boolean; daysAhead: number }
  | { ok: false };

/**
 * Load booking toggle + horizon for server-side public booking validation.
 * On hard DB errors returns `{ ok: false }` so the route can respond 500 (no silent defaults).
 */
export async function loadPublicBookingGate(
  supabase: SupabaseClient,
  businessId: string,
  teacherId: string,
): Promise<PublicBookingGate> {
  let data: Record<string, unknown> | null = null;
  const res = await supabase
    .from("booking_settings")
    .select("booking_enabled, days_ahead")
    .eq("business_id", businessId)
    .eq("teacher_id", teacherId)
    .maybeSingle();

  if (res.error) {
    if (isMissingColumnError(res.error)) {
      const legacy = await supabase
        .from("booking_settings")
        .select("booking_enabled, days_ahead")
        .eq("business_id", businessId)
        .maybeSingle();
      if (legacy.error) {
        console.error("[ServiceOS] loadPublicBookingGate (legacy)", legacy.error);
        return { ok: false };
      }
      data = legacy.data as Record<string, unknown> | null;
    } else {
      console.error("[ServiceOS] loadPublicBookingGate", res.error);
      return { ok: false };
    }
  } else {
    data = res.data as Record<string, unknown> | null;
  }

  if (!data || typeof data !== "object") {
    const safe = safeLoadingDefaults();
    return {
      ok: true,
      bookingEnabled: safe.bookingEnabled,
      daysAhead: safe.daysAhead,
    };
  }

  const normalized = normalizeAvailabilitySettings(
    mapRowToPartial(data as Record<string, unknown>),
  );
  return {
    ok: true,
    bookingEnabled: normalized.bookingEnabled,
    daysAhead: normalized.daysAhead,
  };
}
