"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { getSupabaseDefaultTeacherId } from "@/core/config/supabaseEnv";
import type { BusinessType } from "@/core/types/teacher";
import { StorageProvider } from "@/core/storage/StorageContext";
import { createServiceStorage } from "@/core/storage/createServiceStorage";

const STORAGE_KEY = "serviceos.dashboardTeacherId";
const TEACHERS_CACHE_KEY = "serviceos.teachersCache";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/** Sync read so `StorageProvider` / availability load use the real teacher id immediately (avoids a second load that wipes UI state). */
function readStoredTeacherId(fallback: string): string {
  if (typeof window === "undefined") return fallback;
  try {
    const v = window.localStorage.getItem(STORAGE_KEY)?.trim();
    if (v) return v;
  } catch {
    /* private mode / quota */
  }
  return fallback;
}

type CachedTeachers = {
  teachers: DashboardTeacherSummary[];
  timestamp: number;
};

export type DashboardTeacherSummary = {
  id: string;
  fullName: string;
  businessName: string;
  slug: string;
  businessType: BusinessType;
};

type DashboardTeacherContextValue = {
  teacherId: string;
  setTeacherId: (id: string) => void;
  teachers: DashboardTeacherSummary[];
  teachersReady: boolean;
  reloadTeachers: () => Promise<void>;
  /** Public booking path segment for the selected teacher (`/book/[slug]`). */
  teacherSlug: string | null;
};

const DashboardTeacherContext = createContext<DashboardTeacherContextValue | null>(
  null,
);

export function useDashboardTeacherId(): string {
  const ctx = useContext(DashboardTeacherContext);
  if (ctx) return ctx.teacherId;
  return getSupabaseDefaultTeacherId();
}

/** Full dashboard teacher scope; `null` outside `(app)` layout. */
export function useDashboardTeacherOptional(): DashboardTeacherContextValue | null {
  return useContext(DashboardTeacherContext);
}

/** Selected teacher's booking slug for public URLs; `null` if unknown or outside the dashboard. */
export function useDashboardTeacherSlug(): string | null {
  return useContext(DashboardTeacherContext)?.teacherSlug ?? null;
}

type TeachersApiOk = {
  ok: true;
  teachers?: Array<{
    id: string;
    fullName: string;
    businessName: string;
    slug: string;
    businessType?: BusinessType;
  }>;
};
type TeachersApiErr = { ok: false; error: string };

export function DashboardTeacherProvider({ children }: { children: ReactNode }) {
  const defaultId = getSupabaseDefaultTeacherId();
  const [teacherId, setTeacherIdState] = useState(() =>
    readStoredTeacherId(defaultId),
  );
  const [teachers, setTeachers] = useState<DashboardTeacherSummary[]>([]);
  const [teachersReady, setTeachersReady] = useState(false);
  const [loadKey, setLoadKey] = useState(0);

  const setTeacherId = useCallback((id: string) => {
    const next = id.trim();
    if (!next) return;
    console.log("[DashboardTeacherContext] Switching teacher to:", next);
    setTeacherIdState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore quota / private mode */
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    
    // Try to load from cache first
    const loadFromCache = (): DashboardTeacherSummary[] | null => {
      try {
        const cached = window.localStorage.getItem(TEACHERS_CACHE_KEY);
        if (!cached) return null;
        
        const parsed: CachedTeachers = JSON.parse(cached);
        const age = Date.now() - parsed.timestamp;
        
        if (age < CACHE_TTL_MS) {
          return parsed.teachers;
        }
      } catch {
        return null;
      }
      return null;
    };
    
    const saveToCache = (teachers: DashboardTeacherSummary[]) => {
      try {
        const cached: CachedTeachers = {
          teachers,
          timestamp: Date.now(),
        };
        window.localStorage.setItem(TEACHERS_CACHE_KEY, JSON.stringify(cached));
      } catch {
        // Ignore quota errors
      }
    };
    
    // Show cached data immediately
    const cachedTeachers = loadFromCache();
    if (cachedTeachers && cachedTeachers.length > 0) {
      setTeachers(cachedTeachers);
      setTeachersReady(true);
    }
    
    void (async () => {
      try {
        console.log("[DashboardTeacherContext] Loading teachers list");
        const res = await fetch("/api/teachers", { method: "GET" });
        const data = (await res.json()) as TeachersApiOk | TeachersApiErr;
        if (cancelled) return;
        if (!res.ok || !data || data.ok !== true) {
          console.error("[DashboardTeacherContext] Teachers load failed:", data);
          if (!cachedTeachers) {
            setTeachersReady(true);
          }
          return;
        }
        const list = (data.teachers ?? []).map((t) => ({
          ...t,
          businessType: t.businessType ?? "driving_instructor",
        }));
        
        console.log("[DashboardTeacherContext] Teachers loaded:", list.length);
        
        setTeachers(list);
        saveToCache(list);

        let saved: string | null = null;
        try {
          saved = window.localStorage.getItem(STORAGE_KEY);
        } catch {
          saved = null;
        }

        if (saved && list.some((t) => t.id === saved)) {
          console.log("[DashboardTeacherContext] Restoring saved teacher:", saved);
          setTeacherIdState(saved);
        } else if (list.length > 0) {
          console.log("[DashboardTeacherContext] Selecting first teacher:", list[0].id);
          setTeacherIdState((current) =>
            list.some((t) => t.id === current) ? current : list[0].id,
          );
        }
      } catch (e) {
        console.error("[DashboardTeacherContext] Load error:", e);
      } finally {
        if (!cancelled) setTeachersReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadKey]);

  const reloadTeachers = useCallback(async () => {
    setLoadKey((k) => k + 1);
  }, []);

  const storage = useMemo(
    () => createServiceStorage(teacherId),
    [teacherId],
  );

  const teacherSlug = useMemo(() => {
    const row = teachers.find((t) => t.id === teacherId);
    const s = typeof row?.slug === "string" ? row.slug.trim() : "";
    if (s.length > 0) return s;
    const fallbackId = teacherId.trim();
    return fallbackId.length > 0 ? fallbackId : null;
  }, [teachers, teacherId]);

  const value = useMemo<DashboardTeacherContextValue>(
    () => ({
      teacherId,
      setTeacherId,
      teachers,
      teachersReady,
      reloadTeachers,
      teacherSlug,
    }),
    [teacherId, setTeacherId, teachers, teachersReady, reloadTeachers, teacherSlug],
  );

  return (
    <DashboardTeacherContext.Provider value={value}>
      <StorageProvider storage={storage}>{children}</StorageProvider>
    </DashboardTeacherContext.Provider>
  );
}
