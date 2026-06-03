"use client";

import { useEffect } from "react";

import { useToast } from "@/components/ui/Toast";
import { heUi } from "@/config";
import { isSupabaseConfigured } from "@/core/config/supabaseEnv";
import {
  ensureStorageBootstrap,
  getLastStorageBootstrapResult,
} from "@/core/persistence";

/**
 * Runs LocalStorage bootstrap when domain data lives in the browser.
 * Skipped when Supabase is the active store (no `serviceos.*` keys required).
 */
export function StorageBootstrapNotifier(): null {
  const toast = useToast();

  useEffect(() => {
    if (isSupabaseConfigured()) return;

    ensureStorageBootstrap();
    const r = getLastStorageBootstrapResult();
    if (r && !r.ok) {
      toast(heUi.toast.storageSchemaReset, "error");
    }
  }, [toast]);

  return null;
}
