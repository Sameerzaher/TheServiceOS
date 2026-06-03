"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { heUi } from "@/config";
import {
  getSupabaseDefaultTeacherId,
  isSupabaseConfigured,
} from "@/core/config/supabaseEnv";
import type { AppointmentRecord } from "@/core/types/appointment";

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
  const customFields = isRecord(raw.customFields)
    ? raw.customFields
    : ({} as Record<string, unknown>);
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

async function apiGetAppointmentsForTeacher(
  teacherId: string,
): Promise<AppointmentRecord[]> {
  const q = new URLSearchParams({ teacherId });
  const res = await fetch(`/api/appointments?${q.toString()}`, { method: "GET" });
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

export interface UsePublicTeacherAppointmentsResult {
  sortedAppointments: AppointmentRecord[];
  isReady: boolean;
  loadError: string | null;
  retryLoad: () => void;
}

/**
 * Read-only appointment list for a public booking page, scoped by `teacherId`.
 */
export function usePublicTeacherAppointments(
  teacherId: string | null,
  reloadKey?: number,
): UsePublicTeacherAppointmentsResult {
  const remote = isSupabaseConfigured();
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [loadKey, setLoadKey] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);

  const sortedAppointments = useMemo(
    () => [...appointments].sort((a, b) => a.startAt.localeCompare(b.startAt)),
    [appointments],
  );

  useEffect(() => {
    let cancelled = false;
    setLoadError(null);

    if (!teacherId || !remote) {
      setAppointments([]);
      setIsReady(true);
      return () => {
        cancelled = true;
      };
    }

    void (async () => {
      try {
        const rows = await apiGetAppointmentsForTeacher(teacherId);
        if (!cancelled) setAppointments(rows);
      } catch (e) {
        console.error("[ServiceOS] usePublicTeacherAppointments", e);
        if (!cancelled) {
          setLoadError(heUi.data.loadFailedTitle);
          setAppointments([]);
        }
      } finally {
        if (!cancelled) setIsReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [teacherId, remote, loadKey, reloadKey]);

  const retryLoad = useCallback(() => {
    setLoadError(null);
    setIsReady(false);
    setLoadKey((k) => k + 1);
  }, []);

  return {
    sortedAppointments,
    isReady,
    loadError,
    retryLoad,
  };
}
