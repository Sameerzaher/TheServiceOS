import type { SupabaseClient } from "@supabase/supabase-js";

import { isMissingRelationError } from "@/core/repositories/supabase/postgrestErrors";

/**
 * Ensures a row exists in `public.businesses` for the given id (upsert by id).
 * Required before inserting teachers that reference `business_id`.
 */
export async function upsertBusinessRecord(
  supabase: SupabaseClient,
  businessId: string,
  displayName: string,
): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await supabase.from("businesses").upsert(
    {
      id: businessId,
      name: displayName.trim() || "Business",
      updated_at: now,
    },
    { onConflict: "id" },
  );
  if (!error) return;
  if (isMissingRelationError(error)) {
    console.error(
      "[businessRepository] public.businesses missing — apply migration 012_businesses.sql",
      error,
    );
  }
  throw error;
}
