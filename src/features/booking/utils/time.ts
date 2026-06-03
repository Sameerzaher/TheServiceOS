const HH_MM_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export interface ParsedTime {
  hours: number;
  minutes: number;
  totalMinutes: number;
}

export function parseHHmm(value: string): ParsedTime | null {
  const trimmed = value.trim();
  const m = HH_MM_PATTERN.exec(trimmed);
  if (!m) return null;
  const hours = Number.parseInt(m[1], 10);
  const minutes = Number.parseInt(m[2], 10);
  return {
    hours,
    minutes,
    totalMinutes: hours * 60 + minutes,
  };
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function formatHHmmFromMinutes(totalMinutes: number): string {
  const minsInDay = 24 * 60;
  const normalized = ((Math.trunc(totalMinutes) % minsInDay) + minsInDay) % minsInDay;
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${pad2(hours)}:${pad2(minutes)}`;
}

export function addMinutesToHHmm(value: string, deltaMinutes: number): string | null {
  const parsed = parseHHmm(value);
  if (!parsed) return null;
  return formatHHmmFromMinutes(parsed.totalMinutes + Math.trunc(deltaMinutes));
}

/**
 * Combines local `YYYY-MM-DD` + `HH:mm` to an ISO instant.
 * Returns null for invalid date/time input.
 */
export function combineDateAndHHmmToIso(date: string, time: string): string | null {
  const parsed = parseHHmm(time);
  if (!parsed) return null;
  const trimmedDate = date.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmedDate)) return null;
  const d = new Date(`${trimmedDate}T${time}`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export function formatHebrewDateLabel(input: string | Date): string {
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("he-IL", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
  }).format(d);
}

