import type { SupabaseClient } from "@supabase/supabase-js";

import { getSupabaseAppointmentsTable, getSupabaseClientsTable } from "@/core/config/supabaseEnv";
import { isMissingColumnError } from "@/core/repositories/supabase/postgrestErrors";
import {
  appointmentFromRow,
  type AppointmentRow,
} from "@/core/storage/supabase/mappers";
import type { AppointmentRecord } from "@/core/types/appointment";
import { AppointmentStatus } from "@/core/types/appointment";

import { getGoogleEventId, patchGoogleCalendarSyncFields } from "./appointmentCustomFields";
import {
  deleteCalendarEvent,
  insertCalendarEvent,
  updateCalendarEvent,
} from "./calendarEventsClient";
import { buildCalendarEventPayload } from "./buildCalendarEventBody";
import type { GoogleCalendarIntegrationRow } from "./integrationTypes";
import {
  getGoogleCalendarIntegration,
  getRefreshTokenFromRow,
  updateIntegrationSyncMeta,
} from "./integrationRepository";
import { refreshAccessToken } from "./googleTokenClient";

async function getValidAccessToken(
  supabase: SupabaseClient,
  businessId: string,
  teacherId: string,
  row: GoogleCalendarIntegrationRow,
): Promise<string | null> {
  const rt = getRefreshTokenFromRow(row);
  if (!rt) {
    console.warn("[googleCalendar] could not decrypt refresh token");
    return null;
  }
  if (row.access_token && row.access_token_expires_at) {
    const exp = new Date(row.access_token_expires_at).getTime();
    if (Number.isFinite(exp) && Date.now() < exp - 60_000) {
      return row.access_token;
    }
  }
  const refreshed = await refreshAccessToken(rt);
  if (!refreshed) {
    await updateIntegrationSyncMeta(supabase, businessId, teacherId, {
      last_sync_at: new Date().toISOString(),
      last_sync_status: "error",
      last_sync_error: "token_refresh_failed",
    });
    return null;
  }
  await updateIntegrationSyncMeta(supabase, businessId, teacherId, {
    access_token: refreshed.accessToken,
    access_token_expires_at: refreshed.expiresAt.toISOString(),
  });
  return refreshed.accessToken;
}

async function loadAppointmentRow(
  supabase: SupabaseClient,
  businessId: string,
  teacherId: string,
  appointmentId: string,
): Promise<AppointmentRecord | null> {
  const table = getSupabaseAppointmentsTable();
  let res = await supabase
    .from(table)
    .select("*")
    .eq("id", appointmentId)
    .eq("business_id", businessId)
    .eq("teacher_id", teacherId)
    .maybeSingle();
  if (res.error && isMissingColumnError(res.error)) {
    res = await supabase
      .from(table)
      .select("*")
      .eq("id", appointmentId)
      .eq("business_id", businessId)
      .maybeSingle();
  }
  if (res.error || !res.data) return null;
  return appointmentFromRow(res.data as unknown as AppointmentRow);
}

async function loadClientContact(
  supabase: SupabaseClient,
  businessId: string,
  teacherId: string,
  clientId: string,
): Promise<{ name: string; phone: string }> {
  const table = getSupabaseClientsTable();
  let res = await supabase
    .from(table)
    .select("full_name, phone")
    .eq("id", clientId)
    .eq("business_id", businessId)
    .eq("teacher_id", teacherId)
    .maybeSingle();
  if (res.error && isMissingColumnError(res.error)) {
    res = await supabase
      .from(table)
      .select("full_name, phone")
      .eq("id", clientId)
      .eq("business_id", businessId)
      .maybeSingle();
  }
  const row = res.data as { full_name?: string; phone?: string } | null;
  return {
    name: typeof row?.full_name === "string" ? row.full_name : "לקוח",
    phone: typeof row?.phone === "string" ? row.phone : "",
  };
}

async function persistAppointmentCustomFields(
  supabase: SupabaseClient,
  businessId: string,
  teacherId: string,
  appointmentId: string,
  customFields: Record<string, unknown>,
): Promise<void> {
  const table = getSupabaseAppointmentsTable();
  const payload = {
    custom_fields: customFields,
    updated_at: new Date().toISOString(),
  };
  let up = await supabase
    .from(table)
    .update(payload)
    .eq("id", appointmentId)
    .eq("business_id", businessId)
    .eq("teacher_id", teacherId);
  if (up.error && isMissingColumnError(up.error)) {
    up = await supabase
      .from(table)
      .update(payload)
      .eq("id", appointmentId)
      .eq("business_id", businessId);
  }
  if (up.error) {
    console.error("[googleCalendar] failed to persist custom_fields", up.error);
  }
}

/**
 * Runs Google Calendar sync for one appointment (create/update/delete event).
 * Safe to fire-and-forget: never throws; logs errors.
 */
