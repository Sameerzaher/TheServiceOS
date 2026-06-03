"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { heUi } from "@/config";
import { Button, EmptyState, InlineLoading, Spinner, ui } from "@/components/ui";
import { useDashboardTeacherId } from "@/features/app/DashboardTeacherContext";
import { mergeTeacherScopeHeaders } from "@/lib/api/teacherScopeHeaders";

type BookingStatus = "pending" | "confirmed" | "cancelled";

interface BookingRequestRow {
  id: string;
  fullName: string;
  phone: string;
  pickupLocation: string;
  carType: string;
  preferredDate: string;
  preferredTime: string;
  notes: string;
  status: BookingStatus;
  createdAt: string;
}

interface GetBookingsOk {
  ok: true;
  bookings?: unknown[];
}

interface ApiErr {
  ok: false;
  error: string;
}

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

function parseBookingRow(raw: unknown): BookingRequestRow | null {
  if (!isRecord(raw)) return null;
  const id = typeof raw.id === "string" ? raw.id.trim() : "";
  const rawStatus = raw.status;
  const status =
    rawStatus === "pending" ||
    rawStatus === "confirmed" ||
    rawStatus === "cancelled"
      ? rawStatus
      : null;
  if (!id || !status) return null;

  const fullName = typeof raw.fullName === "string" ? raw.fullName.trim() : "";
  const phone = typeof raw.phone === "string" ? raw.phone.trim() : "";
  const pickupLocation =
    typeof raw.pickupLocation === "string" ? raw.pickupLocation.trim() : "";
  const carType = typeof raw.carType === "string" ? raw.carType.trim() : "";
  const preferredDate =
    typeof raw.preferredDate === "string" ? raw.preferredDate.trim() : "";
  const preferredTime =
    typeof raw.preferredTime === "string" ? raw.preferredTime.trim() : "";
  const notes = typeof raw.notes === "string" ? raw.notes.trim() : "";
  const createdAt = typeof raw.createdAt === "string" ? raw.createdAt.trim() : "";

  return {
    id,
    fullName,
    phone,
    pickupLocation,
    carType,
    preferredDate,
    preferredTime,
    notes,
    status,
    createdAt,
  };
}

function parseCreatedMs(iso: string): number {
  const t = new Date(iso).getTime();
  return Number.isFinite(t) ? t : 0;
}

function formatDateDisplay(ymd: string): string {
  if (!ymd) return "—";
  try {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return ymd;
    const parsed = new Date(`${ymd}T12:00:00`);
    return new Intl.DateTimeFormat("he-IL", { dateStyle: "medium" }).format(parsed);
  } catch {
    return ymd;
  }
}

function formatTimeDisplay(hm: string): string {
  if (!hm) return "—";
  try {
    if (!/^\d{2}:\d{2}$/.test(hm)) return hm;
    const parsed = new Date(`2000-01-01T${hm}:00`);
    return new Intl.DateTimeFormat("he-IL", { timeStyle: "short" }).format(parsed);
  } catch {
    return hm;
  }
}

function statusLabel(status: BookingStatus): string {
  if (status === "confirmed") return heUi.dashboard.bookingStatusConfirmed;
  if (status === "cancelled") return heUi.dashboard.bookingStatusCancelled;
  return heUi.dashboard.bookingStatusPending;
}

