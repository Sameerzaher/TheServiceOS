import "server-only";

import { createHmac, timingSafeEqual } from "crypto";

import { getOAuthStateSecret } from "./env";

export type GoogleOAuthStatePayload = {
  teacherId: string;
  businessId: string;
  exp: number;
};

export function signOAuthState(payload: GoogleOAuthStatePayload): string | null {
  const secret = getOAuthStateSecret();
  if (!secret) {
    console.error(
      "[googleCalendar] GOOGLE_CALENDAR_OAUTH_STATE_SECRET (or client secret fallback) required",
    );
    return null;
  }
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const sig = createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifyOAuthState(token: string): GoogleOAuthStatePayload | null {
  const secret = getOAuthStateSecret();
  if (!secret) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  try {
    const expected = createHmac("sha256", secret).update(body).digest("base64url");
    const a = Buffer.from(sig, "utf8");
    const b = Buffer.from(expected, "utf8");
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    const json = Buffer.from(body, "base64url").toString("utf8");
    const parsed = JSON.parse(json) as GoogleOAuthStatePayload;
    if (
      typeof parsed.teacherId !== "string" ||
      typeof parsed.businessId !== "string" ||
      typeof parsed.exp !== "number"
    ) {
      return null;
    }
    if (Date.now() > parsed.exp) return null;
    return parsed;
  } catch {
    return null;
  }
}
