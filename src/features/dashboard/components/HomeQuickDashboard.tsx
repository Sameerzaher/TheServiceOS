"use client";

import Link from "next/link";
import { useMemo } from "react";

import { heUi } from "@/config";
import { Button, EmptyState, ui } from "@/components/ui";
import { getTomorrowAppointments, isLocalCalendarDay } from "@/core/reminders";
import { PaymentStatus, type AppointmentRecord } from "@/core/types/appointment";
import type { Client } from "@/core/types/client";
import type { ReminderWorkflowSettings } from "@/features/dashboard/components/RemindersPanel";
import { RemindersPanel } from "@/features/dashboard/components/RemindersPanel";
import { cn } from "@/lib/cn";

export interface HomeQuickDashboardProps {
  appointments: AppointmentRecord[];
  clients: Client[];
  pendingBookingRequests: number;
  lessonLabelPlural: string;
  reminderWorkflow: ReminderWorkflowSettings;
  onReminderCopied?: () => void;
  onQuickAddClient: () => void;
  onQuickAddAppointment: () => void;
}

function formatTimeShort(iso: string): string {
  try {
    return new Intl.DateTimeFormat("he-IL", { timeStyle: "short" }).format(
      new Date(iso),
    );
  } catch {
    return "";
  }
}

function clientName(clients: Client[], id: string): string {
  return clients.find((c) => c.id === id)?.fullName ?? "—";
}

export function HomeQuickDashboard({
  appointments,
  clients,
  pendingBookingRequests,
  lessonLabelPlural,
  reminderWorkflow,
  onReminderCopied,
  onQuickAddClient,
  onQuickAddAppointment,
}: HomeQuickDashboardProps) {
  const reference = useMemo(() => new Date(), []);

  const { todayRows, tomorrowCount, unpaidCount } = useMemo(() => {
    const today = appointments
      .filter((a) => isLocalCalendarDay(a.startAt, reference))
      .sort(
        (a, b) =>
          new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
      );
    const tomorrow = getTomorrowAppointments(appointments, reference);
    const unpaid = appointments.filter(
      (a) => a.paymentStatus === PaymentStatus.Unpaid,
    );
    return {
      todayRows: today,
      tomorrowCount: tomorrow.length,
      unpaidCount: unpaid.length,
    };
  }, [appointments, reference]);

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="rounded-xl border border-neutral-200 bg-white p-3 shadow-sm dark:border-neutral-700 dark:bg-neutral-800 sm:p-4">
        <p className="text-xs font-medium text-neutral-800 dark:text-neutral-200 sm:text-sm">
          {heUi.dashboard.quickActionsTitle}
        </p>
        <div className="mt-2.5 grid grid-cols-1 gap-2 sm:mt-3 sm:grid-cols-2">
          <Button type="button" variant="primary" onClick={onQuickAddClient} className="text-xs sm:text-sm">
            {heUi.dashboard.quickAddClient}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={onQuickAddAppointment}
            className="text-xs sm:text-sm"
          >
            {heUi.dashboard.quickAddAppointment}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <div className={cn(ui.statCard, "p-3 sm:p-4")}>
          <p className="text-[10px] font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400 sm:text-xs">
            {heUi.dashboard.kpiClients}
          </p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-neutral-900 dark:text-neutral-100 sm:mt-1.5 sm:text-2xl">
            {clients.length}
          </p>
        </div>
        <div className={cn(ui.statCard, "p-3 sm:p-4")}>
          <p className="text-[10px] font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400 sm:text-xs">
            {heUi.dashboard.kpiAppointmentsTotal}
          </p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-neutral-900 dark:text-neutral-100 sm:mt-1.5 sm:text-2xl">
            {appointments.length}
          </p>
        </div>
        <div className={cn(ui.statCard, "p-3 sm:p-4")}>
          <p className="text-[10px] font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400 sm:text-xs">
            {heUi.dashboard.kpiPendingBookings}
          </p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-violet-800 dark:text-violet-400 sm:mt-1.5 sm:text-2xl">
            {pendingBookingRequests}
          </p>
        </div>
        <div className={cn(ui.statCard, "p-3 sm:p-4")}>
          <p className="text-[10px] font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400 sm:text-xs">
            {heUi.dashboard.kpiToday}
          </p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-neutral-900 dark:text-neutral-100 sm:mt-1.5 sm:text-2xl">
            {todayRows.length}
          </p>
        </div>
      </div>

      <section className="space-y-2 sm:space-y-3">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 sm:text-base">
          {heUi.dashboard.todaySectionTitle(lessonLabelPlural)}
        </h3>
        {todayRows.length === 0 ? (
          <EmptyState
            tone="muted"
            className="py-6 sm:py-8"
            title={heUi.dashboard.emptyTodayTitle(lessonLabelPlural)}
            description={heUi.dashboard.emptyTodayDescription}
          />
        ) : (
          <ul className="flex flex-col gap-2">
            {todayRows.map((appt) => (
              <li
                key={appt.id}
                className={cn(ui.card, ui.cardPadding, "flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4")}
              >
                <Link
                  href={`/clients/${appt.clientId}`}
                  className="text-sm font-medium text-neutral-900 underline-offset-2 hover:underline dark:text-neutral-100"
                >
                  {clientName(clients, appt.clientId)}
                </Link>
                <div className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400 sm:text-sm">
                  <span>{formatTimeShort(appt.startAt)}</span>
                  {appt.paymentStatus === PaymentStatus.Unpaid ? (
                    <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-900 dark:bg-amber-900 dark:text-amber-100 sm:text-xs">
                      {heUi.dashboard.unpaidBadge}
                    </span>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-2 sm:space-y-3">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 sm:text-base">
          {heUi.dashboard.remindersSectionTitle}
        </h3>
        <RemindersPanel
          appointments={appointments}
          clients={clients}
          workflow={reminderWorkflow}
          onCopied={onReminderCopied}
        />
      </section>
    </div>
  );
}

