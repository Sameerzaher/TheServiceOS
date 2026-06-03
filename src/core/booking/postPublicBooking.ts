import { randomUUID } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

import { heUi } from "@/config";
import {
  getSupabaseAppointmentsTable,
  getSupabaseClientsTable,
} from "@/core/config/supabaseEnv";
import { loadPublicBookingGate } from "@/core/repositories/supabase/bookingSettingsRepository";
import {
  AppointmentStatus,
  PaymentStatus,
  type AppointmentRecord,
} from "@/core/types/appointment";
import {
  appointmentFromRow,
  type AppointmentRow,
} from "@/core/storage/supabase/mappers";
import {
  bookingOverlapsExistingAppointments,
  isDateBlocked,
  normalizePhone,
  publicSlotOutsideBookingHorizon,
  type PublicBookingPayload,
} from "@/features/booking/logic/publicBookingShared";
import { publicBookingLog } from "@/lib/logging/publicBookingLog";

const HE_ERR_GENERIC = heUi.publicBooking.errServerGeneric;
const HE_ERR_UNAVAILABLE = heUi.publicBooking.errUnavailable;
const HE_ERR_CONFLICT = heUi.publicBooking.errSlotTaken;
const HE_ERR_SLOT_HORIZON = heUi.publicBooking.errDateNotInRange;
const HE_ERR_BLOCKED = "תאריך זה אינו זמין להזמנה";

export type PostPublicBookingInput = PublicBookingPayload & {
  teacherId: string;
};

export type PostPublicBookingResult =
  | { ok: true; appointmentId: string; clientId: string }
  | { ok: false; status: number; errorHe: string };

