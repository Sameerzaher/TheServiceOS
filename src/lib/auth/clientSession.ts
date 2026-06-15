import "server-only";

import type { NextRequest } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/adminClient";

export type ClientSessionResult =
  | { ok: true; clientId: string }
  | { ok: false; status: number; error: string };

/** Validates `client_session` cookie against `client_sessions`. */
export async function validateClientSession(
  request: NextRequest,
): Promise<ClientSessionResult> {
  const sessionToken = request.cookies.get("client_session")?.value;
  if (!sessionToken) {
    return { ok: false, status: 401, error: "לא מחובר" };
  }

  const supabase = getSupabaseAdminClient();
  const { data: session } = await supabase
    .from("client_sessions")
    .select("client_id, expires_at")
    .eq("token", sessionToken)
    .maybeSingle();

  if (!session || new Date(session.expires_at) < new Date()) {
    return { ok: false, status: 401, error: "סשן לא תקין" };
  }

  return { ok: true, clientId: session.client_id };
}
