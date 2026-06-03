import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

import {
  getSupabaseAppointmentsTable,
  getSupabaseBusinessId,
  getSupabaseClientsTable,
} from "@/core/config/supabaseEnv";
import { isMissingColumnError } from "@/core/repositories/supabase/postgrestErrors";
import {
  appointmentFromRow,
  type AppointmentRow,
} from "@/core/storage/supabase/mappers";
import type { AppointmentRecord } from "@/core/types/appointment";
import { AppointmentStatus, PaymentStatus } from "@/core/types/appointment";
import { resolveTeacherIdFromRequest } from "@/lib/api/resolveTeacherId";
import { scheduleGoogleCalendarSync } from "@/core/integrations/googleCalendar/syncAppointmentToGoogleCalendar";
import {
  getSupabaseAdminClient,
  isSupabaseAdminConfigured,
} from "@/lib/supabase/adminClient";

export const runtime = "nodejs";

const HE_ERR_UNAVAILABLE = "שמירת שיעורים אינה זמינה כרגע. נסו שוב מאוחר יותר.";
const HE_ERR_INVALID = "בקשה לא תקינה.";
const HE_ERR_GENERIC = "אירעה תקלה בשמירת השיעור. נסו שוב.";

type CreateBody = {
  id?: unknown;
  clientId?: unknown;
  startAt?: unknown;
  endAt?: unknown;
  status?: unknown;
  paymentStatus?: unknown;
  amount?: unknown;
  notes?: unknown;
  customFields?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
  clientName?: unknown;
  phone?: unknown;
  date?: unknown;
  time?: unknown;
  sourceBookingId?: unknown;
};

function isStatus(value: string): value is AppointmentStatus {
  return (Object.values(AppointmentStatus) as string[]).includes(value);
}

function isPaymentStatus(value: string): value is PaymentStatus {
  return (Object.values(PaymentStatus) as string[]).includes(value);
}

function toDbPaymentStatus(value: PaymentStatus): PaymentStatus {
  // Legacy schemas may only allow `unpaid|paid|partial|refunded|waived`.
  return value === PaymentStatus.Pending ? PaymentStatus.Unpaid : value;
}

function parseCreateBody(raw: unknown): Omit<
  AppointmentRecord,
  "id" | "createdAt" | "updatedAt" | "teacherId"
> & {
  id?: string;
  createdAt?: string;
  updatedAt?: string;
  endAt?: string;
  notes?: string;
} | null {
  if (!raw || typeof raw !== "object") return null;
  const body = raw as CreateBody;

  const clientId =
    typeof body.clientId === "string" ? body.clientId.trim() : "";
  const startAtRaw =
    typeof body.startAt === "string" ? body.startAt.trim() : "";
  const date = typeof body.date === "string" ? body.date.trim() : "";
  const time = typeof body.time === "string" ? body.time.trim() : "";
  let startAt = startAtRaw;
  if (!startAt && date && time) {
    const parsed = new Date(`${date}T${time}:00`);
    if (Number.isFinite(parsed.getTime())) {
      startAt = parsed.toISOString();
    }
  }
  if (!startAt) return null;
  if (!Number.isFinite(new Date(startAt).getTime())) return null;

  const statusRaw = typeof body.status === "string" ? body.status.trim() : "";
  const status = isStatus(statusRaw) ? statusRaw : AppointmentStatus.Scheduled;

  const paymentRaw =
    typeof body.paymentStatus === "string" ? body.paymentStatus.trim() : "";
  const paymentStatusRaw = isPaymentStatus(paymentRaw)
    ? paymentRaw
    : PaymentStatus.Pending;
  const paymentStatus = toDbPaymentStatus(paymentStatusRaw);

  const amountRaw =
    typeof body.amount === "number" ? body.amount : Number(body.amount ?? 0);
  const amount = Number.isFinite(amountRaw) ? Math.max(0, amountRaw) : 0;

  const baseCustom =
    body.customFields && typeof body.customFields === "object" && !Array.isArray(body.customFields)
      ? ({ ...(body.customFields as Record<string, unknown>) } as Record<string, unknown>)
      : {};

  const endAt = typeof body.endAt === "string" ? body.endAt.trim() : "";
  if (endAt && Number.isFinite(new Date(endAt).getTime())) {
    baseCustom.bookingSlotEnd = endAt;
  }
  const notes = typeof body.notes === "string" ? body.notes.trim() : "";
  if (notes) {
    baseCustom.notes = notes;
  }
  const sourceBookingId =
    typeof body.sourceBookingId === "string" ? body.sourceBookingId.trim() : "";
  if (sourceBookingId) {
    baseCustom.sourceBookingId = sourceBookingId;
  }

  return {
    id: typeof body.id === "string" ? body.id.trim() : undefined,
    createdAt: typeof body.createdAt === "string" ? body.createdAt : undefined,
    updatedAt: typeof body.updatedAt === "string" ? body.updatedAt : undefined,
    endAt: endAt || undefined,
    notes: notes || undefined,
    clientId,
    startAt,
    status,
    paymentStatus,
    amount,
    customFields: baseCustom,
  };
}

