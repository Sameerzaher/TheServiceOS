"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { heUi } from "@/config";
import type { ClientId } from "@/core/types/client";
import type {
  Appointment,
  AppointmentId,
  AppointmentRecord,
} from "@/core/types/appointment";
import { getSupabaseDefaultTeacherId } from "@/core/config/supabaseEnv";
import { isSupabaseConfigured } from "@/core/storage";
import { createId } from "@/core/utils/ids";
import { useDashboardTeacherId } from "@/features/app/DashboardTeacherContext";
import { mergeTeacherScopeHeaders } from "@/lib/api/teacherScopeHeaders";

export type AppointmentPatch = Partial<Omit<AppointmentRecord, "id" | "createdAt">>;

export interface UseAppointmentsResult {
  appointments: AppointmentRecord[];
  /** Sorted by `startAt` ascending (earliest first). */
  sortedAppointments: AppointmentRecord[];
  isReady: boolean;
  loadError: string | null;
  syncError: string | null;
  retryLoad: () => void;
  retrySync: () => void;
  addAppointment: (input: Appointment) => AppointmentRecord | null;
  updateAppointment: (id: AppointmentId, patch: AppointmentPatch) => void;
  deleteAppointment: (id: AppointmentId) => void;
  /** Removes all appointments for a client (e.g. when deleting the client). */
  deleteAppointmentsForClient: (clientId: ClientId) => void;
  /** Replace entire list (demo seed / reset). */
  replaceAppointments: (next: AppointmentRecord[]) => void;
  /** Re-fetch from GET /api/appointments without toggling readiness (e.g. after booking confirm). */
  reloadAppointments: () => Promise<void>;
}

type ApiOk<T> = { ok: true } & T;
type ApiErr = { ok: false; error: string };

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

function normalizeAppointment(raw: unknown): AppointmentRecord | null {
  if (!isRecord(raw)) return null;
  const id = typeof raw.id === "string" ? raw.id : "";
  const clientId = typeof raw.clientId === "string" ? raw.clientId : "";
  const startAt = typeof raw.startAt === "string" ? raw.startAt : "";
  const status = typeof raw.status === "string" ? raw.status : "";
  const paymentStatus = typeof raw.paymentStatus === "string" ? raw.paymentStatus : "";
  const amount =
    typeof raw.amount === "number" ? raw.amount : Number(raw.amount ?? 0);
  const customFields =
    isRecord(raw.customFields) ? raw.customFields : ({} as Record<string, unknown>);
  const createdAt = typeof raw.createdAt === "string" ? raw.createdAt : "";
  const updatedAt = typeof raw.updatedAt === "string" ? raw.updatedAt : "";
  const teacherIdRaw =
    typeof raw.teacherId === "string" ? raw.teacherId.trim() : "";
  const teacherId =
    teacherIdRaw.length > 0 ? teacherIdRaw : getSupabaseDefaultTeacherId();
  if (!id || !clientId || !startAt || !status || !paymentStatus || !createdAt || !updatedAt) {
    return null;
  }
  return {
    id,
    teacherId,
    clientId,
    startAt,
    status: status as AppointmentRecord["status"],
    paymentStatus: paymentStatus as AppointmentRecord["paymentStatus"],
    amount: Number.isFinite(amount) ? Math.max(0, amount) : 0,
    customFields,
    createdAt,
    updatedAt,
  };
}

async function apiGetAppointments(
  teacherId: string,
): Promise<AppointmentRecord[]> {
  const res = await fetch("/api/appointments", {
    method: "GET",
    headers: mergeTeacherScopeHeaders(teacherId),
  });
  const data = (await res.json()) as ApiOk<{ appointments?: unknown[] }> | ApiErr;
  if (!res.ok || data.ok !== true) {
    throw new Error(data.ok === false ? data.error : "GET /api/appointments failed");
  }
  const out: AppointmentRecord[] = [];
  for (const row of data.appointments ?? []) {
    const parsed = normalizeAppointment(row);
    if (parsed) out.push(parsed);
  }
  return out;
}

