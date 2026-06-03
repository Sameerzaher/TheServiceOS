"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { heUi } from "@/config";
import { isSupabaseConfigured, useServiceStorage } from "@/core/storage";
import {
  DEFAULT_APP_SETTINGS,
  normalizeAppSettings,
  type AppSettings,
} from "@/core/types/settings";

export interface UseSettingsResult {
  settings: AppSettings;
  isReady: boolean;
  loadError: string | null;
  syncError: string | null;
  retryLoad: () => void;
  retrySync: () => void;
  updateSettings: (patch: Partial<AppSettings>) => void;
  replaceSettings: (next: AppSettings) => void;
}

export function useSettings(): UseSettingsResult {
  const storage = useServiceStorage();
  const remote = isSupabaseConfigured();
  const skipPersistAfterLoadRef = useRef(false);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);
  const [isReady, setIsReady] = useState(false);
  const [loadKey, setLoadKey] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoadError(null);
    void (async () => {
      try {
        const next = await storage.loadSettings();
        if (!cancelled) {
          setSettings(next);
          if (remote) skipPersistAfterLoadRef.current = true;
        }
      } catch (e) {
        console.error("[ServiceOS] useSettings load", e);
        if (!cancelled) setLoadError(heUi.data.settingsLoadFailedTitle);
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
        await storage.persistSettings(settings);
        if (cancelled) return;
        setSyncError(null);
        if (remote) {
          skipPersistAfterLoadRef.current = true;
          const next = await storage.loadSettings();
          if (!cancelled) setSettings(next);
        }
      } catch (e) {
        console.error("[ServiceOS] useSettings persist", e);
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
        await storage.persistSettings(settings);
        setSyncError(null);
        if (remote) {
          skipPersistAfterLoadRef.current = true;
          const next = await storage.loadSettings();
          setSettings(next);
        }
      } catch (e) {
        console.error("[ServiceOS] useSettings retrySync", e);
        setSyncError(heUi.data.syncFailedTitle);
      }
    });
  }, [remote, settings, storage]);

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setSettings((prev) => normalizeAppSettings({ ...prev, ...patch }));
  }, []);

  const replaceSettings = useCallback((next: AppSettings) => {
    setSettings(normalizeAppSettings(next));
  }, []);

  return {
    settings,
    isReady,
    loadError,
    syncError,
    retryLoad,
    retrySync,
    updateSettings,
    replaceSettings,
  };
}
