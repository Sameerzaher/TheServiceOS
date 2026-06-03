const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Generates `HH:mm` values from `startHour` through the end of `endHour`
 * (e.g. 6–22 → last slot 22:45 when step is 15).
 */
export function buildTimeSlotValues(
  startHour = 6,
  endHour = 22,
  stepMinutes = 15,
): string[] {
  const slots: string[] = [];
  const start = startHour * 60;
  const end = endHour * 60 + 45;
  for (let total = start; total <= end; total += stepMinutes) {
    const h = Math.floor(total / 60);
    const m = total % 60;
    slots.push(`${pad(h)}:${pad(m)}`);
  }
  return slots;
}
