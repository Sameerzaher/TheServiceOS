import { heUi } from "@/config/locale/he";
import type { VerticalPreset } from "@/core/types/vertical";

export function lessonWords(preset: VerticalPreset): {
  singular: string;
  plural: string;
} {
  return {
    singular: preset.labels.lesson ?? heUi.defaults.lessonSingular,
    plural: preset.labels.lessons ?? heUi.defaults.lessonPlural,
  };
}

export function studentWords(preset: VerticalPreset): {
  singular: string;
  plural: string;
} {
  return {
    singular: preset.labels.student ?? heUi.defaults.studentSingular,
    plural: preset.labels.students ?? heUi.defaults.studentPlural,
  };
}

/** Main hero title from preset (e.g. "ניהול תלמידים"). */
export function appPageTitle(preset: VerticalPreset): string {
  const lead = preset.labels.appTitle ?? "";
  const people = preset.labels.students ?? heUi.defaults.studentPlural;
  return [lead, people].filter(Boolean).join(" ");
}

export function appTagline(preset: VerticalPreset): string {
  return String(preset.labels.appTagline ?? "");
}