export async function syncAppointmentToGoogleCalendar(params: {
  supabase: SupabaseClient;
  businessId: string;
  teacherId: string;
  appointmentId: string;
  /** When true, delete Google event (e.g. DB row already removed). */
  deleteMode?: boolean;
  /** Preloaded custom_fields + client info for delete when row is gone */
  preloadedEventId?: string | null;
}): Promise<void> {
  const {
    supabase,
    businessId,
    teacherId,
    appointmentId,
    deleteMode,
    preloadedEventId,
  } = params;

  try {
    const integration = await getGoogleCalendarIntegration(
      supabase,
      businessId,
      teacherId,
    );
    if (!integration || !integration.sync_enabled) {
      return;
    }

    const accessToken = await getValidAccessToken(
      supabase,
      businessId,
      teacherId,
      integration,
    );
    if (!accessToken) return;

    const calendarId = integration.calendar_id || "primary";

    if (deleteMode) {
      const eventId =
        preloadedEventId ??
        (await (async () => {
          const row = await loadAppointmentRow(
            supabase,
            businessId,
            teacherId,
            appointmentId,
          );
          return row ? getGoogleEventId(row.customFields) : null;
        })());

      if (eventId) {
        const ok = await deleteCalendarEvent({
          accessToken,
          calendarId,
          eventId,
        });
        console.log(
          `[googleCalendar] delete appointment=${appointmentId} event=${eventId} ok=${ok}`,
        );
      }
      await updateIntegrationSyncMeta(supabase, businessId, teacherId, {
        last_sync_at: new Date().toISOString(),
        last_sync_status: "ok",
        last_sync_error: null,
      });
      return;
    }

    const appt = await loadAppointmentRow(
      supabase,
      businessId,
      teacherId,
      appointmentId,
    );
    if (!appt) return;

    const client = await loadClientContact(
      supabase,
      businessId,
      teacherId,
      appt.clientId,
    );

    const existingEventId = getGoogleEventId(appt.customFields);
    const terminal =
      appt.status === AppointmentStatus.Cancelled ||
      appt.status === AppointmentStatus.NoShow;

    if (terminal && existingEventId) {
      await deleteCalendarEvent({
        accessToken,
        calendarId,
        eventId: existingEventId,
      });
      const cleared = patchGoogleCalendarSyncFields(appt.customFields, {
        eventId: null,
        syncedAt: null,
        lastError: null,
      });
      await persistAppointmentCustomFields(
        supabase,
        businessId,
        teacherId,
        appointmentId,
        cleared,
      );
      await updateIntegrationSyncMeta(supabase, businessId, teacherId, {
        last_sync_at: new Date().toISOString(),
        last_sync_status: "ok",
        last_sync_error: null,
      });
      return;
    }

    if (terminal && !existingEventId) {
      return;
    }

    const body = buildCalendarEventPayload({
      appointment: appt,
      clientName: client.name,
      clientPhone: client.phone,
      descriptionTemplate: integration.description_template,
    });

    let eventId = existingEventId;
    let errMsg: string | null = null;

    if (!eventId) {
      const created = await insertCalendarEvent({
        accessToken,
        calendarId,
        body,
      });
      if (created) {
        eventId = created.id;
      } else {
        errMsg = "insert_failed";
      }
    } else {
      const ok = await updateCalendarEvent({
        accessToken,
        calendarId,
        eventId,
        body,
      });
      if (!ok) errMsg = "update_failed";
    }

    const nowIso = new Date().toISOString();
    const nextFields = patchGoogleCalendarSyncFields(appt.customFields, {
      eventId: eventId ?? null,
      syncedAt: errMsg ? null : nowIso,
      lastError: errMsg,
    });

    await persistAppointmentCustomFields(
      supabase,
      businessId,
      teacherId,
      appointmentId,
      nextFields,
    );

    await updateIntegrationSyncMeta(supabase, businessId, teacherId, {
      last_sync_at: nowIso,
      last_sync_status: errMsg ? "error" : "ok",
      last_sync_error: errMsg,
    });

    console.log(
      `[googleCalendar] sync appointment=${appointmentId} event=${eventId ?? "n/a"} status=${errMsg ?? "ok"}`,
    );
  } catch (e) {
    console.error("[googleCalendar] syncAppointmentToGoogleCalendar", e);
    try {
      await updateIntegrationSyncMeta(supabase, businessId, teacherId, {
        last_sync_at: new Date().toISOString(),
        last_sync_status: "error",
        last_sync_error: String(e),
      });
    } catch {
      /* ignore */
    }
  }
}

/** Fire-and-forget wrapper for API routes. */
export function scheduleGoogleCalendarSync(
  params: Parameters<typeof syncAppointmentToGoogleCalendar>[0],
): void {
  void syncAppointmentToGoogleCalendar(params).catch((e) =>
    console.error("[googleCalendar] schedule", e),
  );
}
