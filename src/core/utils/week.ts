/** Week starts Sunday (common in IL calendars). */
export function startOfLocalWeek(reference: Date = new Date()): Date {
  const d = new Date(reference);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfLocalWeek(reference: Date = new Date()): Date {
  const start = startOfLocalWeek(reference);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

export function isInLocalWeek(iso: string, reference: Date = new Date()): boolean {
  const t = new Date(iso);
  if (Number.isNaN(t.getTime())) return false;
  const a = startOfLocalWeek(reference).getTime();
  const b = endOfLocalWeek(reference).getTime();
  return t.getTime() >= a && t.getTime() <= b;
}
