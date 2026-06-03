"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { appTagline, heUi } from "@/config";
import {
  DataLoadErrorBanner,
  EmptyState,
  InlineLoading,
  ui,
  useToast,
} from "@/components/ui";
import { ExportLessonsPanel } from "@/features/export/components/ExportLessonsPanel";
import { exportStudentsCsv } from "@/features/export/csvExport";
import { BusinessKpiStrip } from "@/features/dashboard/components/BusinessKpiStrip";
import { OwnerOnboardingBanner } from "@/features/dashboard/components/OwnerOnboardingBanner";
import { HomeQuickDashboard } from "@/features/dashboard/components/HomeQuickDashboard";
import { BookingRequestsPanel } from "@/features/dashboard/components/BookingRequestsPanel";
import { AnalyticsSummaryWidget } from "@/features/analytics/components/AnalyticsSummaryWidget";
import { saveFirstRunOnboardingState } from "@/core/onboarding/firstRun";
import {
  FirstRunOnboarding,
  ONBOARDING_ANCHORS,
} from "@/features/onboarding/components/FirstRunOnboarding";
import { useDashboardTeacherId } from "@/features/app/DashboardTeacherContext";
import { useServiceApp } from "@/features/app/ServiceAppProvider";
import { mergeTeacherScopeHeaders } from "@/lib/api/teacherScopeHeaders";