type ClientRow = {
  id: string;
  business_id: string;
  full_name: string;
  phone: string;
  notes: string;
  custom_fields: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

async function loadTeacherBusinessId(
  supabase: SupabaseClient,
  teacherId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("teachers")
    .select("business_id")
    .eq("id", teacherId)
    .maybeSingle();

  if (error) {
    publicBookingLog.error("Load teacher business_id error", {
      code: error.code,
      message: error.message,
    });
    return null;
  }
  const businessId =
    data && typeof data === "object"
      ? (data as { business_id?: string | null }).business_id ?? null
      : null;
  return typeof businessId === "string" && businessId.trim()
    ? businessId.trim()
    : null;
}

async function loadAppointmentsForOverlap(
  supabase: SupabaseClient,
  businessId: string,
  teacherId: string,
  appointmentsTable: string,
): Promise<{ appointments: AppointmentRecord[]; error: unknown | null }> {
  const { data: apptRows, error: apptLoadErr } = await supabase
    .from(appointmentsTable)
    .select("*")
    .eq("business_id", businessId)
    .eq("teacher_id", teacherId);

  if (apptLoadErr) {
    return { appointments: [], error: apptLoadErr };
  }

  const appointments: AppointmentRecord[] = [];
  for (const row of apptRows ?? []) {
    const a = appointmentFromRow(row as unknown as AppointmentRow);
    if (a) appointments.push(a);
  }
  return { appointments, error: null };
}

/**
 * Creates or updates client + appointment for the public booking flow.
 * Caller must enforce rate limits and parse/validate the HTTP body; this uses the service-role client.
 */
export async function postPublicBooking(
  supabase: SupabaseClient,
  input: PostPublicBookingInput,
): Promise<PostPublicBookingResult> {
  const {
    teacherId,
    fullName,
    phone,
    notes,
    slotStart,
    slotEnd,
    bookingCustomFields,
  } = input;

  const appointmentsTable = getSupabaseAppointmentsTable();
  const clientsTableName = getSupabaseClientsTable();
  const slotStartMs = new Date(slotStart).getTime();
  const nowMs = Date.now();

  try {
    const businessId = await loadTeacherBusinessId(supabase, teacherId);
    if (!businessId) {
      return { ok: false, status: 500, errorHe: HE_ERR_GENERIC };
    }

    const gate = await loadPublicBookingGate(supabase, businessId, teacherId);
    if (!gate.ok) {
      return { ok: false, status: 500, errorHe: HE_ERR_GENERIC };
    }

    if (!gate.bookingEnabled) {
      return { ok: false, status: 403, errorHe: HE_ERR_UNAVAILABLE };
    }

    if (publicSlotOutsideBookingHorizon(slotStartMs, nowMs, gate.daysAhead)) {
      return { ok: false, status: 400, errorHe: HE_ERR_SLOT_HORIZON };
    }

    const { data: blockedDates } = await supabase
      .from("blocked_dates")
      .select("blocked_date, is_recurring")
      .eq("business_id", businessId)
      .eq("teacher_id", teacherId);

    if (blockedDates && blockedDates.length > 0) {
      const mapped = blockedDates.map((b) => ({
        date: b.blocked_date,
        isRecurring: b.is_recurring,
      }));
      if (isDateBlocked(slotStart, mapped)) {
        return { ok: false, status: 400, errorHe: HE_ERR_BLOCKED };
      }
    }

    const firstLoad = await loadAppointmentsForOverlap(
      supabase,
      businessId,
      teacherId,
      appointmentsTable,
    );
    if (firstLoad.error) {
      publicBookingLog.error("Load appointments error", {});
      return { ok: false, status: 500, errorHe: HE_ERR_GENERIC };
    }

    if (
      bookingOverlapsExistingAppointments(
        slotStart,
        slotEnd,
        firstLoad.appointments,
      )
    ) {
      return { ok: false, status: 409, errorHe: HE_ERR_CONFLICT };
    }

    const { data: clientRows, error: clientLoadErr } = await supabase
      .from(clientsTableName)
      .select("*")
      .eq("business_id", businessId)
      .eq("teacher_id", teacherId);

    if (clientLoadErr) {
      publicBookingLog.error("Load clients error", {
        code: clientLoadErr.code,
        message: clientLoadErr.message,
      });
      return { ok: false, status: 500, errorHe: HE_ERR_GENERIC };
    }

    const targetKey = normalizePhone(phone);
    let clientId: string | null = null;
    for (const row of clientRows ?? []) {
      const cr = row as unknown as ClientRow;
      if (normalizePhone(cr.phone) === targetKey && targetKey.length > 0) {
        clientId = cr.id;
        break;
      }
    }

    const now = new Date().toISOString();

    if (!clientId) {
      clientId = randomUUID();
      const { error: insertClientErr } = await supabase
        .from(clientsTableName)
        .insert({
          id: clientId,
          business_id: businessId,
          teacher_id: teacherId,
          full_name: fullName,
          phone,
          notes,
          custom_fields: {},
          created_at: now,
          updated_at: now,
        });

      if (insertClientErr) {
        publicBookingLog.error("Insert client error", {
          code: insertClientErr.code,
          message: insertClientErr.message,
        });
        return { ok: false, status: 500, errorHe: HE_ERR_GENERIC };
      }
    } else {
      const { error: patchErr } = await supabase
        .from(clientsTableName)
        .update({
          full_name: fullName,
          notes,
          updated_at: now,
        })
        .eq("id", clientId)
        .eq("business_id", businessId)
        .eq("teacher_id", teacherId);

      if (patchErr) {
        publicBookingLog.error("Update client error", {
          code: patchErr.code,
          message: patchErr.message,
        });
        return { ok: false, status: 500, errorHe: HE_ERR_GENERIC };
      }
    }

    const preInsertLoad = await loadAppointmentsForOverlap(
      supabase,
      businessId,
      teacherId,
      appointmentsTable,
    );
    if (preInsertLoad.error) {
      publicBookingLog.error("Reload appointments error", {});
      return { ok: false, status: 500, errorHe: HE_ERR_GENERIC };
    }

    if (
      bookingOverlapsExistingAppointments(
        slotStart,
        slotEnd,
        preInsertLoad.appointments,
      )
    ) {
      return { ok: false, status: 409, errorHe: HE_ERR_CONFLICT };
    }

    const appointmentId = randomUUID();
    const customFields: Record<string, unknown> = {
      bookingSource: "public",
      bookingApproval: "pending",
      bookingSlotEnd: slotEnd,
      bookingNotes: notes,
    };
    for (const [k, v] of Object.entries(bookingCustomFields)) {
      customFields[k] = v;
    }

    const { error: insertApptErr } = await supabase
      .from(appointmentsTable)
      .insert({
        id: appointmentId,
        business_id: businessId,
        teacher_id: teacherId,
        client_id: clientId,
        start_at: slotStart,
        end_at: slotEnd,
        status: AppointmentStatus.Scheduled,
        payment_status: PaymentStatus.Unpaid,
        amount: 0,
        custom_fields: customFields,
        created_at: now,
        updated_at: now,
      });

    if (insertApptErr) {
      publicBookingLog.error("Insert appointment error", {
        code: insertApptErr.code,
        message: insertApptErr.message,
      });
      return { ok: false, status: 500, errorHe: HE_ERR_GENERIC };
    }

    try {
      await supabase.from("notifications").insert({
        business_id: businessId,
        teacher_id: teacherId,
        type: "new_booking",
        title: "הזמנה חדשה ממתינה לאישור",
        message: `${fullName} הזמין תור ל-${new Date(slotStart).toLocaleString("he-IL", {
          dateStyle: "short",
          timeStyle: "short",
        })}`,
        entity_type: "appointment",
        entity_id: appointmentId,
        is_read: false,
        created_at: now,
      });
    } catch (notifErr) {
      publicBookingLog.warn("Failed to create notification", {
        err: String(notifErr),
      });
    }

    publicBookingLog.debug("Booking created", {
      appointmentId,
      teacherId,
    });

    return { ok: true, appointmentId, clientId };
  } catch (e) {
    publicBookingLog.error("Unexpected error", { err: String(e) });
    return { ok: false, status: 500, errorHe: HE_ERR_GENERIC };
  }
}
