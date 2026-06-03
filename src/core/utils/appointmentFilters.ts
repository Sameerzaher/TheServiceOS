import type { AppointmentRecord } from "@/core/types/appointment";
import type { Client } from "@/core/types/client";
import { isDebtStatus, isPaidStatus } from "@/core/utils/insights";
import {
  matchesDateFilter,
  type AppointmentDateFilter,
} from "@/core/utils/dateRange";

export type PaymentFilter = "all" | "paid" | "unpaid";
export type AppointmentSort = "date" | "name";

export function filterAppointments(
  rows: readonly AppointmentRecord[],
  opts: {
    dateFilter: AppointmentDateFilter;
    paymentFilter: PaymentFilter;
  },
): AppointmentRecord[] {
  return rows.filter((a) => {
    if (!matchesDateFilter(a.startAt, opts.dateFilter)) return false;
    if (opts.paymentFilter === "paid" && !isPaidStatus(a.paymentStatus)) {
      return false;
    }
    if (opts.paymentFilter === "unpaid" && !isDebtStatus(a.paymentStatus)) {
      return false;
    }
    return true;
  });
}

function startOfLocalDayFromYmd(ymd: string): number {
  const parts = ymd.split("-").map(Number);
  if (parts.length !== 3) return NaN;
  const [y, m, d] = parts;
  const dt = new Date(y, m - 1, d, 0, 0, 0, 0);
  return dt.getTime();
}

function endOfLocalDayFromYmd(ymd: string): number {
  const parts = ymd.split("-").map(Number);
  if (parts.length !== 3) return NaN;
  const [y, m, d] = parts;
  const dt = new Date(y, m - 1, d, 23, 59, 59, 999);
  return dt.getTime();
}

/**
 * Filters lessons for CSV export: optional local date range (`YYYY-MM-DD`) and payment status.
 * Empty `dateFrom` / `dateTo` means no bound on that side.
 */
export function filterAppointmentsForExport(
  rows: readonly AppointmentRecord[],
  opts: {
    dateFrom: string;
    dateTo: string;
    paymentFilter: PaymentFilter;
  },
): AppointmentRecord[] {
  return rows.filter((a) => {
    const t = new Date(a.startAt).getTime();
    if (Number.isNaN(t)) return false;

    const from = opts.dateFrom.trim();
    if (from) {
      const start = startOfLocalDayFromYmd(from);
      if (Number.isNaN(start) || t < start) return false;
    }

    const to = opts.dateTo.trim();
    if (to) {
      const end = endOfLocalDayFromYmd(to);
      if (Number.isNaN(end) || t > end) return false;
    }

    if (opts.paymentFilter === "paid" && !isPaidStatus(a.paymentStatus)) {
      return false;
    }
    if (opts.paymentFilter === "unpaid" && !isDebtStatus(a.paymentStatus)) {
      return false;
    }
    return true;
  });
}

export function sortAppointments(
  rows: readonly AppointmentRecord[],
  sort: AppointmentSort,
  clientsById: Map<string, Pick<Client, "fullName">>,
): AppointmentRecord[] {
  const copy = [...rows];
  if (sort === "date") {
    copy.sort(
      (a, b) =>
        new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
    );
    return copy;
  }
  copy.sort((a, b) => {
    const na = clientsById.get(a.clientId)?.fullName ?? "";
    const nb = clientsById.get(b.clientId)?.fullName ?? "";
    return na.localeCompare(nb, "he", { sensitivity: "base" });
  });
  return copy;
}

export function matchesClientSearch(client: Client, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const phone = client.phone.replace(/\s/g, "").toLowerCase();
  const needle = q.replace(/\s/g, "");
  return (
    client.fullName.toLowerCase().includes(q) ||
    (needle.length > 0 && phone.includes(needle))
  );
}
