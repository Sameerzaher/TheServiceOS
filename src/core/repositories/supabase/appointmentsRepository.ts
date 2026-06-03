import type { SupabaseClient } from "@supabase/supabase-js";

import { getSupabaseAppointmentsTable } from "@/core/config/supabaseEnv";
import type { AppointmentRecord } from "@/core/types/appointment";
import {
  appointmentFromRow,
  appointmentToRow,
  type AppointmentRow,
} from "@/core/storage/supabase/mappers";

export async function loadAppointments(
  supabase: SupabaseClient,
  businessId: string,
  teacherId: string,
): Promise<AppointmentRecord[]> {
  const table = getSupabaseAppointmentsTable();
  const { data, error } = await supabase
    .from(table)
    .select("*")
    .eq("business_id", businessId)
    .eq("teacher_id", teacherId)
    .order("start_at", { ascending: true });

  if (error) {
    console.error("[ServiceOS] loadAppointments", error);
    throw error;
  }

  const out: AppointmentRecord[] = [];
  for (const row of data ?? []) {
    const a = appointmentFromRow(row as unknown as AppointmentRow);
    if (a) out.push(a);
  }
  return out;
}

export async function persistAppointments(
  supabase: SupabaseClient,
  businessId: string,
  teacherId: string,
  appointments: AppointmentRecord[],
): Promise<void> {
  const table = getSupabaseAppointmentsTable();
  const { data: existing, error: selErr } = await supabase
    .from(table)
    .select("id")
    .eq("business_id", businessId)
    .eq("teacher_id", teacherId);

  if (selErr) throw selErr;

  const nextIds = new Set(appointments.map((a) => a.id));
  const toRemove = (existing ?? [])
    .map((r: { id: string }) => r.id)
    .filter((id) => !nextIds.has(id));

  if (toRemove.length) {
    const { error: delErr } = await supabase
      .from(table)
      .delete()
      .eq("business_id", businessId)
      .eq("teacher_id", teacherId)
      .in("id", toRemove);
    if (delErr) throw delErr;
  }

  if (appointments.length === 0) return;

  const rows = appointments.map((a) => appointmentToRow(a, businessId));
  const { error } = await supabase
    .from(table)
    .upsert(rows, { onConflict: "id" });
  if (error) throw error;
}
