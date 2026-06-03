/**
 * Public (browser-build) env: `NEXT_PUBLIC_*` is inlined at build time.
 * Safe to import from client components for connectivity checks (no secrets here).
 */
export function getPublicSupabaseUrl(): string | undefined {
  const u = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  return u || undefined;
}

export function getPublicSupabaseAnonKey(): string | undefined {
  const k = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  return k || undefined;
}

export function isPublicSupabaseEnvConfigured(): boolean {
  return Boolean(getPublicSupabaseUrl() && getPublicSupabaseAnonKey());
}

export function getPublicSupabaseEnvStatus(): {
  ok: boolean;
  missing: ("NEXT_PUBLIC_SUPABASE_URL" | "NEXT_PUBLIC_SUPABASE_ANON_KEY")[];
} {
  const missing: (
    | "NEXT_PUBLIC_SUPABASE_URL"
    | "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  )[] = [];
  if (!getPublicSupabaseUrl()) {
    missing.push("NEXT_PUBLIC_SUPABASE_URL");
  }
  if (!getPublicSupabaseAnonKey()) {
    missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  return { ok: missing.length === 0, missing };
}
