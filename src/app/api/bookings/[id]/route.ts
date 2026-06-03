import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

import {
  getSupabaseAppointmentsTable,
  getSupabaseClientsTable,
} from "@/core/config/supabaseEnv";
import { resolveBusinessIdForTeacher } from "@/lib/api/resolveBusinessId";
import { isMissingColumnError } from "@/core/repositories/supabase/postgrestErrors";
import { AppointmentStatus, PaymentStatus } from "@/core/types/appointment";
import { PUBLIC_BOOKING_CUSTOM_FIELD_KEYS } from "@/features/booking/logic/publicBookingShared";
import { resolveTeacherIdFromRequest } from "@/lib/api/resolveTeacherId";
import {
  getSupabaseAdminClient,
  isSupabaseAdminConfigured,
} from "@/lib/supabase/adminClient";

export const runtime = "nodejs";

/** Avoid static-path worker / stale chunk resolution for this route on Windows dev. */
export const dynamic = "force-dynamic";

const HE_ERR_UNAVAILABLE = "עדכון בקשה אינו זמין כרגע. נסו שוב מאוחר יותר.";
const HE_ERR_INVALID = "בקשה לא תקינה.";
const HE_ERR_GENERIC = "אירעה תקלה בעדכון הבקשה. נסו שוב.";

type BookingStatus = "pending" | "confirmed" | "cancelled";

