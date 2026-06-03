import { loadFromStorage, saveToStorage } from "@/core/utils/storage";

import { STORAGE_KEYS } from "./keys";

/**
 * Bump when local-only bootstrap semantics change.
 * v2: drop legacy domain blobs from localStorage (business data is Supabase-only).
 */
export const STORAGE_SCHEMA_VERSION = 2;

export type StorageBootstrapResult =
  | { ok: true; migratedFrom: number }
  | { ok: false; reason: "unknown_schema_version"; version: number };

let lastBootstrapResult: StorageBootstrapResult | null = null;
let bootstrapDone = false;

export function getLastStorageBootstrapResult(): StorageBootstrapResult | null {
  return lastBootstrapResult;
}

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

function readMetaVersion(): number {
  const raw = loadFromStorage<unknown>(STORAGE_KEYS.meta);
  if (!isRecord(raw)) return 0;
  const v = raw.schemaVersion;
  if (typeof v !== "number" || !Number.isFinite(v)) return 0;
  return Math.trunc(v);
}

function writeMetaVersion(version: number): void {
  saveToStorage(STORAGE_KEYS.meta, { schemaVersion: version });
}

/** Remove obsolete domain keys (migrated to Supabase). */
function clearLegacyDomainKeys(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEYS.clients);
    window.localStorage.removeItem(STORAGE_KEYS.appointments);
    window.localStorage.removeItem(STORAGE_KEYS.settings);
    window.localStorage.removeItem(STORAGE_KEYS.availability);
  } catch {
    /* ignore */
  }
}

function runStorageBootstrap(): StorageBootstrapResult {
  const v = readMetaVersion();

  if (v > STORAGE_SCHEMA_VERSION || v < 0) {
    clearLegacyDomainKeys();
    writeMetaVersion(STORAGE_SCHEMA_VERSION);
    return { ok: false, reason: "unknown_schema_version", version: v };
  }

  if (v < STORAGE_SCHEMA_VERSION) {
    clearLegacyDomainKeys();
    writeMetaVersion(STORAGE_SCHEMA_VERSION);
    return { ok: true, migratedFrom: v };
  }

  return { ok: true, migratedFrom: v };
}

/**
 * Runs once per tab: schema meta + one-time cleanup of legacy domain localStorage keys.
 */
export function ensureStorageBootstrap(): void {
  if (typeof window === "undefined") return;
  if (bootstrapDone) return;
  bootstrapDone = true;
  try {
    lastBootstrapResult = runStorageBootstrap();
  } catch {
    clearLegacyDomainKeys();
    writeMetaVersion(STORAGE_SCHEMA_VERSION);
    lastBootstrapResult = {
      ok: false,
      reason: "unknown_schema_version",
      version: -1,
    };
  }
}
