import type { AppSettings } from "@/core/types/settings";
import type { VerticalPreset } from "@/core/types/vertical";
import type { BusinessType } from "@/core/types/teacher";

import {
  DEFAULT_VERTICAL_ID,
  VERTICAL_REGISTRY,
  getVerticalPreset,
  type VerticalId,
} from "./verticals/registry";

/**
 * Resolves the active `VerticalPreset` from persisted settings.
 * Defaults to driving instructor when missing or invalid.
 */
export function resolveVerticalPresetFromSettings(
  settings: AppSettings,
): VerticalPreset {
  const raw = settings.activePreset;
  if (raw && raw in VERTICAL_REGISTRY) {
    return getVerticalPreset(raw as VerticalId);
  }
  return getVerticalPreset(DEFAULT_VERTICAL_ID);
}

/**
 * Settings.activePreset is the primary source of truth (user's explicit choice).
 * Teacher.businessType is used only as fallback when settings are not initialized.
 */
export function resolveVerticalPresetMerged(
  settings: AppSettings,
  teacherBusinessType: BusinessType | null | undefined,
): VerticalPreset {
  // ALWAYS prefer settings.activePreset over teacherBusinessType
  const raw =
    settings.activePreset && settings.activePreset in VERTICAL_REGISTRY
      ? settings.activePreset
      : teacherBusinessType && teacherBusinessType in VERTICAL_REGISTRY
        ? teacherBusinessType
        : null;
  if (raw && raw in VERTICAL_REGISTRY) {
    return getVerticalPreset(raw as VerticalId);
  }
  return getVerticalPreset(DEFAULT_VERTICAL_ID);
}
