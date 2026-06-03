import type { AppointmentRecord } from "@/core/types/appointment";
import type { Client } from "@/core/types/client";
import {
  coerceBusinessType,
  DEFAULT_BUSINESS_TYPE,
  type Teacher,
} from "@/core/types/teacher";
import {
  normalizeAppointmentRow,
  normalizeClient,
  normalizeTeacher,
} from "@/core/persistence";

/** Supabase row shape (snake_case columns). */
export type ClientRow = {
  id: string;
  business_id: string;
  teacher_id: string;
  full_name: string;
  phone: string;
  notes: string;
  custom_fields: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type TeacherRow = {
  id: string;
  business_id: string;
  full_name: string;
  business_name: string;
  phone: string;
  slug: string;
  /** Present after migration `007_teacher_business_type.sql`. */
  business_type?: string | null;
  created_at: string;
};

export type AppointmentRow = {
  id: string;
  business_id: string;
  teacher_id: string;
  client_id: string;
  start_at: string;
  /** Present when the database stores an explicit slot end (public booking, etc.). */
  end_at?: string;
  status: string;
  payment_status: string;
  amount: string | number;
  custom_fields: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export function clientToRow(client: Client, businessId: string): ClientRow {
  return {
    id: client.id,
    business_id: businessId,
    teacher_id: client.teacherId,
    full_name: client.fullName,
    phone: client.phone,
    notes: client.notes,
    custom_fields: client.customFields,
    created_at: client.createdAt,
    updated_at: client.updatedAt,
  };
}

export function clientFromRow(row: ClientRow): Client | null {
  return normalizeClient({
    id: row.id,
    teacherId: row.teacher_id,
    fullName: row.full_name,
    phone: row.phone,
    notes: row.notes,
    customFields: row.custom_fields,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

export function teacherToRow(teacher: Teacher, businessId: string): TeacherRow {
  return {
    id: teacher.id,
    business_id: businessId,
    full_name: teacher.fullName,
    business_name: teacher.businessName,
    phone: teacher.phone,
    slug: teacher.slug,
    business_type: teacher.businessType,
    created_at: teacher.createdAt,
  };
}

export function teacherFromRow(row: TeacherRow): Teacher | null {
  const bt =
    row.business_type != null && String(row.business_type).trim() !== ""
      ? coerceBusinessType(row.business_type)
      : DEFAULT_BUSINESS_TYPE;
  return normalizeTeacher({
    id: row.id,
    fullName: row.full_name,
    businessName: row.business_name,
    phone: row.phone,
    slug: row.slug,
    businessType: bt,
    createdAt: row.created_at,
  });
}

function appointmentEndAtIso(row: AppointmentRecord): string {
  const raw = row.customFields?.bookingSlotEnd;
  if (typeof raw === "string" && raw.trim()) {
    const t = new Date(raw.trim()).getTime();
    if (Number.isFinite(t)) return new Date(t).toISOString();
  }
  const startMs = new Date(row.startAt).getTime();
  if (Number.isFinite(startMs)) {
    return new Date(startMs + 45 * 60_000).toISOString();
  }
  return row.startAt;
}

export function appointmentToRow(
  row: AppointmentRecord,
  businessId: string,
): AppointmentRow {
  return {
    id: row.id,
    business_id: businessId,
    teacher_id: row.teacherId,
    client_id: row.clientId,
    start_at: row.startAt,
    end_at: appointmentEndAtIso(row),
    status: row.status,
    payment_status: row.paymentStatus,
    amount: row.amount,
    custom_fields: row.customFields,
    created_at: row.createdAt,
    updated_at: row.updatedAt,
  };
}

export function appointmentFromRow(row: AppointmentRow): AppointmentRecord | null {
  const customFields = { ...row.custom_fields };
  if (typeof row.end_at === "string" && row.end_at.trim()) {
    customFields.bookingSlotEnd = row.end_at.trim();
  }
  return normalizeAppointmentRow({
    id: row.id,
    teacherId: row.teacher_id,
    clientId: row.client_id,
    startAt: row.start_at,
    status: row.status,
    paymentStatus: row.payment_status,
    amount: row.amount,
    customFields,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}
