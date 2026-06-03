"use client";

import { useEffect, useRef } from "react";

import { appPageTitle, heUi } from "@/config";
import type { ActivePreset } from "@/core/types/settings";
import {
  useDashboardTeacherId,
  useDashboardTeacherOptional,
} from "@/features/app/DashboardTeacherContext";
import {
  DataLoadErrorBanner,
  InlineLoading,
  ui,
  useToast,
} from "@/components/ui";
import { setDemoModeActive } from "@/core/demo/demoMode";
import { BackupRestoreSection } from "@/features/settings/components/BackupRestoreSection";
import { SettingsPanel } from "@/features/settings/components/SettingsPanel";
import { useServiceApp } from "@/features/app/ServiceAppProvider";
import { mergeTeacherScopeHeaders } from "@/lib/api/teacherScopeHeaders";
import { useAuth } from "@/features/auth/AuthContext";

type SettingsApiShape = {
  businessName: string;
  teacherName: string;
  phone: string;
  businessType: ActivePreset;
  defaultLessonDuration: number;
  bookingEnabled: boolean;
  workingHoursStart: string;
  workingHoursEnd: string;
  bufferBetweenLessons: number;
  brandLogoUrl: string;
  brandPrimaryColor: string;
  brandAccentColor: string;
};

type SettingsApiResponse =
  | { ok: true; settings: SettingsApiShape }
  | { ok: false; error: string };