function parseStatus(raw: unknown): BookingStatus | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const status = o.status;
  if (
    status === "pending" ||
    status === "confirmed" ||
    status === "cancelled"
  ) {
    return status;
  }
  return null;
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      { ok: false as const, error: HE_ERR_UNAVAILABLE },
      { status: 503 },
    );
  }

  const id = params.id?.trim();
  if (!id) {
    return NextResponse.json(
      { ok: false as const, error: HE_ERR_INVALID },
      { status: 400 },
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

  const nextStatus = parseStatus(raw);
  if (!nextStatus) {
    return NextResponse.json(
      { ok: false as const, error: HE_ERR_INVALID },
      { status: 400 },
    );
  }

  try {
    const supabase = getSupabaseAdminClient();
    const teacherId = resolveTeacherIdFromRequest(req, raw);
    const businessId = await resolveBusinessIdForTeacher(
      supabase,
      teacherId,
      "bookings/put",
    );
    const table = getSupabaseAppointmentsTable();
    const clientsTable = getSupabaseClientsTable();

    let loadRes = await supabase
      .from(table)
      .select("client_id, start_at, end_at, custom_fields, status")
      .eq("id", id)
      .eq("business_id", businessId)
      .eq("teacher_id", teacherId)
      .maybeSingle();
    if (loadRes.error && isMissingColumnError(loadRes.error)) {
      loadRes = await supabase
        .from(table)
        .select("client_id, start_at, end_at, custom_fields, status")
        .eq("id", id)
        .eq("business_id", businessId)
        .maybeSingle();
    }
    const { data: existing, error: loadErr } = loadRes;
    if (loadErr) throw loadErr;
    if (!existing) {
      return NextResponse.json(
        { ok: false as const, error: HE_ERR_INVALID },
        { status: 404 },
      );
    }

    const customFields =
      existing.custom_fields &&
      typeof existing.custom_fields === "object" &&
      !Array.isArray(existing.custom_fields)
        ? (existing.custom_fields as Record<string, unknown>)
        : {};

    const source = customFields.bookingSource;
    if (source !== "public") {
      return NextResponse.json(
        { ok: false as const, error: HE_ERR_INVALID },
        { status: 400 },
      );
    }

    // Confirm request: create a new real appointment and remove request row.
    if (nextStatus === "confirmed") {
      const nowIso = new Date().toISOString();

      let dupCheck = await supabase
        .from(table)
        .select("id")
        .eq("business_id", businessId)
        .eq("teacher_id", teacherId)
        .eq("custom_fields->>sourceBookingId", id)
        .limit(1);
      if (dupCheck.error && isMissingColumnError(dupCheck.error)) {
        dupCheck = await supabase
          .from(table)
          .select("id")
          .eq("business_id", businessId)
          .eq("custom_fields->>sourceBookingId", id)
          .limit(1);
      }
      const { data: existingConfirmedRows, error: existingConfirmedErr } =
        dupCheck;
      if (existingConfirmedErr) throw existingConfirmedErr;
      if ((existingConfirmedRows ?? []).length > 0) {
        let delDup = await supabase
          .from(table)
          .delete()
          .eq("id", id)
          .eq("business_id", businessId)
          .eq("teacher_id", teacherId);
        if (delDup.error && isMissingColumnError(delDup.error)) {
          delDup = await supabase
            .from(table)
            .delete()
            .eq("id", id)
            .eq("business_id", businessId);
        }
        if (delDup.error) throw delDup.error;
        return NextResponse.json({ ok: true as const, duplicate: true });
      }

      let clientRes = await supabase
        .from(clientsTable)
        .select("id, full_name, phone")
        .eq("id", existing.client_id)
        .eq("business_id", businessId)
        .eq("teacher_id", teacherId)
        .maybeSingle();
      if (clientRes.error && isMissingColumnError(clientRes.error)) {
        clientRes = await supabase
          .from(clientsTable)
          .select("id, full_name, phone")
          .eq("id", existing.client_id)
          .eq("business_id", businessId)
          .maybeSingle();
      }
      const { data: client, error: clientErr } = clientRes;
      if (clientErr || !client) {
        throw clientErr ?? new Error("client not found for booking request");
      }

      const nextNotesRaw = customFields.bookingNotes;
      const nextNotes =
        typeof nextNotesRaw === "string" ? nextNotesRaw.trim() : "";

      const clientFullName =
        typeof client.full_name === "string" ? client.full_name.trim() : "";
      const clientPhone =
        typeof client.phone === "string" ? client.phone.trim() : "";

      const appointmentId = randomUUID();
      const appointmentCustomFields: Record<string, unknown> = {
        notes: nextNotes,
        clientName: clientFullName,
        clientPhone,
      };
      for (const key of PUBLIC_BOOKING_CUSTOM_FIELD_KEYS) {
        const v = customFields[key];
        if (typeof v === "string" && v.trim().length > 0) {
          appointmentCustomFields[key] = v.trim();
        }
      }
      if (typeof customFields.bookingDate === "string") {
        appointmentCustomFields.bookingDate = customFields.bookingDate;
      }
      if (typeof customFields.bookingTime === "string") {
        appointmentCustomFields.bookingTime = customFields.bookingTime;
      }
      appointmentCustomFields.sourceBookingId = id;

      const startIso =
        typeof existing.start_at === "string" ? existing.start_at : nowIso;
      const parsedStartMs = new Date(startIso).getTime();
      const fallbackEndIso = Number.isFinite(parsedStartMs)
        ? new Date(parsedStartMs + 40 * 60 * 1000).toISOString()
        : startIso;
      const endIso =
        typeof existing.end_at === "string" && existing.end_at.trim().length > 0
          ? existing.end_at
          : fallbackEndIso;

      const baseConfirmedAppt = {
        id: appointmentId,
        business_id: businessId,
        client_id: existing.client_id,
        start_at: startIso,
        end_at: endIso,
        status: AppointmentStatus.Scheduled,
        payment_status: PaymentStatus.Unpaid,
        amount: 0,
        custom_fields: appointmentCustomFields,
        created_at: nowIso,
        updated_at: nowIso,
      };
      let insertRes = await supabase.from(table).insert({
        ...baseConfirmedAppt,
        teacher_id: teacherId,
      });
      if (insertRes.error && isMissingColumnError(insertRes.error)) {
        insertRes = await supabase.from(table).insert(baseConfirmedAppt);
      }
      if (insertRes.error) throw insertRes.error;

      let delAfter = await supabase
        .from(table)
        .delete()
        .eq("id", id)
        .eq("business_id", businessId)
        .eq("teacher_id", teacherId);
      if (delAfter.error && isMissingColumnError(delAfter.error)) {
        delAfter = await supabase
          .from(table)
          .delete()
          .eq("id", id)
          .eq("business_id", businessId);
      }
      if (delAfter.error) throw delAfter.error;

      return NextResponse.json({
        ok: true as const,
        appointmentId,
      });
    }

    let appointmentStatus = existing.status;
    let bookingApproval: "pending" | "approved" | "rejected" = "pending";
    if (nextStatus === "cancelled") {
      bookingApproval = "rejected";
      appointmentStatus = AppointmentStatus.Cancelled;
    }

    const updatePayload = {
      status: appointmentStatus,
      custom_fields: {
        ...customFields,
        bookingSource: "public",
        bookingApproval,
        bookingRequestStatus: nextStatus,
      },
      updated_at: new Date().toISOString(),
    };
    let updateRes = await supabase
      .from(table)
      .update(updatePayload)
      .eq("id", id)
      .eq("business_id", businessId)
      .eq("teacher_id", teacherId);
    if (updateRes.error && isMissingColumnError(updateRes.error)) {
      updateRes = await supabase
        .from(table)
        .update(updatePayload)
        .eq("id", id)
        .eq("business_id", businessId);
    }
    const { error: updateErr } = updateRes;
    if (updateErr) throw updateErr;

    return NextResponse.json({ ok: true as const });
  } catch (e) {
    console.error("[bookings/put]", e);
    return NextResponse.json(
      { ok: false as const, error: HE_ERR_GENERIC },
      { status: 500 },
    );
  }
}
