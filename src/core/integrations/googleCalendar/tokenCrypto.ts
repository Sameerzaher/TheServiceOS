import "server-only";

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

import {
  getGoogleCalendarClientSecret,
  getGoogleCalendarTokenEncryptionKeyRaw,
} from "./env";

const IV_LEN = 12;
const TAG_LEN = 16;
const KEY_LEN = 32;
const SALT = "serviceos-google-cal-v1";

function deriveKeyFromEnv(): Buffer | null {
  const raw = getGoogleCalendarTokenEncryptionKeyRaw();
  if (!raw) return null;
  if (/^[0-9a-f]{64}$/i.test(raw)) {
    return Buffer.from(raw, "hex");
  }
  if (raw.length >= 32) {
    return scryptSync(raw, SALT, KEY_LEN);
  }
  return null;
}

/** Fallback: derive from client secret so devs can test without extra key — NOT ideal for production. */
function deriveKeyFallback(): Buffer | null {
  const secret = getGoogleCalendarClientSecret();
  if (!secret) return null;
  return scryptSync(secret, SALT + ":fb", KEY_LEN);
}

function getEncryptionKey(): Buffer | null {
  return deriveKeyFromEnv() ?? deriveKeyFallback();
}

/**
 * Encrypts refresh token for DB storage (AES-256-GCM).
 * Returns null if encryption cannot be performed (misconfiguration).
 */
export function encryptRefreshToken(plain: string): string | null {
  const key = getEncryptionKey();
  if (!key || key.length !== KEY_LEN) {
    console.error(
      "[googleCalendar] GOOGLE_CALENDAR_TOKEN_ENCRYPTION_KEY missing or invalid (need 32-byte hex or long passphrase)",
    );
    return null;
  }
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64");
}

export function decryptRefreshToken(encoded: string): string | null {
  const key = getEncryptionKey();
  if (!key || key.length !== KEY_LEN) return null;
  try {
    const buf = Buffer.from(encoded, "base64");
    if (buf.length < IV_LEN + TAG_LEN + 1) return null;
    const iv = buf.subarray(0, IV_LEN);
    const tag = buf.subarray(IV_LEN, IV_LEN + TAG_LEN);
    const data = buf.subarray(IV_LEN + TAG_LEN);
    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    const dec = Buffer.concat([decipher.update(data), decipher.final()]);
    return dec.toString("utf8");
  } catch (e) {
    console.error("[googleCalendar] decrypt failed", e);
    return null;
  }
}