function toApiAppointment(
  row: AppointmentRecord,
  client?: { fullName: string; phone: string },
) {
  const endRaw = row.customFields?.bookingSlotEnd;
  const endAt = typeof endRaw === "string" && endRaw.trim() ? endRaw.trim() : "";
  const dateObj = new Date(row.startAt);
  const date = Number.isFinite(dateObj.getTime())
    ? new Intl.DateTimeFormat("en-CA", { timeZone: "UTC" }).format(dateObj)
    : "";
  const startTime = Number.isFinite(dateObj.getTime())
    ? new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "UTC",
      }).format(dateObj)
    : "";
  const endObj = endAt ? new Date(endAt) : null;
  const endTime =
    endObj && Number.isFinite(endObj.getTime())
      ? new Intl.DateTimeFormat("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
          timeZone: "UTC",
        }).format(endObj)
      : "";

  const notesRaw = row.customFields?.notes;
  const notes = typeof notesRaw === "string" ? notesRaw : "";
  const sourceBookingIdRaw = row.customFields?.sourceBookingId;
  const sourceBookingId =
    typeof sourceBookingIdRaw === "string" ? sourceBookingIdRaw : "";
  const snapNameRaw = row.customFields?.clientName;
  const snapPhoneRaw = row.customFields?.clientPhone;
  const nameFromSnap =
    typeof snapNameRaw === "string" ? snapNameRaw.trim() : "";
  const phoneFromSnap =
    typeof snapPhoneRaw === "string" ? snapPhoneRaw.trim() : "";

  const clientNameResolved =
    nameFromSnap || client?.fullName || "ללא שם";

  return {
    id: row.id,
    teacherId: row.teacherId,
    clientName: clientNameResolved,
    client: { name: clientNameResolved },
    entry: row.customFields?.entry ?? null,
    phone: phoneFromSnap || client?.phone || "",
    time: startTime,
    studentId: row.clientId,
    date,
    startTime,
    endTime,
    status: row.status,
    notes,
    sourceBookingId,
    clientId: row.clientId,
    startAt: row.startAt,
    endAt,
    paymentStatus: row.paymentStatus,
    amount: row.amount,
    customFields: row.customFields,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function ensureAppointmentEndAt(startAt: string, maybeEndAt: unknown): string {
  if (typeof maybeEndAt === "string" && maybeEndAt.trim().length > 0) {
    return maybeEndAt.trim();
  }
  const startMs = new Date(startAt).getTime();
  if (Number.isFinite(startMs)) {
    return new Date(startMs + 40 * 60 * 1000).toISOString();
  }
  return startAt;
}

export async function GET(req: Request): Promise<NextResponse> {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ ok: false as const, error: HE_ERR_UNAVAILABLE }, { status: 503 });
  }

  try {
    const supabase = getSupabaseAdminClient();
    const businessId = getSupabaseBusinessId();
    const teacherId = resolveTeacherIdFromRequest(req);
    
    console.log("[appointments/get] Fetching appointments for:", { businessId, teacherId });
    
    const table = getSupabaseAppointmentsTable();
    const clientsTable = getSupabaseClientsTable();
    let apptList = await supabase
      .from(table)
      .select("*")
      .eq("business_id", businessId)
      .eq("teacher_id", teacherId)
      .order("start_at", { ascending: true });
    if (apptList.error && isMissingColumnError(apptList.error)) {
      console.log("[appointments/get] teacher_id column missing, falling back");
      apptList = await supabase
        .from(table)
        .select("*")
        .eq("business_id", businessId)
        .order("start_at", { ascending: true });
    }
    const { data, error } = apptList;

    if (error) {
      console.error("[appointments/get] Database error:", error);
      return NextResponse.json({ ok: false as const, error: HE_ERR_GENERIC }, { status: 500 });
    }

    const appointments: ReturnType<typeof toApiAppointment>[] = [];
    let clientsList = await supabase
      .from(clientsTable)
      .select("id, full_name, phone")
      .eq("business_id", businessId)
      .eq("teacher_id", teacherId);
    if (clientsList.error && isMissingColumnError(clientsList.error)) {
      clientsList = await supabase
        .from(clientsTable)
        .select("id, full_name, phone")
        .eq("business_id", businessId);
    }
    const { data: clientRows, error: clientsErr } = clientsList;
    if (clientsErr) {
      console.error("[appointments/get clients]", clientsErr);
      return NextResponse.json({ ok: false as const, error: HE_ERR_GENERIC }, { status: 500 });
    }
    const clientMap = new Map<string, { fullName: string; phone: string }>();
    for (const row of clientRows ?? []) {
      const r = row as { id?: string; full_name?: string; phone?: string };
      if (!r.id) continue;
      clientMap.set(r.id, {
        fullName: typeof r.full_name === "string" ? r.full_name : "",
        phone: typeof r.phone === "string" ? r.phone : "",
      });
    }
    for (const row of data ?? []) {
      const parsed = appointmentFromRow(row as unknown as AppointmentRow);
      if (parsed) {
        appointments.push(toApiAppointment(parsed, clientMap.get(parsed.clientId)));
      }
    }
    return NextResponse.json({ ok: true as const, appointments });
  } catch (e) {
    console.error("[appointments/get]", e);
    return NextResponse.json({ ok: false as const, error: HE_ERR_GENERIC }, { status: 500 });
  }
}

