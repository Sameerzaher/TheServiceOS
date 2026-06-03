/** PostgreSQL / JS "nil" UUID — never use as a real foreign key. */
export const NIL_UUID = "00000000-0000-0000-0000-000000000000";

import { isUuid } from "@/core/config/supabaseEnv";

export function isNilUuid(id: string | null | undefined): boolean {
  if (id == null || typeof id !== "string") return true;
  return id.trim().toLowerCase() === NIL_UUID;
}

/**
 * True when the value is a syntactically valid UUID and not the all-zero nil UUID.
 */
export function isUsableBusinessId(id: string | null | undefined): id is string {
  if (id == null || typeof id !== "string") return false;
  const t = id.trim();
  return isUuid(t) && !isNilUuid(t);
}
