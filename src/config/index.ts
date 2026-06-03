export {
  PWA_APP_NAME,
  PWA_BACKGROUND_COLOR,
  PWA_DESCRIPTION,
  PWA_SHORT_NAME,
  PWA_THEME_COLOR,
} from "./pwa";
export { heUi, paymentStatusLabel, PAYMENT_STATUS_LABELS_HE } from "./locale/he";
export {
  resolveVerticalPresetFromSettings,
  resolveVerticalPresetMerged,
} from "./resolveVerticalPreset";
export {
  cosmeticClinicVerticalPreset,
  DEFAULT_VERTICAL_ID,
  VERTICAL_REGISTRY,
  drivingVerticalPreset,
  getVerticalPreset,
  listVerticalIds,
  type VerticalId,
} from "./verticals";
export type { ActivePreset } from "@/core/types/settings";
export type { BusinessType } from "@/core/types/teacher";
export {
  appPageTitle,
  appTagline,
  lessonWords,
  studentWords,
} from "./verticalLabels";
