"use client";

import Link from "next/link";
import { useMemo } from "react";

import { heUi } from "@/config";
import { lessonWords, studentWords } from "@/config/verticalLabels";
import { Button, EmptyState, ui } from "@/components/ui";
import {
  AppointmentStatus,
  PaymentStatus,
  type AppointmentId,
  type AppointmentRecord,
} from "@/core/types/appointment";
import type { Client } from "@/core/types/client";
import type { VerticalPreset } from "@/core/types/vertical";
import {
  isLocalCalendarDay,
  isTomorrowAppointment,
} from "@/core/reminders/tomorrow";
import { formatIls } from "@/core/utils/currency";
import {
  countClientsWithDebt,
  sumPaidTotal,
  sumPartialAmount,
  sumTodayPaidRevenue,
  sumUnpaidDebt,
  sumWeekPaidRevenue,
  topClientsByDebt,
  isPaidStatus,
} from "@/core/utils/insights";
import { cn } from "@/lib/cn";

export interface DashboardProps {
  appointments: AppointmentRecord[];
  clients: Client[];
  preset: VerticalPreset;
  /** When set, rows show mark paid / unpaid like the main lesson list. */
  onTogglePaid?: (id: AppointmentId) => void;
}

function isSameLocalDay(iso: string, reference: Date): boolean {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  return (
    d.getFullYear() === reference.getFullYear() &&
    d.getMonth() === reference.getMonth() &&
    d.getDate() === reference.getDate()
  );
}

