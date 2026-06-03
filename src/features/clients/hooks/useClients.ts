"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { heUi } from "@/config";
import { normalizeClient } from "@/core/persistence";
import type { Client, ClientId } from "@/core/types/client";
import { isSupabaseConfigured } from "@/core/storage";
import { createId } from "@/core/utils/ids";
import { useDashboardTeacherId } from "@/features/app/DashboardTeacherContext";
import { mergeTeacherScopeHeaders } from "@/lib/api/teacherScopeHeaders";

export type NewClientInput = Omit<Client, "id" | "createdAt" | "updatedAt">;

export type ClientPatch = Partial<Omit<Client, "id" | "createdAt">>;

export interface UseClientsResult {
  clients: Client[];
  /** Clients sorted by `fullName` (Hebrew locale). */
  sortedClients: Client[];
  isReady: boolean;
  loadError: string | null;
  syncError: string | null;
  retryLoad: () => void;
  retrySync: () => void;
  addClient: (input: NewClientInput) => Client | null;
  updateClient: (id: ClientId, patch: ClientPatch) => void;
  deleteClient: (id: ClientId) => void;
  /** Replace entire list (demo seed / reset). */
  replaceClients: (next: Client[]) => void;
}

type ApiOk<T> = { ok: true } & T;
type ApiErr = { ok: false; error: string };

async function apiGetClients(teacherId: string): Promise<Client[]> {
  const res = await fetch("/api/clients", {
    method: "GET",
    headers: mergeTeacherScopeHeaders(teacherId),
  });
  const data = (await res.json()) as ApiOk<{ clients?: unknown[] }> | ApiErr;
  if (!res.ok || data.ok !== true) {
    throw new Error(data.ok === false ? data.error : "GET /api/clients failed");
  }
  const clients: Client[] = [];
  for (const row of data.clients ?? []) {
    const parsed = normalizeClient(row);
    if (parsed) clients.push(parsed);
  }
  return clients;
}

async function apiCreateClient(
  teacherId: string,
  client: Client,
): Promise<void> {
  const res = await fetch("/api/clients", {
    method: "POST",
    headers: mergeTeacherScopeHeaders(teacherId, {
      "Content-Type": "application/json",
    }),
    body: JSON.stringify(client),
  });
  const data = (await res.json()) as ApiOk<{ client?: unknown }> | ApiErr;
  if (!res.ok || data.ok !== true) {
    throw new Error(data.ok === false ? data.error : "POST /api/clients failed");
  }
}

async function apiUpdateClient(
  teacherId: string,
  id: string,
  patch: ClientPatch,
): Promise<void> {
  const res = await fetch(`/api/clients/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: mergeTeacherScopeHeaders(teacherId, {
      "Content-Type": "application/json",
    }),
    body: JSON.stringify(patch),
  });
  const data = (await res.json()) as ApiOk<Record<string, never>> | ApiErr;
  if (!res.ok || data.ok !== true) {
    throw new Error(data.ok === false ? data.error : "PUT /api/clients/:id failed");
  }
}

async function apiDeleteClient(teacherId: string, id: string): Promise<void> {
  const res = await fetch(`/api/clients/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: mergeTeacherScopeHeaders(teacherId),
  });
  const data = (await res.json()) as ApiOk<Record<string, never>> | ApiErr;
  if (!res.ok || data.ok !== true) {
    throw new Error(data.ok === false ? data.error : "DELETE /api/clients/:id failed");
  }
}

async function reconcileClientsSnapshot(
  teacherId: string,
  next: Client[],
): Promise<void> {
  const current = await apiGetClients(teacherId);
  const nextById = new Map(next.map((row) => [row.id, row]));
  const currentById = new Map(current.map((row) => [row.id, row]));

  for (const [id, row] of Array.from(nextById.entries())) {
    if (currentById.has(id)) {
      await apiUpdateClient(teacherId, id, {
        teacherId: row.teacherId,
        fullName: row.fullName,
        phone: row.phone,
        notes: row.notes,
        customFields: row.customFields,
        updatedAt: row.updatedAt,
      });
    } else {
      await apiCreateClient(teacherId, row);
    }
  }
  for (const [id] of Array.from(currentById.entries())) {
    if (!nextById.has(id)) {
      await apiDeleteClient(teacherId, id);
    }
  }
}

