/**
 * Browser-only ID generation using `crypto.randomUUID()`.
 * Returns `null` on the server or when the API is missing.
 */

export function createId(): string | null {
  if (typeof window === "undefined") return null;

  const uuid = window.crypto?.randomUUID?.();
  return uuid ?? null;
}