export default function SettingsPage() {
  const { isAdmin } = useAuth();
  const toast = useToast();
  const dashboardTeacherId = useDashboardTeacherId();
  const dashboardTeacherCtx = useDashboardTeacherOptional();
  const {
    preset,
    settings,
    settingsReady,
    replaceSettings,
    availabilitySettings,
    updateAvailabilitySettings,
    settingsLoadError,
    settingsSyncError,
    retrySettingsLoad,
    retrySettingsSync,
    clientsLoadError,
    clientsSyncError,
    retryClientsLoad,
    retryClientsSync,
    appointmentsLoadError,
    appointmentsSyncError,
    retryAppointmentsLoad,
    retryAppointmentsSync,
    sortedClients,
    sortedAppointments,
    replaceClients,
    replaceAppointments,
    setEditingClientId,
    setEditingAppointmentId,
    setAppointmentPrefillClientId,
    setDemoActive,
  } = useServiceApp();

  const displayTitle =
    settings.businessName.trim() || appPageTitle(preset);
  const initializedFromApiRef = useRef(false);

  useEffect(() => {
    if (initializedFromApiRef.current) return;
    initializedFromApiRef.current = true;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/settings", { method: "GET" });
        const data = (await res.json()) as SettingsApiResponse;
        if (!res.ok || data.ok !== true) return;
        if (cancelled) return;
        replaceSettings({
          ...settings,
          businessName: data.settings.businessName,
          teacherName: data.settings.teacherName,
          businessPhone: data.settings.phone,
          activePreset: data.settings.businessType,
          defaultLessonDurationMinutes: data.settings.defaultLessonDuration,
          lessonBufferMinutes: data.settings.bufferBetweenLessons,
          workingHoursStart: data.settings.workingHoursStart,
          workingHoursEnd: data.settings.workingHoursEnd,
          brandLogoUrl: data.settings.brandLogoUrl ?? "",
          brandPrimaryColor:
            data.settings.brandPrimaryColor ?? settings.brandPrimaryColor,
          brandAccentColor:
            data.settings.brandAccentColor ?? settings.brandAccentColor,
        });
        updateAvailabilitySettings({
          ...availabilitySettings,
          bookingEnabled: data.settings.bookingEnabled,
        });
      } catch (e) {
        console.error("[ServiceOS] settings page load", e);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dashboardTeacherId]);

  return (
    <main className={ui.pageMain}>
      <header className={ui.header}>
        <h1 className={ui.pageTitle}>{displayTitle}</h1>
        <p className={ui.pageSubtitle}>{heUi.sections.settings}</p>
      </header>

      <div className={ui.pageStack}>
        {/* Teacher Selector - Only for admins with multiple teachers */}
        {isAdmin && dashboardTeacherCtx && dashboardTeacherCtx.teachersReady && dashboardTeacherCtx.teachers.length > 1 && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/30 p-4 shadow-sm">
            <label htmlFor="settings-teacher-select" className="mb-2 block text-sm font-semibold text-emerald-900">
              📋 ניהול הגדרות עבור:
            </label>
            <select
              id="settings-teacher-select"
              value={dashboardTeacherId}
              onChange={(e) => {
                const newTeacherId = e.target.value;
                const teacher = dashboardTeacherCtx.teachers.find(t => t.id === newTeacherId);
                dashboardTeacherCtx.setTeacherId(newTeacherId);
                
                if (teacher) {
                  const icon = teacher.businessType === 'driving_instructor' ? '🚗' : 
                               teacher.businessType === 'cosmetic_clinic' ? '💉' : '👤';
                  const businessName = teacher.businessName.trim() || teacher.fullName.trim();
                  toast(`${icon} עברת להגדרות של ${businessName}`);
                }
              }}
              className="w-full rounded-lg border border-emerald-300 bg-white px-4 py-2.5 text-base font-medium shadow-sm transition-colors hover:border-emerald-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            >
              {dashboardTeacherCtx.teachers.map((t) => {
                const label = t.businessName.trim() || t.fullName.trim() || t.slug || t.id;
                const icon = t.businessType === 'driving_instructor' ? '🚗' : 
                            t.businessType === 'cosmetic_clinic' ? '💉' : '👤';
                return (
                  <option key={t.id} value={t.id}>
                    {icon} {label}
                  </option>
                );
              })}
            </select>
            <p className="mt-2 text-xs text-emerald-700">
              בחר איזה עסק/מורה לערוך את ההגדרות שלו
            </p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {settingsLoadError ? (
            <DataLoadErrorBanner
              title={settingsLoadError}
              description={heUi.data.loadFailedHint}
              onRetry={retrySettingsLoad}
            />
          ) : null}
          {settingsSyncError ? (
            <DataLoadErrorBanner
              title={settingsSyncError}
              description={heUi.data.syncFailedHint}
              onRetry={retrySettingsSync}
            />
          ) : null}
          {clientsLoadError ? (
            <DataLoadErrorBanner
              title={clientsLoadError}
              description={heUi.data.loadFailedHint}
              onRetry={retryClientsLoad}
            />
          ) : null}
          {clientsSyncError ? (
            <DataLoadErrorBanner
              title={clientsSyncError}
              description={heUi.data.syncFailedHint}
              onRetry={retryClientsSync}
            />
          ) : null}
          {appointmentsLoadError ? (
            <DataLoadErrorBanner
              title={appointmentsLoadError}
              description={heUi.data.loadFailedHint}
              onRetry={retryAppointmentsLoad}
            />
          ) : null}
          {appointmentsSyncError ? (
            <DataLoadErrorBanner
              title={appointmentsSyncError}
              description={heUi.data.syncFailedHint}
              onRetry={retryAppointmentsSync}
            />
          ) : null}
        </div>
        <section className={ui.section}>
          {!settingsReady ? (
            <InlineLoading className="py-4" />
          ) : (
            <>
              <SettingsPanel
                settings={settings}
                availabilitySettings={availabilitySettings}
                onSave={async (next, nextAvailability) => {
                  const payload: SettingsApiShape = {
                    businessName: next.businessName,
                    teacherName: next.teacherName,
                    phone: next.businessPhone,
                    businessType: next.activePreset,
                    defaultLessonDuration: next.defaultLessonDurationMinutes,
                    bookingEnabled: nextAvailability.bookingEnabled,
                    workingHoursStart: next.workingHoursStart,
                    workingHoursEnd: next.workingHoursEnd,
                    bufferBetweenLessons: next.lessonBufferMinutes,
                    brandLogoUrl: next.brandLogoUrl,
                    brandPrimaryColor: next.brandPrimaryColor,
                    brandAccentColor: next.brandAccentColor,
                  };
                  try {
                    const res = await fetch("/api/settings", {
                      method: "PUT",
                      headers: mergeTeacherScopeHeaders(dashboardTeacherId, {
                        "Content-Type": "application/json",
                      }),
                      body: JSON.stringify(payload),
                    });
                    const data = (await res.json()) as SettingsApiResponse;
                    if (!res.ok || data.ok !== true) {
                      toast(
                        data.ok === false ? data.error : heUi.data.syncFailedTitle,
                        "error",
                      );
                      return false;
                    }
                    replaceSettings({
                      ...next,
                      activePreset: data.settings.businessType,
                    });
                    updateAvailabilitySettings(nextAvailability);
                    await dashboardTeacherCtx?.reloadTeachers();
                    toast(heUi.toast.settingsSaved);
                    return true;
                  } catch (e) {
                    console.error("[ServiceOS] settings page save", e);
                    toast(heUi.data.syncFailedTitle, "error");
                    return false;
                  }
                }}
              />
              {isAdmin && (
                <BackupRestoreSection
                  clients={sortedClients}
                  appointments={sortedAppointments}
                  settings={settings}
                  replaceClients={replaceClients}
                  replaceAppointments={replaceAppointments}
                  replaceSettings={replaceSettings}
                  onAfterRestore={() => {
                    setEditingClientId(null);
                    setEditingAppointmentId(null);
                    setAppointmentPrefillClientId(null);
                    setDemoModeActive(false);
                    setDemoActive(false);
                  }}
                />
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}