export default function DashboardPage() {
  const router = useRouter();
  const toast = useToast();
  const dashboardTeacherId = useDashboardTeacherId();
  const {
    preset,
    settings,
    sortedClients,
    sortedAppointments,
    dataReady,
    isStorageEmpty,
    demoActive,
    handleRequestLoadDemo,
    setDemoResetOpen,
    onboardingDismissed,
    remindersReviewed,
    setRemindersReviewed,
    setOnboardingDismissed,
    displayTitle,
    clientsLoadError,
    clientsSyncError,
    retryClientsLoad,
    retryClientsSync,
    appointmentsLoadError,
    appointmentsSyncError,
    retryAppointmentsLoad,
    retryAppointmentsSync,
    settingsLoadError,
    settingsSyncError,
    retrySettingsLoad,
    retrySettingsSync,
    availabilityLoadError,
    availabilitySyncError,
    retryAvailabilityLoad,
    retryAvailabilitySync,
  } = useServiceApp();
  const [pendingBookingRequests, setPendingBookingRequests] = useState(0);
  const bookingRequestsDetailsRef = useRef<HTMLDetailsElement>(null);
  const prevPendingBookingRequests = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/bookings", { method: "GET" });
        const data = (await res.json()) as
          | { ok: true; bookings?: Array<{ status?: string }> }
          | { ok: false; error: string };
        if (!res.ok || data.ok !== true) {
          if (!cancelled) setPendingBookingRequests(0);
          return;
        }
        const count = (data.bookings ?? []).filter(
          (b) => b?.status === "pending",
        ).length;
        if (!cancelled) setPendingBookingRequests(count);
      } catch {
        if (!cancelled) setPendingBookingRequests(0);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sortedAppointments.length, dashboardTeacherId]);

  useLayoutEffect(() => {
    const el = bookingRequestsDetailsRef.current;
    if (!el) return;
    const prev = prevPendingBookingRequests.current;
    prevPendingBookingRequests.current = pendingBookingRequests;
    if (pendingBookingRequests > 0 && (prev === null || prev === 0)) {
      el.open = true;
    }
    if (
      prev !== null &&
      prev > 0 &&
      pendingBookingRequests === 0
    ) {
      el.open = false;
    }
  }, [pendingBookingRequests]);

  const hasHomeData = useMemo(
    () =>
      sortedClients.length > 0 ||
      sortedAppointments.length > 0 ||
      pendingBookingRequests > 0,
    [sortedClients.length, sortedAppointments.length, pendingBookingRequests],
  );

  const showMainDashboardSection =
    !dataReady || hasHomeData || !isStorageEmpty;

  return (
    <main className={ui.pageMain}>
      <header className={ui.header}>
        <h1 className={ui.pageTitle}>{displayTitle}</h1>
        <p className={`${ui.pageSubtitle} hidden md:block`}>
          {appTagline(preset)}
        </p>
      </header>

      <div className={ui.pageStack}>
        <OwnerOnboardingBanner />
        <div className="flex flex-col gap-3">
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
          {availabilityLoadError ? (
            <DataLoadErrorBanner
              title={availabilityLoadError}
              description={heUi.data.loadFailedHint}
              onRetry={retryAvailabilityLoad}
            />
          ) : null}
          {availabilitySyncError ? (
            <DataLoadErrorBanner
              title={availabilitySyncError}
              description={heUi.data.syncFailedHint}
              onRetry={retryAvailabilitySync}
            />
          ) : null}
        </div>
        {demoActive ? (
          <section className="rounded-xl border border-violet-200 bg-violet-50/80 px-4 py-3 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-violet-900">
                  {heUi.demo.activeBadge}
                </p>
                <p className="text-sm text-violet-900/90">
                  {heUi.demo.activeDescription}
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <button
                  type="button"
                  className="inline-flex min-h-[2.5rem] items-center justify-center rounded-lg border border-violet-300 bg-white px-3 py-1.5 text-sm font-medium text-violet-900 transition hover:bg-violet-100"
                  onClick={handleRequestLoadDemo}
                >
                  {heUi.demo.reloadDemo}
                </button>
                <button
                  type="button"
                  className="inline-flex min-h-[2.5rem] items-center justify-center rounded-lg border border-violet-300 bg-white px-3 py-1.5 text-sm font-medium text-violet-900 transition hover:bg-violet-100"
                  onClick={() => setDemoResetOpen(true)}
                >
                  {heUi.demo.returnToEmpty}
                </button>
              </div>
            </div>
          </section>
        ) : null}

        {!onboardingDismissed ? (
          <FirstRunOnboarding
            hasClient={sortedClients.length > 0}
            hasAppointment={sortedAppointments.length > 0}
            remindersReviewed={remindersReviewed}
            onMarkRemindersReviewed={() => {
              const next = { dismissed: false, remindersReviewed: true };
              saveFirstRunOnboardingState(next);
              setRemindersReviewed(true);
            }}
            onDismiss={() => {
              const next = { dismissed: true, remindersReviewed };
              saveFirstRunOnboardingState(next);
              setOnboardingDismissed(true);
            }}
          />
        ) : null}

        {isStorageEmpty && !hasHomeData ? (
          <section
            className={ui.section}
            id={ONBOARDING_ANCHORS.summary}
          >
            <EmptyState
              tone="muted"
              className="border border-dashed border-neutral-300 bg-white py-6 dark:border-neutral-700 dark:bg-neutral-800 sm:py-8"
              title={heUi.demo.bannerTitle}
              description={heUi.demo.bannerDescription}
            />
            <div className="mt-4 flex justify-center sm:mt-5">
              <button
                type="button"
                onClick={handleRequestLoadDemo}
                className="min-h-[2.5rem] w-full rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-neutral-800 active:scale-[0.99] dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 sm:w-auto sm:text-base"
              >
                {heUi.demo.load}
              </button>
            </div>
          </section>
        ) : null}

        {showMainDashboardSection ? (
          <section id={ONBOARDING_ANCHORS.summary} className={ui.section}>
            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 sm:text-lg">{heUi.sections.summary}</h2>
            {!dataReady ? (
              <InlineLoading className="py-6" />
            ) : (
              <>
                <BusinessKpiStrip appointments={sortedAppointments} />
                <div className="mt-4 sm:mt-6">
                  <AnalyticsSummaryWidget 
                    appointments={sortedAppointments}
                    clients={sortedClients}
                  />
                </div>
                <div className="mt-4 sm:mt-6">
                  <HomeQuickDashboard
                    appointments={sortedAppointments}
                    clients={sortedClients}
                    pendingBookingRequests={pendingBookingRequests}
                    lessonLabelPlural={preset.labels.lessons}
                    reminderWorkflow={{
                      remindersEnabled: settings.remindersEnabled,
                      reminderTomorrow: settings.reminderTomorrow,
                      reminderSameDay: settings.reminderSameDay,
                      reminderPaymentUnpaid: settings.reminderPaymentUnpaid,
                      reminderTemplate: settings.reminderTemplate,
                      sameDayReminderTemplate: settings.sameDayReminderTemplate,
                      paymentReminderTemplate: settings.paymentReminderTemplate,
                      businessName: settings.businessName,
                      businessPhone: settings.businessPhone,
                    }}
                    onReminderCopied={() => toast(heUi.toast.reminderCopied)}
                    onQuickAddClient={() => {
                      router.push("/clients");
                    }}
                    onQuickAddAppointment={() => {
                      router.push("/appointments");
                    }}
                  />
                </div>
                <details className="mt-4 rounded-xl border border-neutral-200/80 bg-neutral-50/50 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800/50 sm:mt-5 sm:px-4">
                  <summary className="cursor-pointer list-none py-2 text-xs font-semibold text-neutral-800 dark:text-neutral-200 sm:text-sm [&::-webkit-details-marker]:hidden">
                    {heUi.dashboard.exportToolsSummary}
                  </summary>
                  <div className="space-y-3 border-t border-neutral-200/70 pb-2 pt-3 dark:border-neutral-700 sm:space-y-4 sm:pt-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                      <button
                        type="button"
                        className="inline-flex min-h-[2.75rem] items-center justify-center rounded-lg border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-800 shadow-sm transition hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700"
                        onClick={() => {
                          if (sortedClients.length === 0) {
                            toast(heUi.export.noStudentsToExport, "error");
                            return;
                          }
                          exportStudentsCsv(sortedClients);
                          toast(heUi.toast.exportStudents);
                        }}
                      >
                        {heUi.export.students}
                      </button>
                    </div>
                    <ExportLessonsPanel
                      appointments={sortedAppointments}
                      clients={sortedClients}
                    />
                  </div>
                </details>
              </>
            )}
          </section>
        ) : null}

        <details
          ref={bookingRequestsDetailsRef}
          className="rounded-xl border border-neutral-200/80 bg-white/50 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800/50 sm:px-4 sm:py-3"
        >
          <summary className="cursor-pointer list-none py-1 text-base font-semibold text-neutral-900 dark:text-neutral-100 sm:text-lg [&::-webkit-details-marker]:hidden">
            <span className="flex items-center justify-between gap-2 sm:gap-3">
              <span>{heUi.dashboard.bookingRequestsTitle}</span>
              {pendingBookingRequests > 0 ? (
                <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-900 tabular-nums dark:bg-violet-900 dark:text-violet-100 sm:px-2.5 sm:text-sm">
                  {pendingBookingRequests}
                </span>
              ) : null}
            </span>
          </summary>
          <div className="mt-2 border-t border-neutral-200/80 pt-2 dark:border-neutral-700 sm:mt-3 sm:pt-3">
            <BookingRequestsPanel embedded />
          </div>
        </details>
      </div>
    </main>
  );
}
