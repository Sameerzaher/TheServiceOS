import type { SupabaseClient } from "@supabase/supabase-js";

import {
  isMissingColumnError,
  isMissingRelationError,
} from "@/core/repositories/supabase/postgrestErrors";
import {
  DEFAULT_APP_SETTINGS,
  normalizeAppSettings,
  type AppSettings,
} from "@/core/types/settings";

const SETTINGS_TABLES = ["serviceos_app_settings", "app_settings"] as const;
const SETTINGS_COLUMNS = ["payload", "settings", "value", "data"] as const;
type SettingsTable = (typeof SETTINGS_TABLES)[number];
type SettingsColumn = (typeof SETTINGS_COLUMNS)[number];
type SettingsSource = { table: SettingsTable; column: SettingsColumn };

let preferredSettingsSource: SettingsSource | null = null;
let probingDisabled = false;

function listSettingsSources(): SettingsSource[] {
  const sources: SettingsSource[] = [];
  if (preferredSettingsSource) {
    sources.push(preferredSettingsSource);
  }
  for (const table of SETTINGS_TABLES) {
    for (const column of SETTINGS_COLUMNS) {
      const exists =
        preferredSettingsSource &&
        preferredSettingsSource.table === table &&
        preferredSettingsSource.column === column;
      if (!exists) sources.push({ table, column });
    }
  }
  return sources;
}

/** App preferences (`serviceos_app_settings.payload` ↔ `AppSettings`). */
export async function loadAppSettings(
  supabase: SupabaseClient,
  businessId: string,
  teacherId: string,
): Promise<AppSettings> {
  if (probingDisabled) {
    return DEFAULT_APP_SETTINGS;
  }

  for (const source of listSettingsSources()) {
    const { table: tableName, column: columnName } = source;
      const { data, error } = await supabase
        .from(tableName)
        .select(columnName)
        .eq("business_id", businessId)
        .eq("teacher_id", teacherId)
        .maybeSingle();

      if (!error) {
        preferredSettingsSource = source;
        const payload =
          data && typeof data === "object" ? (data as Record<string, unknown>)[columnName] : null;
        return normalizeAppSettings(payload ?? null);
      }

      if (isMissingColumnError(error)) {
        continue;
      }
      if (!isMissingRelationError(error)) {
        console.error("[ServiceOS] loadAppSettings", error);
        throw error;
      }
  }

  // If none of the legacy/canonical sources exist, stop probing this session.
  probingDisabled = true;
  return DEFAULT_APP_SETTINGS;
}

/**
 * Same as {@link loadAppSettings} but never throws — uses {@link DEFAULT_APP_SETTINGS}
 * when scope is empty, tables are missing, or PostgREST errors occur.
 */
export async function loadAppSettingsOrDefault(
  supabase: SupabaseClient,
  businessId: string,
  teacherId: string,
  logContext?: string,
): Promise<AppSettings> {
  const bid = typeof businessId === "string" ? businessId.trim() : "";
  const tid = typeof teacherId === "string" ? teacherId.trim() : "";
  if (!bid || !tid) {
    console.warn(
      "[ServiceOS] loadAppSettingsOrDefault: missing scope",
      logContext ?? "",
      { businessId: bid, teacherId: tid },
    );
    return { ...DEFAULT_APP_SETTINGS, teacherId: tid || DEFAULT_APP_SETTINGS.teacherId };
  }
  try {
    return await loadAppSettings(supabase, bid, tid);
  } catch (e) {
    console.error(
      "[ServiceOS] loadAppSettingsOrDefault failed; using defaults",
      logContext ?? "",
      e,
    );
    return { ...DEFAULT_APP_SETTINGS, teacherId: tid };
  }
}

export async function persistAppSettings(
  supabase: SupabaseClient,
  businessId: string,
  teacherId: string,
  settings: AppSettings,
): Promise<void> {
  if (probingDisabled) {
    return;
  }

  let lastMissingTableError: unknown = null;
  let lastMissingColumnError: unknown = null;

  for (const source of listSettingsSources()) {
    const { table: tableName, column: columnName } = source;
      const payload: Record<string, unknown> = {
        business_id: businessId,
        teacher_id: teacherId,
        [columnName]: settings,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase
        .from(tableName)
        .upsert(payload, { onConflict: "business_id,teacher_id" });
      if (!error) {
        preferredSettingsSource = source;
        return;
      }

      if (isMissingColumnError(error)) {
        lastMissingColumnError = error;
        continue;
      }
      if (!isMissingRelationError(error)) {
        throw error;
      }
      lastMissingTableError = error;
  }

  if (lastMissingTableError || lastMissingColumnError) {
    // Avoid repeated noisy probes/logs during this app session.
    probingDisabled = true;
    console.warn(
      "[ServiceOS] persistAppSettings skipped (settings table/column missing).",
      lastMissingTableError ?? lastMissingColumnError,
    );
  }
}
