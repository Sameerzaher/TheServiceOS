"use client";

import { heUi } from "@/config";
import { ui } from "@/components/ui";
import type { AppointmentDateFilter } from "@/core/utils/dateRange";
import type {
  AppointmentSort,
  PaymentFilter,
} from "@/core/utils/appointmentFilters";
import { cn } from "@/lib/cn";

export interface AppointmentFiltersBarProps {
  dateFilter: AppointmentDateFilter;
  onDateFilterChange: (next: AppointmentDateFilter) => void;
  paymentFilter: PaymentFilter;
  onPaymentFilterChange: (next: PaymentFilter) => void;
  sort: AppointmentSort;
  onSortChange: (next: AppointmentSort) => void;
  clientFilter?: string;
  onClientFilterChange?: (clientId: string) => void;
  clients?: Array<{ id: string; fullName: string }>;
  customDateRange?: { start: string; end: string } | null;
  onCustomDateRangeChange?: (range: { start: string; end: string } | null) => void;
  className?: string;
}

const dateOptions: { value: AppointmentDateFilter; label: string }[] = [
  { value: "all", label: heUi.filters.dateAll },
  { value: "today", label: heUi.filters.dateToday },
  { value: "tomorrow", label: heUi.filters.dateTomorrow },
  { value: "this_week", label: heUi.filters.dateThisWeek },
  { value: "custom", label: "טווח מותאם אישית" },
];

const paymentOptions: { value: PaymentFilter; label: string }[] = [
  { value: "all", label: heUi.filters.paymentAll },
  { value: "paid", label: heUi.filters.paymentPaid },
  { value: "unpaid", label: heUi.filters.paymentUnpaid },
];

const sortOptions: { value: AppointmentSort; label: string }[] = [
  { value: "date", label: heUi.filters.sortByDate },
  { value: "name", label: heUi.filters.sortByName },
];

export function AppointmentFiltersBar({
  dateFilter,
  onDateFilterChange,
  paymentFilter,
  onPaymentFilterChange,
  sort,
  onSortChange,
  clientFilter = "",
  onClientFilterChange,
  clients = [],
  customDateRange,
  onCustomDateRangeChange,
  className,
}: AppointmentFiltersBarProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-3 rounded-xl border border-emerald-100/80 bg-emerald-50/35 p-3 shadow-sm shadow-emerald-900/5 ring-1 ring-emerald-900/[0.03] dark:border-emerald-900 dark:bg-emerald-950/20 sm:grid-cols-2 sm:gap-4 sm:p-4 lg:grid-cols-4",
        className,
      )}
    >
      <div className="min-w-0">
        <label htmlFor="filter-date" className={cn(ui.label, "text-xs sm:text-sm")}>
          {heUi.forms.appointmentDate}
        </label>
        <select
          id="filter-date"
          value={dateFilter}
          onChange={(e) =>
            onDateFilterChange(e.target.value as AppointmentDateFilter)
          }
          className={cn(ui.select, "text-xs sm:text-sm")}
        >
          {dateOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {dateFilter === "custom" && onCustomDateRangeChange && (
        <>
          <div className="min-w-0">
            <label htmlFor="filter-date-start" className={cn(ui.label, "text-xs sm:text-sm")}>
              מתאריך
            </label>
            <input
              id="filter-date-start"
              type="date"
              value={customDateRange?.start || ""}
              onChange={(e) =>
                onCustomDateRangeChange({
                  start: e.target.value,
                  end: customDateRange?.end || e.target.value,
                })
              }
              className={cn(ui.input, "text-xs sm:text-sm")}
            />
          </div>
          <div className="min-w-0">
            <label htmlFor="filter-date-end" className={cn(ui.label, "text-xs sm:text-sm")}>
              עד תאריך
            </label>
            <input
              id="filter-date-end"
              type="date"
              value={customDateRange?.end || ""}
              onChange={(e) =>
                onCustomDateRangeChange({
                  start: customDateRange?.start || e.target.value,
                  end: e.target.value,
                })
              }
              className={cn(ui.input, "text-xs sm:text-sm")}
            />
          </div>
        </>
      )}

      {onClientFilterChange && clients.length > 0 && (
        <div className="min-w-0">
          <label htmlFor="filter-client" className={cn(ui.label, "text-xs sm:text-sm")}>
            סינון לפי תלמיד
          </label>
          <select
            id="filter-client"
            value={clientFilter}
            onChange={(e) => onClientFilterChange(e.target.value)}
            className={cn(ui.select, "text-xs sm:text-sm")}
          >
            <option value="">כל התלמידים</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.fullName}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="min-w-0">
        <label htmlFor="filter-payment" className={cn(ui.label, "text-xs sm:text-sm")}>
          {heUi.forms.paymentStatus}
        </label>
        <select
          id="filter-payment"
          value={paymentFilter}
          onChange={(e) =>
            onPaymentFilterChange(e.target.value as PaymentFilter)
          }
          className={cn(ui.input, "text-xs sm:text-sm")}
        >
          {paymentOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <div className="min-w-0">
        <label htmlFor="filter-sort" className={cn(ui.label, "text-xs sm:text-sm")}>
          {heUi.filters.sort}
        </label>
        <select
          id="filter-sort"
          value={sort}
          onChange={(e) => onSortChange(e.target.value as AppointmentSort)}
          className={cn(ui.select, "text-xs sm:text-sm")}
        >
          {sortOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
