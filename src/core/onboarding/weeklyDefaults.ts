import type {
  WeeklyAvailability,
  WeekdayKey,
} from "@/core/types/availability";
import { DEFAULT_AVAILABILITY_SETTINGS } from "@/core/types/availability";

const ALL_DAYS: WeekdayKey[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

/** Default work week for new owners: Sun–Thu, 09:00–17:00; Fri/Sat off. */
export const DEFAULT_ONBOARDING_WORK_DAYS: WeekdayKey[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
];

export function weeklyAvailabilityFromWorkDays(
  enabledDays: readonly WeekdayKey[],
  startTime: string,
  endTime: string,
  base: WeeklyAvailability = DEFAULT_AVAILABILITY_SETTINGS.weeklyAvailability,
): WeeklyAvailability {
  const set = new Set(enabledDays);
  const next = { ...base };
  for (const d of ALL_DAYS) {
    next[d] = {
      ...base[d],
      enabled: set.has(d),
      startTime,
      endTime,
    };
  }
  return next;
}
