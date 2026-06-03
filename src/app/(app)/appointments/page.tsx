"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import {
  appPageTitle,
  heUi,
} from "@/config";
import {
  DataLoadErrorBanner,
  InlineLoading,
  ui,
  useToast,
} from "@/components/ui";
import { AppointmentFiltersBar } from "@/features/appointments/components/AppointmentFiltersBar";
import { AppointmentForm } from "@/features/appointments/components/AppointmentForm";
import { AppointmentList } from "@/features/appointments/components/AppointmentList";
import { AppointmentCalendar } from "@/features/calendar/components/AppointmentCalendar";
import { useServiceApp } from "@/features/app/ServiceAppProvider";
import { cn } from "@/lib/cn";
import { ONBOARDING_ANCHORS } from "@/features/onboarding/components/FirstRunOnboarding";

function AppointmentsPageContent() {
  const toast = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const {
    preset,
    settings,
    sortedClients,
    sortedAppointments,
    appointmentsReady,
    appointmentsLoadError,
    appointmentsSyncError,
    retryAppointmentsLoad,
    retryAppointmentsSync,
    dateFilter,
    setDateFilter,
    paymentFilter,
    setPaymentFilter,
    appointmentSort,
    setAppointmentSort,
    clientFilter,
    setClientFilter,
    customDateRange,
    setCustomDateRange,
    filteredAppointments,
    editingAppointmentId,
    setEditingAppointmentId,
    appointmentPrefillClientId,
    setAppointmentPrefillClientId,
    editingAppointment,
    handleCycleAppointmentPayment,
    handleApprovePublicBooking,
    handleApproveAndSendPublicBookingWhatsapp,
    handleRejectPublicBooking,
    handleChangeAppointmentStatus,
    setConfirm,
    addAppointment,
    updateAppointment,
    needsFirstAppointment,
  } = useServiceApp();

  useEffect(() => {
    const edit = searchParams.get("edit");
    if (edit) {
      setEditingAppointmentId(edit);
      setAppointmentPrefillClientId(null);
      return;
    }
    const raw = searchParams.get("prefillClient");
    if (raw) {
      setAppointmentPrefillClientId(raw);
      setEditingAppointmentId(null);
    }
  }, [searchParams, setAppointmentPrefillClientId, setEditingAppointmentId]);

  const displayTitle =
    settings.businessName.trim() || appPageTitle(preset);

  return (
    <main className={ui.pageMain}>
      <header className={ui.header}>
        <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 sm:text-2xl">{displayTitle}</h1>
        <p className="text-xs text-neutral-600 dark:text-neutral-400 sm:text-sm">{preset.labels.lessons}</p>
      </header>

      <div className={ui.pageStack}>
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
        <section
          id={ONBOARDING_ANCHORS.lessonForm}
          className={cn(
            ui.section,
            needsFirstAppointment &&
              "scroll-mt-6 rounded-xl ring-2 ring-amber-400/90 ring-offset-2 ring-offset-neutral-50",
          )}
        >
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 sm:text-lg">
            {editingAppointmentId
              ? heUi.forms.editLesson
              : preset.labels.addLesson}
          </h2>
          <AppointmentForm
            key={editingAppointmentId ?? "new-appointment"}
            preset={preset}
            clients={sortedClients}
            initialAppointment={editingAppointment}
            defaultAmount={settings.defaultLessonPrice}
            defaultLessonDurationMinutes={
              settings.defaultLessonDurationMinutes
            }
            prefillClientId={appointmentPrefillClientId}
            onCancelEdit={() => {
              setEditingAppointmentId(null);
              setAppointmentPrefillClientId(null);
            }}
            onSubmit={(data) => {
              if (editingAppointmentId) {
                updateAppointment(editingAppointmentId, data);
                setEditingAppointmentId(null);
                toast(heUi.toast.lessonUpdated);
              } else {
                const row = addAppointment(data);
                if (!row) {
                  toast(heUi.toast.actionFailed, "error");
                  return;
                }
                setAppointmentPrefillClientId(null);
                toast(heUi.toast.lessonCreated);
              }
            }}
          />
        </section>

        <section className={ui.section}>
          <div className="mb-3 flex flex-col gap-3 sm:mb-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 sm:text-lg">{preset.labels.lessons}</h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={cn(
                  "flex-1 rounded-lg px-3 py-2 text-xs font-medium transition sm:flex-none sm:px-4 sm:text-sm",
                  viewMode === "list"
                    ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                    : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                )}
              >
                📋 רשימה
              </button>
              <button
                type="button"
                onClick={() => setViewMode("calendar")}
                className={cn(
                  "flex-1 rounded-lg px-3 py-2 text-xs font-medium transition sm:flex-none sm:px-4 sm:text-sm",
                  viewMode === "calendar"
                    ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                    : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                )}
              >
                📅 לוח שנה
              </button>
            </div>
          </div>
          {!appointmentsReady ? (
            <InlineLoading className="py-2" />
          ) : viewMode === "calendar" ? (
            <AppointmentCalendar
              appointments={filteredAppointments}
              clients={sortedClients}
              onSelectEvent={(id) => setEditingAppointmentId(id)}
              onSelectSlot={(start, end) => {
                setEditingAppointmentId(null);
                setAppointmentPrefillClientId(null);
              }}
            />
          ) : (
            <>
              <AppointmentFiltersBar
                dateFilter={dateFilter}
                onDateFilterChange={setDateFilter}
                paymentFilter={paymentFilter}
                onPaymentFilterChange={setPaymentFilter}
                sort={appointmentSort}
                onSortChange={setAppointmentSort}
                clientFilter={clientFilter}
                onClientFilterChange={setClientFilter}
                clients={sortedClients}
                customDateRange={customDateRange}
                onCustomDateRangeChange={setCustomDateRange}
                className="mb-3 sm:mb-4"
              />
              <AppointmentList
                appointments={filteredAppointments}
                totalAppointmentCount={sortedAppointments.length}
                clients={sortedClients}
                preset={preset}
                highlightedAppointmentId={editingAppointmentId}
                reminderTemplate={settings.reminderTemplate}
                businessName={settings.businessName}
                businessPhone={settings.businessPhone}
                onCyclePayment={handleCycleAppointmentPayment}
                onReschedule={(id) => {
                  router.push(
                    `/appointments?edit=${encodeURIComponent(id)}`,
                  );
                }}
                onRequestDelete={(id) =>
                  setConfirm({ kind: "appointment", id })
                }
                onEdit={(id) => {
                  setEditingAppointmentId(id);
                  setAppointmentPrefillClientId(null);
                  router.replace(
                    `/appointments?edit=${encodeURIComponent(id)}`,
                    { scroll: false },
                  );
                }}
                onApproveRequest={handleApprovePublicBooking}
                onApproveAndSendWhatsapp={handleApproveAndSendPublicBookingWhatsapp}
                onRejectRequest={handleRejectPublicBooking}
                onChangeStatus={handleChangeAppointmentStatus}
              />
            </>
          )}
        </section>
      </div>
    </main>
  );
}

export default function AppointmentsPage() {
  return (
    <Suspense
      fallback={
        <main className={ui.pageMain}>
          <div className="flex min-h-[40vh] items-center justify-center px-4">
            <InlineLoading />
          </div>
        </main>
      }
    >
      <AppointmentsPageContent />
    </Suspense>
  );
}
