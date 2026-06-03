"use client";

import Link from "next/link";

import { Button } from "@/components/ui/Button";
import {
  formatBookingDateHe,
  formatBookingStartTimeHe,
  publicFlowWhatsAppHref,
} from "@/lib/booking/publicBookingWhatsApp";
import { cn } from "@/lib/cn";

export interface BookingSuccessProps {
  slotStart: string;
  slotEnd: string;
  serviceName?: string | null;
  instructorPhone: string;
  onBookAnother: () => void;
  accentColor?: string | null;
}

export function BookingSuccess({
  slotStart,
  slotEnd: _slotEnd,
  serviceName,
  instructorPhone,
  onBookAnother,
  accentColor,
}: BookingSuccessProps) {
  const dateFormatted = formatBookingDateHe(slotStart);
  const timeFormatted = formatBookingStartTimeHe(slotStart);
  const wa = publicFlowWhatsAppHref(instructorPhone, slotStart, serviceName);

  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-white via-emerald-50/50 to-white p-6 shadow-lg shadow-emerald-900/5 dark:border-emerald-800/50 dark:from-emerald-950/40 dark:via-emerald-950/25 dark:to-stone-950",
      )}
      aria-live="polite"
    >
      <div className="flex gap-4">
        <div
          className={cn(
            "flex size-14 shrink-0 items-center justify-center rounded-full text-2xl font-bold text-white shadow-md",
            !accentColor && "bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-900/20",
          )}
          style={
            accentColor
              ? {
                  background: `linear-gradient(135deg, ${accentColor}, #0d9488)`,
                }
              : undefined
          }
          aria-hidden
        >
          ✓
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            נרשמתם בהצלחה
          </p>
          <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
            הבקשה נקלטה
          </h2>
          <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
            שלחנו את פרטי התור — המוסד יאשר בקרוב.
          </p>
        </div>
      </div>

      <dl className="mt-6 space-y-3 rounded-xl border border-neutral-100 bg-white/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/50">
        {serviceName ? (
          <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between">
            <dt className="text-xs font-medium text-neutral-500">שירות</dt>
            <dd className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              {serviceName}
            </dd>
          </div>
        ) : null}
        <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between">
          <dt className="text-xs font-medium text-neutral-500">תאריך</dt>
          <dd className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            {dateFormatted || "—"}
          </dd>
        </div>
        <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between">
          <dt className="text-xs font-medium text-neutral-500">שעה</dt>
          <dd className="text-sm font-semibold text-neutral-900 dark:text-neutral-100" dir="ltr">
            {timeFormatted || "—"}
          </dd>
        </div>
      </dl>

      <div className="mt-6 flex flex-col gap-3">
        {wa ? (
          <Link
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "inline-flex min-h-[48px] w-full items-center justify-center rounded-xl border-2 border-emerald-600 bg-gradient-to-r from-emerald-600 to-emerald-700 px-5 text-base font-semibold text-white shadow-lg shadow-emerald-900/20 transition hover:from-emerald-700 hover:to-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 active:scale-[0.98] dark:border-emerald-500 dark:from-emerald-500 dark:to-emerald-600",
            )}
          >
            שלח לי לוואטסאפ
          </Link>
        ) : null}
        <Button
          type="button"
          variant="secondary"
          className="min-h-[48px] w-full"
          onClick={onBookAnother}
        >
          קביעת תור נוסף
        </Button>
      </div>
    </section>
  );
}
