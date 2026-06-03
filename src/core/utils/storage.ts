/**
 * Browser-only helpers around `localStorage` with safe JSON handling.
 * On the server or when `window` is unavailable, reads return `null` and writes return `false`.
 */

export function loadFromStorage<T>(key: string): T | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function saveToStorage(key: string, value: unknown): boolean {
  if (typeof window === "undefined") return false;

  try {
    const payload = JSON.stringify(value);
    window.localStorage.setItem(key, payload);
    return true;
  } catch {
    return false;
  }
}