async function apiCreateAppointment(
  teacherId: string,
  row: AppointmentRecord,
): Promise<void> {
  const endAtRaw = row.customFields?.bookingSlotEnd;
  const notesRaw = row.customFields?.notes;
  const res = await fetch("/api/appointments", {
    method: "POST",
    headers: mergeTeacherScopeHeaders(teacherId, {
      "Content-Type": "application/json",
    }),
    body: JSON.stringify({
      ...row,
      endAt: typeof endAtRaw === "string" ? endAtRaw : "",
      notes: typeof notesRaw === "string" ? notesRaw : "",
    }),
  });
  const data = (await res.json()) as ApiOk<{ appointment?: unknown }> | ApiErr;
  if (!res.ok || data.ok !== true) {
    throw new Error(data.ok === false ? data.error : "POST /api/appointments failed");
  }
}

async function apiUpdateAppointment(
  teacherId: string,
  id: string,
  patch: AppointmentPatch,
): Promise<void> {
  const endAtRaw = patch.customFields?.bookingSlotEnd;
  const notesRaw = patch.customFields?.notes;
  const res = await fetch(`/api/appointments/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: mergeTeacherScopeHeaders(teacherId, {
      "Content-Type": "application/json",
    }),
    body: JSON.stringify({
      ...patch,
      endAt: typeof endAtRaw === "string" ? endAtRaw : undefined,
      notes: typeof notesRaw === "string" ? notesRaw : undefined,
    }),
  });
  const data = (await res.json()) as ApiOk<Record<string, never>> | ApiErr;
  if (!res.ok || data.ok !== true) {
    throw new Error(data.ok === false ? data.error : "PUT /api/appointments/:id failed");
  }
}

async function apiDeleteAppointment(
  teacherId: string,
  id: string,
): Promise<void> {
  const res = await fetch(`/api/appointments/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: mergeTeacherScopeHeaders(teacherId),
  });
  const data = (await res.json()) as ApiOk<Record<string, never>> | ApiErr;
  if (!res.ok || data.ok !== true) {
    throw new Error(data.ok === false ? data.error : "DELETE /api/appointments/:id failed");
  }
}

async function reconcileAppointmentsSnapshot(
  teacherId: string,
  next: AppointmentRecord[],
): Promise<void> {
  const current = await apiGetAppointments(teacherId);
  const nextById = new Map(next.map((row) => [row.id, row]));
  const currentById = new Map(current.map((row) => [row.id, row]));

  for (const [id, row] of Array.from(nextById.entries())) {
    if (currentById.has(id)) {
      await apiUpdateAppointment(teacherId, id, {
        teacherId: row.teacherId,
        clientId: row.clientId,
        startAt: row.startAt,
        status: row.status,
        paymentStatus: row.paymentStatus,
        amount: row.amount,
        customFields: row.customFields,
        updatedAt: row.updatedAt,
      });
    } else {
      await apiCreateAppointment(teacherId, row);
    }
  }
  for (const [id] of Array.from(currentById.entries())) {
    if (!nextById.has(id)) {
      await apiDeleteAppointment(teacherId, id);
    }
  }
}

/**
 * @param reloadKey Increment to force a reload from storage (e.g. after public API booking).
 */
