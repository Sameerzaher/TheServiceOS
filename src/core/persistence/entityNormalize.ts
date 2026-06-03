import { getSupabaseDefaultTeacherId } from "@/core/config/supabaseEnv";
import {
  AppointmentStatus,
  PaymentStatus,
  type AppointmentRecord,
} from "@/core/types/appointment";
import type { Client } from "@/core/types/client";
import {
  coerceBusinessType,
  type Teacher,
} from "@/core/types/teacher";

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

const APPOINTMENT_STATUSES = new Set<string>(
  Object.values(AppointmentStatus),
);
const PAYMENT_STATUSES = new Set<string>(Object.values(PaymentStatus));

function coerceString(v: unknown, fallback = ""): string {
  if (typeof v === "string") return v;
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  if (typeof v === "boolean") return v ? "true" : "false";
  return fallback;
}

/** Produces a stable ISO string for audit / scheduling fields. */
export function coerceIsoInstant(v: unknown, fallback: string): string {
  if (typeof v === "number" && Number.isFinite(v)) {
    const d = new Date(v);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  if (typeof v === "string" && v.trim().length > 0) {
    const t = Date.parse(v);
    if (!Number.isNaN(t)) return new Date(t).toISOString();
  }
  return fallback;
}

function normalizeCustomFields(v: unknown): Record<string, unknown> {
  if (!isRecord(v)) return {};
  return { ...v };
}

function normalizeAppointmentStatus(v: unknown): AppointmentStatus {
  if (typeof v === "string" && APPOINTMENT_STATUSES.has(v)) {
    return v as AppointmentStatus;
  }
  return AppointmentStatus.Scheduled;
}

function normalizePaymentStatus(v: unknown): PaymentStatus {
  if (typeof v === "string" && PAYMENT_STATUSES.has(v)) {
    return v as PaymentStatus;
  }
  return PaymentStatus.Unpaid;
}

function coerceNonNegativeAmount(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) {
    return Math.max(0, v);
  }
  if (typeof v === "string") {
    const n = parseFloat(v.replace(",", ".").trim());
    if (Number.isFinite(n)) return Math.max(0, n);
  }
  return 0;
}

/**
 * Best-effort repair of a partial client row. Returns null only when `id` is unusable.
 */
export function normalizeClient(raw: unknown): Client | null {
  if (!isRecord(raw)) return null;
  const id = typeof raw.id === "string" ? raw.id.trim() : "";
  if (!id) return null;

  const now = new Date().toISOString();
  const teacherRaw =
    typeof raw.teacherId === "string" ? raw.teacherId.trim() : "";
  const teacherId =
    teacherRaw.length > 0 ? teacherRaw : getSupabaseDefaultTeacherId();
  return {
    id,
    teacherId,
    fullName: coerceString(raw.fullName),
    phone: coerceString(raw.phone),
    notes: coerceString(raw.notes),
    customFields: normalizeCustomFields(raw.customFields),
    createdAt: coerceIsoInstant(raw.createdAt, now),
    updatedAt: coerceIsoInstant(raw.updatedAt, now),
  };
}

/**
 * Best-effort repair of a partial teacher row. Returns null when `id` or `slug` is unusable.
 */
export function normalizeTeacher(raw: unknown): Teacher | null {
  if (!isRecord(raw)) return null;
  const id = typeof raw.id === "string" ? raw.id.trim() : "";
  const slug = typeof raw.slug === "string" ? raw.slug.trim() : "";
  const email = typeof raw.email === "string" ? raw.email.trim() : "";
  if (!id || !slug) return null;

  const now = new Date().toISOString();
  return {
    id,
    fullName: coerceString(raw.fullName),
    businessName: coerceString(raw.businessName),
    phone: coerceString(raw.phone),
    slug,
    businessType: coerceBusinessType(raw.businessType),
    createdAt: coerceIsoInstant(raw.createdAt, now),
    email: email || `${slug}@local`,
    role: (raw.role === "admin" || raw.role === "user") ? raw.role : "user",
    isActive: raw.isActive !== false,
    lastLoginAt: typeof raw.lastLoginAt === "string" ? raw.lastLoginAt : null,
  };
}

/**
 * Best-effort repair of a partial appointment row. Returns null when `id` or `clientId` is unusable.
 */
export function normalizeAppointmentRow(raw: unknown): AppointmentRecord | null {
  if (!isRecord(raw)) return null;
  const id = typeof raw.id === "string" ? raw.id.trim() : "";
  const clientId = typeof raw.clientId === "string" ? raw.clientId.trim() : "";
  if (!id || !clientId) return null;

  const now = new Date().toISOString();
  const teacherRaw =
    typeof raw.teacherId === "string" ? raw.teacherId.trim() : "";
  const teacherId =
    teacherRaw.length > 0 ? teacherRaw : getSupabaseDefaultTeacherId();
  return {
    id,
    teacherId,
    clientId,
    startAt: coerceIsoInstant(raw.startAt, now),
    status: normalizeAppointmentStatus(raw.status),
    paymentStatus: normalizePaymentStatus(raw.paymentStatus),
    amount: coerceNonNegativeAmount(raw.amount),
    customFields: normalizeCustomFields(raw.customFields),
    createdAt: coerceIsoInstant(raw.createdAt, now),
    updatedAt: coerceIsoInstant(raw.updatedAt, now),
  };
}

export function parseClientsArray(raw: unknown): Client[] {
  if (!Array.isArray(raw)) return [];
  const out: Client[] = [];
  for (const item of raw) {
    const row = normalizeClient(item);
    if (row) out.push(row);
  }
  return out;
}

export function parseTeachersArray(raw: unknown): Teacher[] {
  if (!Array.isArray(raw)) return [];
  const out: Teacher[] = [];
  for (const item of raw) {
    const row = normalizeTeacher(item);
    if (row) out.push(row);
  }
  return out;
}

/**
 * Parses and repairs appointment rows. When `validClientIds` is set, drops orphans.
 */
export function parseAppointmentsArray(
  raw: unknown,
  validClientIds: ReadonlySet<string> | null,
): AppointmentRecord[] {
  if (!Array.isArray(raw)) return [];
  const out: AppointmentRecord[] = [];
  for (const item of raw) {
    const row = normalizeAppointmentRow(item);
    if (!row) continue;
    if (validClientIds && !validClientIds.has(row.clientId)) continue;
    out.push(row);
  }
  return out;
}
