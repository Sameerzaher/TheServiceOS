import type { ActivePreset } from "@/core/types/settings";
import type { VerticalPreset } from "@/core/types/vertical";

import { cosmeticClinicVerticalPreset } from "./cosmetic_clinic";
import { drivingVerticalPreset } from "./driving";

/**
 * Register business types here. Keys match `AppSettings.activePreset` and `teachers.business_type`.
 */
export const VERTICAL_REGISTRY = {
  driving_instructor: drivingVerticalPreset,
  cosmetic_clinic: cosmeticClinicVerticalPreset,
} as const satisfies Record<ActivePreset, VerticalPreset>;

export type VerticalId = ActivePreset;

export const DEFAULT_VERTICAL_ID: VerticalId = "driving_instructor";

export function getVerticalPreset(id: VerticalId): VerticalPreset {
  const preset = VERTICAL_REGISTRY[id];
  if (preset) return preset;
  console.warn(
    "[verticals/registry] Unknown vertical id; using default:",
    id,
  );
  return VERTICAL_REGISTRY[DEFAULT_VERTICAL_ID];
}

export function listVerticalIds(): VerticalId[] {
  return Object.keys(VERTICAL_REGISTRY) as VerticalId[];
}