export function useAppointments(reloadKey?: number): UseAppointmentsResult {
  const teacherId = useDashboardTeacherId();
  const remote = isSupabaseConfigured();
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [loadKey, setLoadKey] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoadError(null);
    setSyncError(null);
    void (async () => {
      try {
        if (!remote) {
          throw new Error("Supabase is not configured");
        }
        const rows = await apiGetAppointments(teacherId);
        if (!cancelled) {
          setAppointments(rows);
        }
      } catch (e) {
        console.error("[ServiceOS] useAppointments load", e);
        if (!cancelled) setLoadError(heUi.data.loadFailedTitle);
      } finally {
        if (!cancelled) setIsReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadKey, remote, loadKey, teacherId]);

  const retryLoad = useCallback(() => {
    setLoadError(null);
    setIsReady(false);
    setLoadKey((k) => k + 1);
  }, []);

  const retrySync = useCallback(() => {
    setSyncError(null);
    void (async () => {
      try {
        if (!remote) {
          throw new Error("Supabase is not configured");
        }
        await reconcileAppointmentsSnapshot(teacherId, appointments);
        setSyncError(null);
      } catch (e) {
        console.error("[ServiceOS] useAppointments retrySync", e);
        setSyncError(heUi.data.syncFailedTitle);
      }
    });
  }, [appointments, remote, teacherId]);

  const reloadAppointments = useCallback(async () => {
    if (!remote) return;
    try {
      const rows = await apiGetAppointments(teacherId);
      setAppointments(rows);
      setLoadError(null);
    } catch (e) {
      console.error("[ServiceOS] useAppointments reload", e);
      setLoadError(heUi.data.loadFailedTitle);
    }
  }, [remote, teacherId]);

  function addAppointment(input: Appointment): AppointmentRecord | null {
    if (!remote) {
      setSyncError(heUi.data.syncFailedTitle);
      return null;
    }
    const id = createId();
    if (!id) return null;

    const now = new Date().toISOString();
    const row: AppointmentRecord = {
      ...input,
      amount: input.amount ?? 0,
      id,
      createdAt: now,
      updatedAt: now,
    };

    setAppointments((prev) => [...prev, row]);
    setSyncError(null);
    void (async () => {
      try {
        await apiCreateAppointment(teacherId, row);
      } catch (e) {
        console.error("[ServiceOS] useAppointments add", e);
        setAppointments((prev) => prev.filter((a) => a.id !== row.id));
        setSyncError(heUi.data.syncFailedTitle);
      }
    })();
    return row;
  }

  function updateAppointment(id: AppointmentId, patch: AppointmentPatch): void {
    if (!remote) {
      setSyncError(heUi.data.syncFailedTitle);
      return;
    }
    let before: AppointmentRecord | null = null;
    setAppointments((prev) => {
      const next = prev.map((a) => {
        if (a.id !== id) return a;
        before = a;
        return {
          ...a,
          ...patch,
          id: a.id,
          createdAt: a.createdAt,
          updatedAt: new Date().toISOString(),
        };
      });
      return next;
    });
    setSyncError(null);
    void (async () => {
      try {
        await apiUpdateAppointment(teacherId, id, patch);
      } catch (e) {
        console.error("[ServiceOS] useAppointments update", e);
        if (before) {
          setAppointments((prev) => prev.map((a) => (a.id === id ? before! : a)));
        }
        setSyncError(heUi.data.syncFailedTitle);
      }
    })();
  }

  function deleteAppointment(id: AppointmentId): void {
    if (!remote) {
      setSyncError(heUi.data.syncFailedTitle);
      return;
    }
    let removed: AppointmentRecord | null = null;
    setAppointments((prev) => {
      removed = prev.find((a) => a.id === id) ?? null;
      return prev.filter((a) => a.id !== id);
    });
    setSyncError(null);
    void (async () => {
      try {
        await apiDeleteAppointment(teacherId, id);
      } catch (e) {
        console.error("[ServiceOS] useAppointments delete", e);
        if (removed) {
          setAppointments((prev) => [...prev, removed!]);
        }
        setSyncError(heUi.data.syncFailedTitle);
      }
    })();
  }

  function deleteAppointmentsForClient(clientId: ClientId): void {
    if (!remote) {
      setSyncError(heUi.data.syncFailedTitle);
      return;
    }
    let removed: AppointmentRecord[] = [];
    setAppointments((prev) => {
      removed = prev.filter((a) => a.clientId === clientId);
      return prev.filter((a) => a.clientId !== clientId);
    });
    setSyncError(null);
    void (async () => {
      try {
        for (const row of removed) {
          await apiDeleteAppointment(teacherId, row.id);
        }
      } catch (e) {
        console.error("[ServiceOS] useAppointments deleteByClient", e);
        if (removed.length > 0) {
          setAppointments((prev) => [...prev, ...removed]);
        }
        setSyncError(heUi.data.syncFailedTitle);
      }
    })();
  }

  function replaceAppointments(next: AppointmentRecord[]): void {
    const prev = appointments;
    setAppointments(next);
    if (!remote) {
      setSyncError(heUi.data.syncFailedTitle);
      return;
    }
    setSyncError(null);
    void (async () => {
      try {
        await reconcileAppointmentsSnapshot(teacherId, next);
      } catch (e) {
        console.error("[ServiceOS] useAppointments replace", e);
        setAppointments(prev);
        setSyncError(heUi.data.syncFailedTitle);
      }
    })();
  }

  const sortedAppointments = useMemo(
    () =>
      [...appointments].sort(
        (a, b) =>
          new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
      ),
    [appointments],
  );

  return {
    appointments,
    sortedAppointments,
    isReady,
    loadError,
    syncError,
    retryLoad,
    retrySync,
    reloadAppointments,
    addAppointment,
    updateAppointment,
    deleteAppointment,
    deleteAppointmentsForClient,
    replaceAppointments,
  };
}
