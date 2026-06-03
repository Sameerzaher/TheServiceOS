import {
  getSupabaseDefaultTeacherId,
  isSupabaseConfigured,
} from "@/core/config/supabaseEnv";
import type { ServiceStorage } from "@/core/types/serviceStorage";

import { businessDataStubStorage } from "./businessDataStubStorage";
import { createSupabaseStorageAdapter } from "./supabase/supabaseStorageAdapter";

/**
 * Business data: Supabase only when configured. No localStorage for domain entities.
 * UI-only keys (onboarding, demo, banners) stay elsewhere under `core/utils/storage` / `STORAGE_KEYS.meta`.
 */
export function createServiceStorage(teacherId?: string): ServiceStorage {
  if (isSupabaseConfigured()) {
    return createSupabaseStorageAdapter(
      teacherId ?? getSupabaseDefaultTeacherId(),
    );
  }
  if (typeof console !== "undefined" && console.warn) {
    console.warn(
      "[ServiceOS] Supabase env missing — business data is not persisted. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }
  return businessDataStubStorage;
}
