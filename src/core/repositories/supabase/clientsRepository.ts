import type { SupabaseClient } from "@supabase/supabase-js";

import { getSupabaseClientsTable } from "@/core/config/supabaseEnv";
import type { Client } from "@/core/types/client";
import { clientFromRow, clientToRow, type ClientRow } from "@/core/storage/supabase/mappers";

export async function loadClients(
  supabase: SupabaseClient,
  businessId: string,
  teacherId: string,
): Promise<Client[]> {
  const table = getSupabaseClientsTable();
  const { data, error } = await supabase
    .from(table)
    .select("*")
    .eq("business_id", businessId)
    .eq("teacher_id", teacherId)
    .order("full_name", { ascending: true });

  if (error) {
    console.error("[ServiceOS] loadClients", error);
    throw error;
  }

  const out: Client[] = [];
  for (const row of data ?? []) {
    const c = clientFromRow(row as unknown as ClientRow);
    if (c) out.push(c);
  }
  return out;
}

export async function persistClients(
  supabase: SupabaseClient,
  businessId: string,
  teacherId: string,
  clients: Client[],
): Promise<void> {
  const table = getSupabaseClientsTable();
  const { data: existing, error: selErr } = await supabase
    .from(table)
    .select("id")
    .eq("business_id", businessId)
    .eq("teacher_id", teacherId);

  if (selErr) throw selErr;

  const nextIds = new Set(clients.map((c) => c.id));
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

  if (clients.length === 0) return;

  const rows = clients.map((c) => clientToRow(c, businessId));
  const { error } = await supabase
    .from(table)
    .upsert(rows, { onConflict: "id" });
  if (error) throw error;
}
