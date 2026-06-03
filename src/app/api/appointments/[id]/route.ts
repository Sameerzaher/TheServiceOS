import { NextResponse } from "next/server";

import { getSupabaseAppointmentsTable, getSupabaseBusinessId } from "@/core/config/supabaseEnv";
import { isMissingColumnError } from "@/core/repositories/supabase/postgrestErrors";
import { AppointmentStatus, PaymentStatus } from "@/core/types/appointment";
import { resolveTeacherIdFromRequest } from "@/lib/api/resolveTeacherId";
import { getGoogleEventId } from "@/core/integrations/googleCalendar/appointmentCustomFields";
import { scheduleGoogleCalendarSync } from "@/core/integrations/googleCalendar/syncAppointmentToGoogleCalendar";
import {
  getSupabaseAdminClient,
  isSupabaseAdminConfigured,
} from "@/lib/supabase/adminClient";

export const runtime = "nodejs";

const HE_ERR_UNAVAILABLE = "שמירת שיעורים אינה זמינה כרגע. נסו שוב מאוחר יותר.";
const HE_ERR_INVALID = "בקשה לא תקינה.";
const HE_ERR_GENERIC = "אירעה תקלה בעדכון השיעור. נסו שוב.";

function isStatus(value: string): value is AppointmentStatus {
  return (Object.values(AppointmentStatus) as string[]).includes(value);
}

function isPaymentStatus(value: string): value is PaymentStatus {
  return (Object.values(PaymentStatus) as string[]).includes(value);
}

function toDbPaymentStatus(value: PaymentStatus): PaymentStatus {
  return value === PaymentStatus.Pending ? PaymentStatus.Unpaid : value;
}

function parsePatch(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== "object") return null;
  const body = raw as Record<string, unknown>;
  const payload: Record<string, unknown> = {};
  const customPatch: Record<string, unknown> = {};

  if ("clientId" in body) {
    if (typeof body.clientId !== "string" || body.clientId.trim() === "") return null;
    payload.client_id = body.clientId.trim();
  }
  if ("startAt" in body) {
    if (typeof body.startAt !== "string" || !Number.isFinite(new Date(body.startAt).getTime())) {
      return null;
    }
    payload.start_at = body.startAt;
  }
  if ("endAt" in body) {
    if (typeof body.endAt !== "string") return null;
    const endAt = body.endAt.trim();
    if (endAt.length > 0 && !Number.isFinite(new Date(endAt).getTime())) return null;
    payload.end_at = endAt.length > 0 ? endAt : null;
    if (endAt.length > 0) customPatch.bookingSlotEnd = endAt;
  }
  if ("status" in body) {
    if (typeof body.status !== "string" || !isStatus(body.status.trim())) return null;
    payload.status = body.status.trim();
  }
  if ("paymentStatus" in body) {
    if (
      typeof body.paymentStatus !== "string" ||
      !isPaymentStatus(body.paymentStatus.trim())
    ) {
      return null;
    }
    payload.payment_status = toDbPaymentStatus(
      body.paymentStatus.trim() as PaymentStatus,
    );
  }
  if ("amount" in body) {
    const value = typeof body.amount === "number" ? body.amount : Number(body.amount);
    if (!Number.isFinite(value)) return null;
    payload.amount = Math.max(0, value);
  }
  if ("notes" in body) {
    if (typeof body.notes !== "string") return null;
    customPatch.notes = body.notes.trim();
  }
  if ("customFields" in body) {
    if (!body.customFields || typeof body.customFields !== "object" || Array.isArray(body.customFields)) {
      return null;
    }
    payload.custom_fields = body.customFields;
  }
  if (!("custom_fields" in payload) && Object.keys(customPatch).length > 0) {
    payload.custom_fields = customPatch;
  }

  payload.updated_at = new Date().toISOString();
  return payload;
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ ok: false as const, error: HE_ERR_UNAVAILABLE }, { status: 503 });
  }

  const id = params.id?.trim();
  if (!id) {
    return NextResponse.json({ ok: false as const, error: HE_ERR_INVALID }, { status: 400 });
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ ok: false as const, error: HE_ERR_INVALID }, { status: 400 });
  }
  const payload = parsePatch(raw);
  if (!payload) {
    return NextResponse.json({ ok: false as const, error: HE_ERR_INVALID }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdminClient();
    const businessId = getSupabaseBusinessId();
    const teacherId = resolveTeacherIdFromRequest(req, raw);
    const table = getSupabaseAppointmentsTable();

    let updateRes = await supabase
      .from(table)
      .update(payload)
      .eq("id", id)
      .eq("business_id", businessId)
      .eq("teacher_id", teacherId);
    if (updateRes.error && isMissingColumnError(updateRes.error)) {
      updateRes = await supabase
        .from(table)
        .update(payload)
        .eq("id", id)
        .eq("business_id", businessId);
    }
    const { error } = updateRes;
    if (error) {
      console.error("[appointments/put]", error);
      return NextResponse.json({ ok: false as const, error: HE_ERR_GENERIC }, { status: 500 });
    }

    scheduleGoogleCalendarSync({
      supabase,
      businessId,
      teacherId,
      appointmentId: id,
    });

    return NextResponse.json({ ok: true as const });
  } catch (e) {
    console.error("[appointments/put]", e);
    return NextResponse.json({ ok: false as const, error: HE_ERR_GENERIC }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ ok: false as const, error: HE_ERR_UNAVAILABLE }, { status: 503 });
  }

  const id = params.id?.trim();
  if (!id) {
    return NextResponse.json({ ok: false as const, error: HE_ERR_INVALID }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdminClient();
    const businessId = getSupabaseBusinessId();
    const teacherId = resolveTeacherIdFromRequest(req);
    const table = getSupabaseAppointmentsTable();

    let preloadedEventId: string | null = null;
    const existingRes = await supabase
      .from(table)
      .select("custom_fields")
      .eq("id", id)
      .eq("business_id", businessId)
      .eq("teacher_id", teacherId)
      .maybeSingle();
    if (!existingRes.error && existingRes.data) {
      const cf = (existingRes.data as { custom_fields?: Record<string, unknown> })
        .custom_fields;
      preloadedEventId = cf ? getGoogleEventId(cf) : null;
    } else if (!existingRes.error && !existingRes.data) {
      const fallback = await supabase
        .from(table)
        .select("custom_fields")
        .eq("id", id)
        .eq("business_id", businessId)
        .maybeSingle();
      if (!fallback.error && fallback.data) {
        const cf = (fallback.data as { custom_fields?: Record<string, unknown> })
          .custom_fields;
        preloadedEventId = cf ? getGoogleEventId(cf) : null;
      }
    }

    let deleteRes = await supabase
      .from(table)
      .delete()
      .eq("id", id)
      .eq("business_id", businessId)
      .eq("teacher_id", teacherId);
    if (deleteRes.error && isMissingColumnError(deleteRes.error)) {
      deleteRes = await supabase
        .from(table)
        .delete()
        .eq("id", id)
        .eq("business_id", businessId);
    }
    const { error } = deleteRes;
    if (error) {
      console.error("[appointments/delete]", error);
      return NextResponse.json({ ok: false as const, error: HE_ERR_GENERIC }, { status: 500 });
    }

    scheduleGoogleCalendarSync({
      supabase,
      businessId,
      teacherId,
      appointmentId: id,
      deleteMode: true,
      preloadedEventId,
    });

    return NextResponse.json({ ok: true as const });
  } catch (e) {
    console.error("[appointments/delete]", e);
    return NextResponse.json({ ok: false as const, error: HE_ERR_GENERIC }, { status: 500 });
  }
}
