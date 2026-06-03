"use client";

import { useCallback, useRef, useState } from "react";

import { heUi } from "@/config";
import { Button, EmptyState, ui, useToast } from "@/components/ui";
import type { AppointmentRecord } from "@/core/types/appointment";
import type { Client } from "@/core/types/client";
import {
  filterAppointmentsForExport,
  type PaymentFilter,
} from "@/core/utils/appointmentFilters";
import { exportServiceosLessonsCsv } from "@/features/export/csvExport";
import { cn } from "@/lib/cn";

export interface ExportLessonsPanelProps {
  appointments: readonly AppointmentRecord[];
  clients: readonly Client[];
  className?: string;
}

const PAYMENT_OPTIONS: { value: PaymentFilter; label: string }[] = [
  { value: "all", label: heUi.filters.paymentAll },
  { value: "paid", label: heUi.filters.paymentPaid },
  { value: "unpaid", label: heUi.filters.paymentUnpaid },
];

export function ExportLessonsPanel({
  appointments,
  clients,
  className,
}: ExportLessonsPanelProps) {
  const toast = useToast();
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("all");
  const [isExporting, setIsExporting] = useState(false);
  const exportLock = useRef(false);

  const runExport = useCallback(() => {
    if (exportLock.current) return;
    if (appointments.length === 0) {
      toast(heUi.export.noLessonsToExport, "error");
      return;
    }

    const from = dateFrom.trim();
    const to = dateTo.trim();
    if (from && to && from > to) {
      toast(heUi.export.invalidDateRange, "error");
      return;
    }

    const filtered = filterAppointmentsForExport(appointments, {
      dateFrom: from,
      dateTo: to,
      paymentFilter,
    });

    if (filtered.length === 0) {
      toast(heUi.export.noLessonsToExport, "error");
      return;
    }

    exportLock.current = true;
    setIsExporting(true);
    try {
      const sorted = [...filtered].sort(
        (a, b) =>
          new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
      );

      exportServiceosLessonsCsv(sorted, [...clients]);
      toast(heUi.toast.exportLessons);
    } finally {
      window.setTimeout(() => {
        exportLock.current = false;
        setIsExporting(false);
      }, 400);
    }
  }, [appointments, clients, dateFrom, dateTo, paymentFilter, toast]);

  const noData = appointments.length === 0;

  return (
    <div
      className={cn(
        ui.formCard,
        "space-y-5 border border-neutral-200/90 sm:space-y-4",
        className,
      )}
    >
      <div>
        <h3 className="text-base font-semibold text-neutral-900">
          {heUi.export.lessonsTitle}
        </h3>
        <p className="mt-1 text-sm text-neutral-600">{heUi.export.lessonsHint}</p>
      </div>

      {noData ? (
        <EmptyState
          tone="muted"
          title={heUi.export.noLessonsToExport}
          className="py-8"
        />
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="export-date-from" className={ui.label}>
            {heUi.export.dateFrom}
          </label>
          <input
            id="export-date-from"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className={ui.input}
            disabled={noData || isExporting}
          />
        </div>
        <div>
          <label htmlFor="export-date-to" className={ui.label}>
            {heUi.export.dateTo}
          </label>
          <input
            id="export-date-to"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className={ui.input}
            disabled={noData || isExporting}
          />
        </div>
      </div>

      <div>
        <label htmlFor="export-payment" className={ui.label}>
          {heUi.export.paymentFilterLabel}
        </label>
        <select
          id="export-payment"
          value={paymentFilter}
          onChange={(e) =>
            setPaymentFilter(e.target.value as PaymentFilter)
          }
          className={ui.select}
          disabled={noData || isExporting}
        >
          {PAYMENT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <Button
        type="button"
        variant="secondary"
        onClick={runExport}
        disabled={noData || isExporting}
        aria-busy={isExporting}
      >
        {isExporting ? heUi.export.exporting : heUi.export.exportCsv}
      </Button>
    </div>
  );
}
