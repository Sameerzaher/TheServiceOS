import "server-only";

/**
 * Google Calendar integration environment.
 *
 * TODO (deployment): Set in production:
 * - GOOGLE_CALENDAR_CLIENT_ID — OAuth 2.0 Web client ID from Google Cloud Console
 * - GOOGLE_CALENDAR_CLIENT_SECRET
 * - GOOGLE_CALENDAR_REDIRECT_URI — e.g. https://yourdomain.com/api/integrations/google-calendar/callback
 * - GOOGLE_CALENDAR_TOKEN_ENCRYPTION_KEY — 32-byte key (hex 64 chars) or any string (derived via scrypt)
 * - GOOGLE_CALENDAR_OAUTH_STATE_SECRET — HMAC secret for signed OAuth state (min 16 chars)
 *
 * Optional:
 * - GOOGLE_CALENDAR_DEFAULT_TIMEZONE — default IANA tz for events (default Asia/Jerusalem)
 * - NEXT_PUBLIC_APP_URL — base URL for “open in ServiceOS” links in event descriptions
 */

export function getGoogleCalendarClientId(): string | null {
  const v = process.env.GOOGLE_CALENDAR_CLIENT_ID?.trim();
  return v && v.length > 0 ? v : null;
}

export function getGoogleCalendarClientSecret(): string | null {
  const v = process.env.GOOGLE_CALENDAR_CLIENT_SECRET?.trim();
  return v && v.length > 0 ? v : null;
}

export function getGoogleCalendarRedirectUri(): string | null {
  const v = process.env.GOOGLE_CALENDAR_REDIRECT_URI?.trim();
  return v && v.length > 0 ? v : null;
}

/** Optional AES key material for token encryption (hex 64 chars or long passphrase). */
export function getGoogleCalendarTokenEncryptionKeyRaw(): string | null {
  const v = process.env.GOOGLE_CALENDAR_TOKEN_ENCRYPTION_KEY?.trim();
  return v && v.length > 0 ? v : null;
}

export function isGoogleCalendarOAuthConfigured(): boolean {
  return (
    getGoogleCalendarClientId() != null &&
    getGoogleCalendarClientSecret() != null &&
    getGoogleCalendarRedirectUri() != null
  );
}

export function getGoogleCalendarDefaultTimezone(): string {
  return (
    process.env.GOOGLE_CALENDAR_DEFAULT_TIMEZONE?.trim() || "Asia/Jerusalem"
  );
}

/** Public base URL for deep links (appointments/clients). */
export function getPublicAppBaseUrl(): string {
  const u = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (u) return u.replace(/\/$/, "");
  const v = process.env.VERCEL_URL?.trim();
  if (v) return `https://${v.replace(/^https?:\/\//, "")}`;
  return "";
}

export function getOAuthStateSecret(): string | null {
  const v = process.env.GOOGLE_CALENDAR_OAUTH_STATE_SECRET?.trim();
  if (v && v.length >= 16) return v;
  const fallback = process.env.GOOGLE_CALENDAR_CLIENT_SECRET?.trim();
  if (fallback && fallback.length >= 16) return fallback;
  return null;
}