export function useClients(): UseClientsResult {
  const teacherId = useDashboardTeacherId();
  const remote = isSupabaseConfigured();
  const [clients, setClients] = useState<Client[]>([]);
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
        const rows = await apiGetClients(teacherId);
        if (!cancelled) {
          setClients(rows);
        }
      } catch (e) {
        console.error("[ServiceOS] useClients load", e);
        if (!cancelled) setLoadError(heUi.data.clientsLoadFailedTitle);
      } finally {
        if (!cancelled) setIsReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadKey, remote, teacherId]);

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
        await reconcileClientsSnapshot(teacherId, clients);
        setSyncError(null);
      } catch (e) {
        console.error("[ServiceOS] useClients retrySync", e);
        setSyncError(heUi.data.clientsSyncFailedTitle);
      }
    });
  }, [clients, remote, teacherId]);

  function addClient(input: NewClientInput): Client | null {
    if (!remote) {
      setSyncError(heUi.data.clientsSyncFailedTitle);
      return null;
    }
    const id = createId();
    if (!id) return null;

    const now = new Date().toISOString();
    const client: Client = {
      ...input,
      id,
      createdAt: now,
      updatedAt: now,
    };

    setClients((prev) => [...prev, client]);
    setSyncError(null);
    void (async () => {
      try {
        await apiCreateClient(teacherId, client);
      } catch (e) {
        console.error("[ServiceOS] useClients add", e);
        setClients((prev) => prev.filter((row) => row.id !== client.id));
        setSyncError(heUi.data.clientsSyncFailedTitle);
      }
    })();
    return client;
  }

  function updateClient(id: ClientId, patch: ClientPatch): void {
    if (!remote) {
      setSyncError(heUi.data.clientsSyncFailedTitle);
      return;
    }
    const row = clients.find((c) => c.id === id);
    if (!row) return;
    const merged: Client = {
      ...row,
      ...patch,
      id: row.id,
      createdAt: row.createdAt,
      updatedAt: new Date().toISOString(),
    };

    setClients((prev) => prev.map((client) => (client.id === id ? merged : client)));
    setSyncError(null);
    void (async () => {
      try {
        await apiUpdateClient(teacherId, id, {
          teacherId: merged.teacherId,
          fullName: merged.fullName,
          phone: merged.phone,
          notes: merged.notes,
          customFields: merged.customFields,
        });
      } catch (e) {
        console.error("[ServiceOS] useClients update", e);
        setClients((prev) => prev.map((r) => (r.id === id ? row : r)));
        setSyncError(heUi.data.clientsSyncFailedTitle);
      }
    })();
  }

  function deleteClient(id: ClientId): void {
    if (!remote) {
      setSyncError(heUi.data.clientsSyncFailedTitle);
      return;
    }
    let removed: Client | null = null;
    setClients((prev) => {
      removed = prev.find((row) => row.id === id) ?? null;
      return prev.filter((client) => client.id !== id);
    });
    setSyncError(null);
    void (async () => {
      try {
        await apiDeleteClient(teacherId, id);
      } catch (e) {
        console.error("[ServiceOS] useClients delete", e);
        if (removed) {
          setClients((prev) => [...prev, removed!]);
        }
        setSyncError(heUi.data.clientsSyncFailedTitle);
      }
    })();
  }

  function replaceClients(next: Client[]): void {
    const prev = clients;
    setClients(next);
    if (!remote) {
      setSyncError(heUi.data.clientsSyncFailedTitle);
      return;
    }
    setSyncError(null);
    void (async () => {
      try {
        await reconcileClientsSnapshot(teacherId, next);
      } catch (e) {
        console.error("[ServiceOS] useClients replace", e);
        setClients(prev);
        setSyncError(heUi.data.clientsSyncFailedTitle);
      }
    });
  }

  const sortedClients = useMemo(
    () =>
      [...clients].sort((a, b) =>
        a.fullName.localeCompare(b.fullName, "he", { sensitivity: "base" }),
      ),
    [clients],
  );

  return {
    clients,
    sortedClients,
    isReady,
    loadError,
    syncError,
    retryLoad,
    retrySync,
    addClient,
    updateClient,
    deleteClient,
    replaceClients,
  };
}
