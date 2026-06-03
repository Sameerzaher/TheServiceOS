import { isPublicSupabaseEnvConfigured } from "@/config/env.public";

/**
 * MVP: single tenant per deployment via fixed business UUID.
 * Must match RLS policies in `supabase/migrations/001_serviceos_core.sql` (or update both).
 */
export const DEFAULT_MVP_BUSINESS_ID =
  "00000000-0000-0000-0000-000000000001";

/**
 * Default teacher scope for existing rows and single-teacher deployments.
 * Override with `NEXT_PUBLIC_DEFAULT_TEACHER_ID` (UUID). Align with `005_multitenant_teacher_scope.sql`.
 */
export const DEFAULT_MVP_TEACHER_ID =
  "00000000-0000-0000-0000-000000000002";

export function isUuid(v: string): boolean {
  // Accept both strict UUID v4 and simplified UUIDs (for testing/dev)
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}

export function getSupabaseBusinessId(): string {
  const v = process.env.NEXT_PUBLIC_BUSINESS_ID?.trim();
  if (v && isUuid(v)) return v;
  return DEFAULT_MVP_BUSINESS_ID;
}

export function getSupabaseDefaultTeacherId(): string {
  const v = process.env.NEXT_PUBLIC_DEFAULT_TEACHER_ID?.trim();
  if (v && isUuid(v)) return v;
  return DEFAULT_MVP_TEACHER_ID;
}

export function isSupabaseConfigured(): boolean {
  return isPublicSupabaseEnvConfigured();
}

/**
 * PostgREST table for appointments (`business_id`, `start_at`, etc.).
 * Default `appointments` matches common Supabase schemas; if you use the legacy
 * name from an older migration, set `NEXT_PUBLIC_SUPABASE_APPOINTMENTS_TABLE=serviceos_appointments`.
 */
export function getSupabaseAppointmentsTable(): string {
  const v = process.env.NEXT_PUBLIC_SUPABASE_APPOINTMENTS_TABLE?.trim();
  if (v) return v;
  return "appointments";
}

/**
 * Client directory table (`business_id`, `full_name`, `phone`, …).
 * Default `clients`; legacy: `NEXT_PUBLIC_SUPABASE_CLIENTS_TABLE=serviceos_clients`.
 */
export function getSupabaseClientsTable(): string {
  const v = process.env.NEXT_PUBLIC_SUPABASE_CLIENTS_TABLE?.trim();
  if (v) return v;
  return "clients";
}
