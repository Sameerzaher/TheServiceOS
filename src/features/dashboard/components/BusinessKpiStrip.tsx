"use client";

import { heUi } from "@/config";
import { ui } from "@/components/ui";
import { formatIls } from "@/core/utils/currency";
import {
  countTodayAppointments,
  sumTodayExpectedCollections,
  totalOutstandingDebt,
} from "@/core/utils/insights";
import type { AppointmentRecord } from "@/core/types/appointment";
import { cn } from "@/lib/cn";

export function BusinessKpiStrip({
  appointments,
  reference = new Date(),
}: {
  appointments: readonly AppointmentRecord[];
  reference?: Date;
}) {
  const today = countTodayAppointments(appointments, reference);
  const expected = sumTodayExpectedCollections(appointments, reference);
  const balance = totalOutstandingDebt(appointments);

  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-3 sm:grid-cols-3",
        "rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/90 to-white p-4 shadow-sm dark:border-emerald-900/50 dark:from-emerald-950/40 dark:to-neutral-900 sm:p-5",
      )}
    >
      <div className={cn(ui.statCard, "border-0 bg-white/80 shadow-none dark:bg-neutral-800/60")}>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
          {heUi.dashboardKpi.todayAppointments}
        </p>
        <p className="mt-2 text-2xl font-bold tabular-nums text-neutral-900 dark:text-neutral-100">
          {today}
        </p>
      </div>
      <div className={cn(ui.statCard, "border-0 bg-white/80 shadow-none dark:bg-neutral-800/60")}>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
          {heUi.dashboardKpi.expectedIncome}
        </p>
        <p className="mt-2 text-2xl font-bold tabular-nums text-teal-800 dark:text-teal-200">
          {formatIls(expected)}
        </p>
      </div>
      <div className={cn(ui.statCard, "border-0 bg-amber-50/90 shadow-none dark:bg-amber-950/30")}>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-900/90 dark:text-amber-200/90">
          {heUi.dashboardKpi.unpaidBalance}
        </p>
        <p className="mt-2 text-2xl font-bold tabular-nums text-amber-950 dark:text-amber-100">
          {formatIls(balance)}
        </p>
      </div>
    </div>
  );
}
