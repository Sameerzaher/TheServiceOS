import { isLocalCalendarDay } from "@/core/reminders/tomorrow";

import { isInLocalWeek } from "@/core/utils/week";

export type AppointmentDateFilter =
  | "all"
  | "today"
  | "tomorrow"
  | "this_week"
  | "custom";

export function matchesDateFilter(
  startAtIso: string,
  filter: AppointmentDateFilter,
  reference: Date = new Date(),
): boolean {
  if (filter === "all") return true;
  if (filter === "today") return isLocalCalendarDay(startAtIso, reference);
  if (filter === "this_week") return isInLocalWeek(startAtIso, reference);
  const tomorrow = new Date(reference);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return isLocalCalendarDay(startAtIso, tomorrow);
}
