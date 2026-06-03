/**
 * Server-only environment (secrets and privileged config).
 * Never import from Client Components — use `import "server-only"` at the top of every file here.
 *
 * Prefer importing from `@/config/env.server` (barrel). For browser-safe vars use `@/config/env.public`.
 */
import "server-only";

function readTrimmed(name: string): string | undefined {
  const v = process.env[name];
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  return t.length ? t : undefined;
}

/** Supabase project URL (same for anon + service role). */
export function getServerSupabaseUrl(): string | undefined {
  return readTrimmed("NEXT_PUBLIC_SUPABASE_URL");
}

/**
 * Service role key — bypasses RLS. Must never be sent to the browser or logged.
 * Presence alone does not prove admin client is safe to use; routes must still enforce auth.
 */
export function getServerSupabaseServiceRoleKey(): string | undefined {
  return readTrimmed("SUPABASE_SERVICE_ROLE_KEY");
}

export function isSupabaseServiceEnvComplete(): boolean {
  return Boolean(getServerSupabaseUrl() && getServerSupabaseServiceRoleKey());
}

/** Stripe secret API key (server only; never `NEXT_PUBLIC_*`). */
export function getServerStripeSecretKey(): string | undefined {
  return readTrimmed("STRIPE_SECRET_KEY");
}

/** Resend API key (server only). */
export function getServerResendApiKey(): string | undefined {
  return readTrimmed("RESEND_API_KEY");
}

export function getServerResendFromEmail(): string | undefined {
  return readTrimmed("RESEND_FROM_EMAIL");
}

/** OpenAI API key for server-side routes (e.g. reminder copy). */
export function getServerOpenAiApiKey(): string | undefined {
  return readTrimmed("OPENAI_API_KEY");
}
