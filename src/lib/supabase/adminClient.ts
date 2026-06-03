import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import {
  getServerSupabaseServiceRoleKey,
  getServerSupabaseUrl,
  isSupabaseServiceEnvComplete,
} from "@/config/env.server";

/**
 * Server-only service-role client. Build will fail if this file is imported from a Client Component.
 * Never log the service role key or return it from an API response.
 * Keys are read via `@/config/env.server`.
 */
export function getSupabaseUrl(): string | null {
  return getServerSupabaseUrl() ?? null;
}

export function getSupabaseServiceRoleKey(): string | null {
  return getServerSupabaseServiceRoleKey() ?? null;
}

export function isSupabaseAdminConfigured(): boolean {
  return isSupabaseServiceEnvComplete();
}

let adminClient: SupabaseClient | null = null;

/** Service-role Supabase client — use **only** in API routes / Server Actions after auth checks. */
export function createSupabaseAdminClient(): SupabaseClient {
  const url = getSupabaseUrl();
  const key = getSupabaseServiceRoleKey();
  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (server only)",
    );
  }
  if (!adminClient) {
    adminClient = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return adminClient;
}

/** @deprecated Use `createSupabaseAdminClient` for clarity at call sites. */
export const getSupabaseAdminClient = createSupabaseAdminClient;
