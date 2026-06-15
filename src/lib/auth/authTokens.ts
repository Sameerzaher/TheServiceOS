import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

export type AuthTokenType = "password_reset" | "email_verification";

export type AuthTokenRow = {
  id: string;
  userId: string;
  token: string;
  tokenType: AuthTokenType;
  expiresAt: string;
  usedAt: string | null;
};

function normalizeTokenRow(row: Record<string, unknown>): AuthTokenRow | null {
  const userId = row.user_id ?? row.teacher_id;
  if (!row.id || !row.token || !userId) return null;

  return {
    id: String(row.id),
    userId: String(userId),
    token: String(row.token),
    tokenType: row.token_type as AuthTokenType,
    expiresAt: String(row.expires_at),
    usedAt: row.used_at ? String(row.used_at) : null,
  };
}

function isMissingUserIdColumn(message: string): boolean {
  return message.includes("user_id") || message.includes("PGRST204");
}

/** Inserts an auth token; supports legacy `teacher_id` column until migration 019 runs. */
export async function insertAuthToken(
  supabase: SupabaseClient,
  params: {
    userId: string;
    token: string;
    tokenType: AuthTokenType;
    expiresAt: string;
  },
): Promise<{ ok: boolean; error?: string }> {
  const base = {
    token: params.token,
    token_type: params.tokenType,
    expires_at: params.expiresAt,
  };

  const withUserId = await supabase
    .from("auth_tokens")
    .insert({ ...base, user_id: params.userId });

  if (!withUserId.error) return { ok: true };

  const message = withUserId.error.message ?? "";
  if (isMissingUserIdColumn(message)) {
    const withTeacherId = await supabase
      .from("auth_tokens")
      .insert({ ...base, teacher_id: params.userId });
    if (!withTeacherId.error) return { ok: true };
    return { ok: false, error: withTeacherId.error.message };
  }

  return { ok: false, error: message };
}

export async function findAuthToken(
  supabase: SupabaseClient,
  token: string,
  tokenType: AuthTokenType,
): Promise<AuthTokenRow | null> {
  const { data, error } = await supabase
    .from("auth_tokens")
    .select("*")
    .eq("token", token)
    .eq("token_type", tokenType)
    .maybeSingle();

  if (error || !data) return null;
  return normalizeTokenRow(data as Record<string, unknown>);
}

export async function markAuthTokenUsed(
  supabase: SupabaseClient,
  id: string,
): Promise<void> {
  await supabase
    .from("auth_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("id", id);
}
