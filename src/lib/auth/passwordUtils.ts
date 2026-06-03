import { randomBytes, pbkdf2Sync } from "crypto";

const SALT_LENGTH = 32;
const ITERATIONS = 100000;
const KEY_LENGTH = 64;
const DIGEST = "sha512";

/**
 * Hash a password using PBKDF2
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(SALT_LENGTH).toString("hex");
  const hash = pbkdf2Sync(
    password,
    salt,
    ITERATIONS,
    KEY_LENGTH,
    DIGEST
  ).toString("hex");
  
  return `${salt}:${hash}`;
}

/**
 * Verify a password against a hash
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(":");
  if (!salt || !hash) return false;
  
  const verifyHash = pbkdf2Sync(
    password,
    salt,
    ITERATIONS,
    KEY_LENGTH,
    DIGEST
  ).toString("hex");
  
  return hash === verifyHash;
}

/**
 * Generate a random session token
 */
export function generateSessionToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 */
export function isValidPassword(password: string): {
  valid: boolean;
  error?: string;
} {
  if (password.length < 8) {
    return { valid: false, error: "הסיסמה חייבת להכיל לפחות 8 תווים" };
  }
  
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: "הסיסמה חייבת להכיל לפחות אות קטנה אחת" };
  }
  
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: "הסיסמה חייבת להכיל לפחות אות גדולה אחת" };
  }
  
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: "הסיסמה חייבת להכיל לפחות ספרה אחת" };
  }
  
  return { valid: true };
}