export function BookingRequestsPanel({
  embedded = false,
}: {
  embedded?: boolean;
} = {}) {
  const teacherId = useDashboardTeacherId();
  const [rows, setRows] = useState<BookingRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent === true;
    if (!silent) {
      setLoading(true);
    }
    setError(null);
    try {
      const res = await fetch("/api/bookings", {
        method: "GET",
        headers: mergeTeacherScopeHeaders(teacherId),
      });
      const data = (await res.json()) as GetBookingsOk | ApiErr;
      if (!res.ok || data.ok !== true) {
        throw new Error(data.ok === false ? data.error : heUi.data.loadFailedTitle);
      }
      const next: BookingRequestRow[] = [];
      for (const row of data.bookings ?? []) {
        const parsed = parseBookingRow(row);
        if (parsed) next.push(parsed);
      }
      setRows(next);
    } catch (e) {
      console.error("[ServiceOS] booking requests load", e);
      setError(heUi.data.loadFailedTitle);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [teacherId]);

  useEffect(() => {
    void load();
  }, [load]);

  const sortedRows = useMemo(
    () =>
      [...rows].sort((a, b) => parseCreatedMs(b.createdAt) - parseCreatedMs(a.createdAt)),
    [rows],
  );

  async function updateStatus(id: string, status: BookingStatus): Promise<void> {
    setPendingIds((prev) => new Set(prev).add(id));
    const previous = rows;
    if (status === "confirmed") {
      setRows((prev) => prev.filter((r) => r.id !== id));
    } else {
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    }
    try {
      const res = await fetch(`/api/bookings/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: mergeTeacherScopeHeaders(teacherId, {
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({ status }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || data.ok !== true) {
        throw new Error(
          typeof data.error === "string" && data.error.length > 0
            ? data.error
            : heUi.data.syncFailedTitle,
        );
      }
      await load({ silent: true });
    } catch (e) {
      console.error("[ServiceOS] booking requests update", e);
      setRows(previous);
      setError(heUi.data.syncFailedTitle);
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  const body = loading ? (
    <InlineLoading className="py-2" />
  ) : error ? (
    <div className={ui.formCard}>
      <p className="text-sm text-red-600">{error}</p>
      <div className="mt-3">
        <Button type="button" variant="secondary" size="sm" onClick={() => void load()}>
          {heUi.errors.tryAgain}
        </Button>
      </div>
    </div>
  ) : sortedRows.length === 0 ? (
    <EmptyState
      tone="muted"
      title={heUi.dashboard.bookingRequestsEmpty}
      className="py-8"
    />
  ) : (
    <ul className={ui.list}>
      {sortedRows.map((row) => {
        const busy = pendingIds.has(row.id);
        return (
          <li key={row.id} className={ui.listItem}>
            <div className="flex flex-col gap-3">
              <div className="min-w-0 space-y-1.5">
                <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 sm:text-sm">
                  {heUi.dashboard.bookingRequesterName}:{" "}
                  {row.fullName.trim() ? row.fullName : "—"}
                </p>
                <p className="text-xs text-neutral-700 dark:text-neutral-300 sm:text-sm">
                  {heUi.dashboard.bookingRequesterPhone}: {row.phone.trim() ? row.phone : "—"}
                </p>
                <p className="text-xs text-neutral-700 dark:text-neutral-300 sm:text-sm">
                  {heUi.dashboard.bookingRequesterDate}: {formatDateDisplay(row.preferredDate)}
                </p>
                <p className="text-xs text-neutral-700 dark:text-neutral-300 sm:text-sm">
                  {heUi.dashboard.bookingRequesterTime}: {formatTimeDisplay(row.preferredTime)}
                </p>
                <p className="text-xs text-neutral-700 dark:text-neutral-300 sm:text-sm">
                  {heUi.dashboard.bookingRequesterStatus}: {statusLabel(row.status)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {busy ? (
                  <Spinner className="size-5 shrink-0 border-neutral-300 border-t-neutral-700" />
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="primary"
                    disabled={busy || row.status === "confirmed"}
                    onClick={() => void updateStatus(row.id, "confirmed")}
                  >
                    {heUi.dashboard.bookingActionConfirm}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="danger"
                    disabled={busy || row.status === "cancelled"}
                    onClick={() => void updateStatus(row.id, "cancelled")}
                  >
                    {heUi.dashboard.bookingActionCancel}
                  </Button>
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );

  if (embedded) {
    return body;
  }

  return (
    <section className={ui.section}>
      <h2 className={ui.sectionHeading}>{heUi.dashboard.bookingRequestsTitle}</h2>
      {body}
    </section>
  );
}