export async function POST(req: Request): Promise<NextResponse> {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ ok: false as const, error: HE_ERR_UNAVAILABLE }, { status: 503 });
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ ok: false as const, error: HE_ERR_INVALID }, { status: 400 });
  }

  const parsed = parseCreateBody(raw);
  if (!parsed) {
    return NextResponse.json({ ok: false as const, error: HE_ERR_INVALID }, { status: 400 });
  }

  const now = new Date().toISOString();
  const id = parsed.id && parsed.id.length > 0 ? parsed.id : randomUUID();
  const createdAt = parsed.createdAt ?? now;
  const updatedAt = parsed.updatedAt ?? now;
  const endAtRaw = parsed.customFields.bookingSlotEnd;
  const endAt = ensureAppointmentEndAt(parsed.startAt, endAtRaw);

  try {
    const supabase = getSupabaseAdminClient();
    const businessId = getSupabaseBusinessId();
    const teacherId = resolveTeacherIdFromRequest(req, raw);
    const table = getSupabaseAppointmentsTable();
    const clientsTable = getSupabaseClientsTable();
    const body = raw as CreateBody;

    let clientId = parsed.clientId;
    
    // If clientId is provided, verify it belongs to this teacher
    if (clientId) {
      let verifyRes = await supabase
        .from(clientsTable)
        .select("id")
        .eq("business_id", businessId)
        .eq("teacher_id", teacherId)
        .eq("id", clientId)
        .maybeSingle();
      if (verifyRes.error && isMissingColumnError(verifyRes.error)) {
        verifyRes = await supabase
          .from(clientsTable)
          .select("id")
          .eq("business_id", businessId)
          .eq("id", clientId)
          .maybeSingle();
      }
      if (verifyRes.error) throw verifyRes.error;
      if (!verifyRes.data) {
        // Client doesn't exist or doesn't belong to this teacher
        return NextResponse.json({ 
          ok: false as const, 
          error: "הלקוח שנבחר לא נמצא. נסו לרענן את הדף." 
        }, { status: 400 });
      }
    }
    
    if (!clientId) {
      const clientName =
        typeof body.clientName === "string" ? body.clientName.trim() : "";
      const phone = typeof body.phone === "string" ? body.phone.trim() : "";
      if (!clientName || !phone) {
        return NextResponse.json({ ok: false as const, error: HE_ERR_INVALID }, { status: 400 });
      }
      let existingClientsRes = await supabase
        .from(clientsTable)
        .select("id, phone")
        .eq("business_id", businessId)
        .eq("teacher_id", teacherId);
      if (existingClientsRes.error && isMissingColumnError(existingClientsRes.error)) {
        existingClientsRes = await supabase
          .from(clientsTable)
          .select("id, phone")
          .eq("business_id", businessId);
      }
      const { data: existingClientRows, error: existingClientErr } = existingClientsRes;
      if (existingClientErr) throw existingClientErr;
      const normalized = phone.replace(/\D+/g, "");
      for (const row of existingClientRows ?? []) {
        const r = row as { id?: string; phone?: string };
        const candidate = (typeof r.phone === "string" ? r.phone : "").replace(/\D+/g, "");
        if (normalized.length > 0 && normalized === candidate && r.id) {
          clientId = r.id;
          break;
        }
      }
      if (!clientId) {
        clientId = randomUUID();
        const baseClient = {
          id: clientId,
          business_id: businessId,
          full_name: clientName,
          phone,
          notes: "",
          custom_fields: {},
          created_at: now,
          updated_at: now,
        };
        let insertClientRes = await supabase.from(clientsTable).insert({
          ...baseClient,
          teacher_id: teacherId,
        });
        if (insertClientRes.error && isMissingColumnError(insertClientRes.error)) {
          insertClientRes = await supabase.from(clientsTable).insert(baseClient);
        }
        if (insertClientRes.error) throw insertClientRes.error;
      }
    }

    const insertEndAt = ensureAppointmentEndAt(parsed.startAt, endAt);
    const baseAppt = {
      id,
      business_id: businessId,
      client_id: clientId,
      start_at: parsed.startAt,
      end_at: insertEndAt,
      status: parsed.status,
      payment_status: parsed.paymentStatus,
      amount: parsed.amount,
      custom_fields: parsed.customFields,
      created_at: createdAt,
      updated_at: updatedAt,
    };
    let insertRes = await supabase.from(table).insert({
      ...baseAppt,
      teacher_id: teacherId,
    });
    if (insertRes.error && isMissingColumnError(insertRes.error)) {
      insertRes = await supabase.from(table).insert(baseAppt);
    }
    if (insertRes.error) {
      console.error("[appointments/post]", insertRes.error);
      return NextResponse.json({ ok: false as const, error: HE_ERR_GENERIC }, { status: 500 });
    }

    scheduleGoogleCalendarSync({
      supabase,
      businessId,
      teacherId,
      appointmentId: id,
    });

    const row: AppointmentRecord = {
      id,
      teacherId,
      clientId,
      startAt: parsed.startAt,
      status: parsed.status,
      paymentStatus: parsed.paymentStatus,
      amount: parsed.amount,
      customFields: parsed.customFields,
      createdAt,
      updatedAt,
    };
    return NextResponse.json({ ok: true as const, appointment: toApiAppointment(row) });
  } catch (e) {
    console.error("[appointments/post]", e);
    return NextResponse.json({ ok: false as const, error: HE_ERR_GENERIC }, { status: 500 });
  }
}
