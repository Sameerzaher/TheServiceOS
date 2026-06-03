"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { heUi } from "@/config";
import { isSupabaseConfigured, useServiceStorage } from "@/core/storage";
import {
  DEFAULT_AVAILABILITY_SETTINGS,
  normalizeAvailabilitySettings,
  type AvailabilitySettings,
} from "@/core/types/availability";

export interface UseAvailabilitySettingsResult {
  settings: AvailabilitySettings;
  isReady: boolean;
  loadError: string | null;
  syncError: string | null;
  retryLoad: () => void;
  retrySync: () => void;
  updateSettings: (patch: Partial<AvailabilitySettings>) => void;
  resetSettings: () => void;
}

function safeLoadingDefaults(): AvailabilitySettings {
  return normalizeAvailabilitySettings({ bookingEnabled: false });
}

export function useAvailabilitySettings(): UseAvailabilitySettingsResult {
  const storage = useServiceStorage();
  const remote = isSupabaseConfigured();
  const skipPersistAfterLoadRef = useRef(false);

  const [settings, setSettings] = useState<AvailabilitySettings>(() =>
    safeLoadingDefaults(),
  );
  const [isReady, setIsReady] = useState(false);
  const [loadKey, setLoadKey] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoadError(null);
    void (async () => {
      try {
        const next = await storage.loadAvailabilitySettings();
        if (!cancelled) {
          setSettings(next);
          if (remote) skipPersistAfterLoadRef.current = true;
        }
      } catch (e) {
        console.error("[ServiceOS] useAvailabilitySettings load", e);
        if (!cancelled) {
          setLoadError(heUi.data.availabilityLoadFailedTitle);
          setSettings(safeLoadingDefaults());
        }
      } finally {
        if (!cancelled) setIsReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [remote, storage, loadKey]);

  useEffect(() => {
    if (!isReady) return;
    if (remote && skipPersistAfterLoadRef.current) {
      skipPersistAfterLoadRef.current = false;
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        await storage.persistAvailabilitySettings(settings);
        if (cancelled) return;
        setSyncError(null);
        /**
         * Do not re-fetch after save. A reload was resetting toggles like
         * `enableAutoReminders` when the DB row or API mapping omitted reminder
         * columns — the checkbox expanded block then vanished immediately after click.
         * Local state already matches what we POSTed to `/api/availability-settings`.
         */
        if (remote) {
          skipPersistAfterLoadRef.current = true;
        }
      } catch (e) {
        console.error("[ServiceOS] useAvailabilitySettings persist", e);
        if (!cancelled) setSyncError(heUi.data.syncFailedTitle);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [settings, isReady, remote, storage]);

  const retryLoad = useCallback(() => {
    setLoadError(null);
    setIsReady(false);
    setLoadKey((k) => k + 1);
  }, []);

  const retrySync = useCallback(() => {
    setSyncError(null);
    void (async () => {
      try {
        await storage.persistAvailabilitySettings(settings);
        setSyncError(null);
        if (remote) {
          skipPersistAfterLoadRef.current = true;
        }
      } catch (e) {
        console.error("[ServiceOS] useAvailabilitySettings retrySync", e);
        setSyncError(heUi.data.syncFailedTitle);
      }
    });
  }, [remote, settings, storage]);

  const updateSettings = useCallback(
    (patch: Partial<AvailabilitySettings>) => {
      setSettings((prev) =>
        normalizeAvailabilitySettings({ ...prev, ...patch }),
      );
    },
    [],
  );

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_AVAILABILITY_SETTINGS);
  }, []);

  return {
    settings,
    isReady,
    loadError,
    syncError,
    retryLoad,
    retrySync,
    updateSettings,
    resetSettings,
  };
}
