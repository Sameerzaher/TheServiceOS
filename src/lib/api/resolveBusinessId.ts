import type { SupabaseClient } from "@supabase/supabase-js";

import { getSupabaseBusinessId } from "@/core/config/supabaseEnv";

/**
 * Resolves the tenant `business_id` for a teacher row. Falls back to
 * {@link getSupabaseBusinessId} when missing or on query error (single-tenant / legacy).
 */
export async function resolveBusinessIdForTeacher(
  supabase: SupabaseClient,
  teacherId: string,
  logContext?: string,
): Promise<string> {
  const tid = typeof teacherId === "string" ? teacherId.trim() : "";
  if (!tid) {
    console.warn("[resolveBusinessIdForTeacher] empty teacherId", logContext ?? "");
    return getSupabaseBusinessId();
  }

  const { data, error } = await supabase
    .from("teachers")
    .select("business_id")
    .eq("id", tid)
    .maybeSingle();

  if (error) {
    console.error(
      "[resolveBusinessIdForTeacher] query failed",
      logContext ?? "",
      error,
    );
    return getSupabaseBusinessId();
  }

  const bid =
    data && typeof data === "object"
      ? (data as { business_id?: string | null }).business_id
      : null;
  if (typeof bid === "string" && bid.trim().length > 0) {
    return bid.trim();
  }

  console.warn(
    "[resolveBusinessIdForTeacher] missing business_id on teacher; using env default",
    logContext ?? "",
    { teacherId: tid },
  );
  return getSupabaseBusinessId();
}
