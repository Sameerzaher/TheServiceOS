"use client";

import { useCallback, useEffect, useState } from "react";

import { heUi } from "@/config";
import { Button, ui, useToast } from "@/components/ui";
import { cn } from "@/lib/cn";

type IntegrationStatus = {
  oauthConfigured: boolean;
  connected: boolean;
  accountEmail: string | null;
  syncEnabled: boolean;
  calendarId: string;
  lastSyncAt: string | null;
  lastSyncStatus: string | null;
  lastSyncError: string | null;
  descriptionTemplate: string | null;
};

export function GoogleCalendarSettingsCard() {
  const toast = useToast();
  const [status, setStatus] = useState<IntegrationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [draftSync, setDraftSync] = useState(true);
  const [draftTemplate, setDraftTemplate] = useState("");
  const [draftCalendarId, setDraftCalendarId] = useState("primary");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/integrations/google-calendar", {
        credentials: "include",
      });
      const data = (await res.json()) as
        | ({
            ok: true;
          } & IntegrationStatus)
        | { ok: false; error?: string };
      if (!res.ok || !("ok" in data) || data.ok !== true) {
        setStatus(null);
        return;
      }
      setStatus({
        oauthConfigured: data.oauthConfigured,
        connected: data.connected,
        accountEmail: data.accountEmail,
        syncEnabled: data.syncEnabled,
        calendarId: data.calendarId,
        lastSyncAt: data.lastSyncAt,
        lastSyncStatus: data.lastSyncStatus,
        lastSyncError: data.lastSyncError,
        descriptionTemplate: data.descriptionTemplate,
      });
      setDraftSync(data.syncEnabled);
      setDraftTemplate(data.descriptionTemplate ?? "");
      setDraftCalendarId(data.calendarId || "primary");
    } catch {
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const q = new URLSearchParams(window.location.search).get("googleCalendar");
    if (q === "connected") {
      toast(heUi.settings.googleCalendarToastConnected);
      window.history.replaceState({}, "", window.location.pathname);
      void load();
    }
    if (q && q !== "connected") {
      toast(heUi.settings.googleCalendarLastError + `: ${q}`, "error");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [load, toast]);

  async function savePatch(): Promise<void> {
    setSaving(true);
    try {
      const res = await fetch("/api/integrations/google-calendar", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          syncEnabled: draftSync,
          descriptionTemplate: draftTemplate.trim() || null,
          calendarId: draftCalendarId.trim() || "primary",
        }),
      });
      const data = (await res.json()) as { ok?: boolean };
      if (!res.ok || !data.ok) {
        toast(heUi.data.syncFailedTitle, "error");
        return;
      }
      toast(heUi.settings.save);
      void load();
    } finally {
      setSaving(false);
    }
  }

  async function disconnect(): Promise<void> {
    setSaving(true);
    try {
      const res = await fetch("/api/integrations/google-calendar/disconnect", {
        method: "POST",
        credentials: "include",
      });
      const data = (await res.json()) as { ok?: boolean };
      if (!res.ok || !data.ok) {
        toast(heUi.data.syncFailedTitle, "error");
        return;
      }
      toast(heUi.settings.googleCalendarDisconnect);
      void load();
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className={cn(ui.card, "p-4 text-sm text-neutral-600")}>
        {heUi.loading.settings}
      </div>
    );
  }

  if (!status?.oauthConfigured) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
        {heUi.settings.googleCalendarNotConfigured}
      </div>
    );
  }

  const lastSyncLabel =
    status.lastSyncAt &&
    Number.isFinite(Date.parse(status.lastSyncAt))
      ? new Intl.DateTimeFormat("he-IL", {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(new Date(status.lastSyncAt))
      : heUi.settings.googleCalendarNone;

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-800 sm:p-6">
      <h2 className="mb-2 text-base font-semibold text-neutral-900 dark:text-neutral-100 sm:text-lg">
        {heUi.settings.googleCalendarTitle}
      </h2>
      <p className="mb-4 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400 sm:text-sm">
        {heUi.settings.googleCalendarIntro}
      </p>

      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-neutral-800 dark:text-neutral-100">
              {status.connected && status.accountEmail
                ? heUi.settings.googleCalendarConnectedAs(status.accountEmail)
                : heUi.settings.googleCalendarNone}
            </p>
            <p className="mt-1 text-xs text-neutral-500">
              {heUi.settings.googleCalendarLastSync}: {lastSyncLabel}
              {status.lastSyncStatus ? (
                <span className="ms-2">
                  (
                  {status.lastSyncStatus === "ok"
                    ? heUi.settings.googleCalendarStatusOk
                    : heUi.settings.googleCalendarStatusError}
                  )
                </span>
              ) : null}
            </p>
            {status.lastSyncError ? (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                {heUi.settings.googleCalendarLastError}: {status.lastSyncError}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {!status.connected ? (
              <Button
                type="button"
                variant="primary"
                size="md"
                disabled={saving}
                onClick={() => {
                  window.location.href = "/api/integrations/google-calendar/auth";
                }}
              >
                {heUi.settings.googleCalendarConnect}
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  disabled={saving}
                  onClick={() => {
                    window.location.href =
                      "/api/integrations/google-calendar/auth";
                  }}
                >
                  {heUi.settings.googleCalendarReconnect}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  disabled={saving}
                  onClick={() => void disconnect()}
                >
                  {heUi.settings.googleCalendarDisconnect}
                </Button>
              </>
            )}
          </div>
        </div>

        {status.connected ? (
          <>
            <label className="flex cursor-pointer items-start gap-3 text-sm text-neutral-800 dark:text-neutral-200">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-neutral-300 text-emerald-600"
                checked={draftSync}
                onChange={(e) => setDraftSync(e.target.checked)}
              />
              <span>
                <span className="font-medium">
                  {heUi.settings.googleCalendarSyncEnabled}
                </span>
                <span className="mt-1 block text-xs text-neutral-500">
                  {heUi.settings.googleCalendarSyncEnabledHint}
                </span>
              </span>
            </label>

            <div>
              <label
                className={cn(ui.label, "text-xs sm:text-sm")}
                htmlFor="gcal-template"
              >
                {heUi.settings.googleCalendarDescriptionTemplate}
              </label>
              <textarea
                id="gcal-template"
                rows={4}
                value={draftTemplate}
                onChange={(e) => setDraftTemplate(e.target.value)}
                className={cn(
                  ui.input,
                  "min-h-[5rem] resize-y font-mono text-xs sm:text-sm",
                )}
              />
              <p className="mt-1 text-[10px] text-neutral-500 sm:text-xs">
                {heUi.settings.googleCalendarDescriptionTemplateHint}
              </p>
            </div>

            <div>
              <label
                className={cn(ui.label, "text-xs sm:text-sm")}
                htmlFor="gcal-cal-id"
              >
                {heUi.settings.googleCalendarCalendarId}
              </label>
              <input
                id="gcal-cal-id"
                dir="ltr"
                className={cn(ui.input, "font-mono text-sm")}
                value={draftCalendarId}
                onChange={(e) => setDraftCalendarId(e.target.value)}
              />
              <p className="mt-1 text-[10px] text-neutral-500 sm:text-xs">
                {heUi.settings.googleCalendarCalendarIdHint}
              </p>
            </div>

            <Button
              type="button"
              variant="primary"
              size="md"
              disabled={saving}
              onClick={() => void savePatch()}
            >
              {heUi.settings.googleCalendarSaveIntegration}
            </Button>
          </>
        ) : null}
      </div>
    </div>
  );
}