function clientName(clients: Client[], id: string): string {
  return clients.find((c) => c.id === id)?.fullName ?? "—";
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

function formatStartAtMedium(iso: string): string {
  try {
    return new Intl.DateTimeFormat("he-IL", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function upcomingLessons(
  appointments: AppointmentRecord[],
  reference: Date,
  limit: number,
): AppointmentRecord[] {
  const now = reference.getTime();
  return appointments
    .filter((a) => {
      const t = new Date(a.startAt).getTime();
      if (Number.isNaN(t) || t <= now) return false;
      if (a.status === AppointmentStatus.Cancelled) return false;
      return true;
    })
    .sort(
      (a, b) =>
        new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
    )
    .slice(0, limit);
}

function dayHint(
  appt: AppointmentRecord,
  reference: Date,
): "today" | "tomorrow" | null {
  if (isLocalCalendarDay(appt.startAt, reference)) return "today";
  if (isTomorrowAppointment(appt, reference)) return "tomorrow";
  return null;
}

export function Dashboard({
  appointments,
  clients,
  preset,
  onTogglePaid,
}: DashboardProps) {
  const reference = useMemo(() => new Date(), []);

  const {
    total,
    unpaidCount,
    todayList,
    todayCount,
    totalIncome,
    unpaidAmount,
    todayRevenue,
    weekRevenue,
    studentsWithDebt,
    partialAmount,
    debtLeaders,
    upcoming,
    maxDebt,
  } = useMemo(() => {
    const today = appointments.filter((a) =>
      isSameLocalDay(a.startAt, reference),
    );
    const sortedToday = [...today].sort(
      (a, b) =>
        new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
    );
    const unpaid = appointments.filter(
      (a) => a.paymentStatus === PaymentStatus.Unpaid,
    );
    const leaders = topClientsByDebt(clients, appointments, 5);
    const maxD = leaders[0]?.debt ?? 0;

    return {
      total: appointments.length,
      unpaidCount: unpaid.length,
      todayList: sortedToday,
      todayCount: sortedToday.length,
      totalIncome: sumPaidTotal(appointments),
      unpaidAmount: sumUnpaidDebt(appointments),
      todayRevenue: sumTodayPaidRevenue(appointments, reference),
      weekRevenue: sumWeekPaidRevenue(appointments, reference),
      studentsWithDebt: countClientsWithDebt(clients, appointments),
      partialAmount: sumPartialAmount(appointments),
      debtLeaders: leaders,
      upcoming: upcomingLessons(appointments, reference, 5),
      maxDebt: maxD,
    };
  }, [appointments, reference, clients]);

  const { singular: lessonWord, plural: lessonsWord } = lessonWords(preset);
  const { singular: studentWord, plural: studentsWord } =
    studentWords(preset);

  const secondaryStatClass =
    "rounded-xl border border-neutral-200/90 bg-white p-3.5 shadow-sm sm:p-4";
  const secondaryLabelClass =
    "text-xs font-medium uppercase tracking-wide text-neutral-500 sm:text-[11px]";
  const secondaryValueClass =
    "mt-1.5 text-lg font-semibold tabular-nums text-neutral-900 sm:text-xl";

  return (
    <div className="flex flex-col gap-7 sm:gap-10">
      {/* Primary KPIs — larger numbers */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <div
          className={cn(
            "rounded-xl border border-emerald-200/90 bg-emerald-50/80 p-4 shadow-sm sm:p-5",
          )}
        >
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-800/90">
            {heUi.dashboard.statWeeklyRevenue}
          </p>
          <p className="mt-2.5 text-3xl font-bold tabular-nums leading-none text-emerald-950 sm:text-4xl">
            {formatIls(weekRevenue)}
          </p>
        </div>
        <div
          className={cn(
            "rounded-xl border-2 border-amber-400 bg-amber-50/95 p-4 shadow-md sm:p-5",
          )}
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-900/80">
            {heUi.dashboard.statUnpaidAmount}
          </p>
          <p className="mt-2.5 text-3xl font-bold tabular-nums leading-none text-amber-950 sm:text-4xl">
            {formatIls(unpaidAmount)}
          </p>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            {heUi.dashboard.statTodayRevenue}
          </p>
          <p className="mt-2.5 text-3xl font-bold tabular-nums leading-none text-neutral-900 sm:text-4xl">
            {formatIls(todayRevenue)}
          </p>
        </div>
      </div>

      {/* Secondary metrics */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 sm:gap-4">
        <div className={secondaryStatClass}>
          <p className={secondaryLabelClass}>
            {heUi.dashboard.statTotal(lessonsWord)}
          </p>
          <p className={secondaryValueClass}>{total}</p>
        </div>
        <div className={secondaryStatClass}>
          <p className={secondaryLabelClass}>{heUi.dashboard.statToday}</p>
          <p className={secondaryValueClass}>{todayCount}</p>
        </div>
        <div className={secondaryStatClass}>
          <p className={secondaryLabelClass}>{heUi.dashboard.statUnpaid}</p>
          <p className={cn(secondaryValueClass, "text-amber-800")}>
            {unpaidCount}
          </p>
        </div>
        <div className={secondaryStatClass}>
          <p className={secondaryLabelClass}>
            {heUi.dashboard.statTotalIncome}
          </p>
          <p className={cn(secondaryValueClass, "text-emerald-900")}>
            {formatIls(totalIncome)}
          </p>
        </div>
        <div className={secondaryStatClass}>
          <p className={secondaryLabelClass}>
            {heUi.dashboard.statPartialAmount}
          </p>
          <p className={cn(secondaryValueClass, "text-violet-900")}>
            {formatIls(partialAmount)}
          </p>
        </div>
        <div className={secondaryStatClass}>
          <p className={secondaryLabelClass}>
            {heUi.dashboard.statStudentsWithDebt}
          </p>
          <p className={cn(secondaryValueClass, "text-rose-800")}>
            {studentsWithDebt}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-neutral-200/90 bg-neutral-50/90 p-4 sm:p-5">
        <p className="text-sm leading-relaxed text-neutral-800">
          {heUi.dashboard.summaryParagraph({
            total,
            lessonWord,
            lessonsWord,
            todayCount,
            unpaidCount,
            clientsCount: clients.length,
            studentWord,
            studentsWord,
          })}
        </p>
      </div>

      {/* Debt leaders + upcoming lessons */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <h3 className="mb-3 text-base font-semibold text-neutral-900 sm:text-lg">
            {heUi.dashboard.debtListTitle}
          </h3>
          {debtLeaders.length === 0 ? (
            <EmptyState
              className="py-6 sm:py-8"
              tone="muted"
              title={heUi.dashboard.emptyDebtList}
            />
          ) : (
            <ul className="flex flex-col gap-2">
              {debtLeaders.map((row, index) => {
                const highTier =
                  index === 0 ||
                  (maxDebt > 0 && row.debt >= maxDebt * 0.55);
                const c = row.client;
                const cid = c?.id ?? `debt-${index}`;
                const cname = c?.fullName?.trim() || "—";
                return (
                  <li key={cid}>
                    <Link
                      href={`/clients/${cid}`}
                      className={cn(
                        ui.card,
                        ui.cardPadding,
                        "flex flex-row items-center justify-between gap-3 transition hover:border-neutral-300",
                        highTier
                          ? "border-rose-200 bg-rose-50/90"
                          : "border-neutral-200",
                      )}
                    >
                      <span className="min-w-0 flex-1 font-medium text-neutral-900">
                        {cname}
                      </span>
                      <span
                        className={cn(
                          "shrink-0 tabular-nums text-sm font-semibold sm:text-base",
                          highTier ? "text-rose-900" : "text-neutral-800",
                        )}
                      >
                        {formatIls(row.debt)}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div>
          <h3 className="mb-3 text-base font-semibold text-neutral-900 sm:text-lg">
            {heUi.dashboard.upcomingListTitle}
          </h3>
          {upcoming.length === 0 ? (
            <EmptyState
              className="py-6 sm:py-8"
              tone="muted"
              title={heUi.dashboard.emptyUpcoming}
            />
          ) : (
            <ul className="flex flex-col gap-2">
              {upcoming.map((appt) => {
                const hint = dayHint(appt, reference);
                const paid = isPaidStatus(appt.paymentStatus);
                return (
                  <li key={appt.id}>
                    <div
                      className={cn(
                        ui.card,
                        ui.cardPadding,
                        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/clients/${appt.clientId}`}
                          className="font-medium text-neutral-900 underline-offset-2 hover:underline"
                        >
                          {clientName(clients, appt.clientId)}
                        </Link>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-neutral-600 sm:text-base">
                          {hint === "today" ? (
                            <span className="rounded bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-800">
                              {heUi.filters.dateToday}
                            </span>
                          ) : hint === "tomorrow" ? (
                            <span className="rounded bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-800">
                              {heUi.filters.dateTomorrow}
                            </span>
                          ) : null}
                          <span className="tabular-nums">
                            {formatStartAtMedium(appt.startAt)}
                          </span>
                          {appt.paymentStatus === PaymentStatus.Unpaid ? (
                            <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
                              {heUi.dashboard.unpaidBadge}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      {onTogglePaid ? (
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="shrink-0"
                          aria-pressed={paid}
                          onClick={() => onTogglePaid(appt.id)}
                        >
                          {paid
                            ? heUi.appointments.markUnpaid
                            : heUi.appointments.markPaid}
                        </Button>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-base font-semibold text-neutral-900 sm:text-lg">
          {heUi.dashboard.todaySectionTitle(lessonsWord)}
        </h3>
        {todayList.length === 0 ? (
          <EmptyState
            className="py-8 sm:py-10"
            tone="muted"
            title={heUi.dashboard.emptyTodayTitle(lessonsWord)}
            description={heUi.dashboard.emptyTodayDescription}
          />
        ) : (
          <ul className="flex flex-col gap-2">
            {todayList.map((appt) => {
              const paid = isPaidStatus(appt.paymentStatus);
              return (
                <li
                  key={appt.id}
                  className={cn(
                    "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
                    ui.card,
                    ui.cardPadding,
                  )}
                >
                  <Link
                    href={`/clients/${appt.clientId}`}
                    className="min-w-0 shrink font-medium text-neutral-900 underline-offset-2 hover:underline"
                  >
                    {clientName(clients, appt.clientId)}
                  </Link>
                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <span className="text-sm text-neutral-600 sm:text-base">
                      {formatTimeShort(appt.startAt)}
                    </span>
                    {appt.paymentStatus === PaymentStatus.Unpaid ? (
                      <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
                        {heUi.dashboard.unpaidBadge}
                      </span>
                    ) : null}
                    {onTogglePaid ? (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        aria-pressed={paid}
                        onClick={() => onTogglePaid(appt.id)}
                      >
                        {paid
                          ? heUi.appointments.markUnpaid
                          : heUi.appointments.markPaid}
                      </Button>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
