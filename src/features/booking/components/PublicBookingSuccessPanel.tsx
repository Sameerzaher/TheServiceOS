"use client";

import { heUi } from "@/config";
import { Button } from "@/components/ui/Button";
import { ui } from "@/components/ui/theme";
import { publicInstructorWhatsAppHref } from "@/lib/booking/publicBookingWhatsApp";
import { cn } from "@/lib/cn";

export interface PublicBookingSuccessPanelProps {
  instructorPhone: string;
  slotStart: string;
  slotEnd: string;
  onBookAnother: () => void;
  variant?: "default" | "hilai";
  copyOverrides?: {
    successTitle?: string;
    inlineSuccess?: string;
    whatsappConfirmButton?: string;
    bookAnotherButton?: string;
    successSummaryTitle?: string;
    summaryDate?: string;
    summaryTime?: string;
    addToCalendarSoon?: string;
  };
  /** Date/time labels for booking summary (default Hebrew via `heUi`). */
  timeLocale?: string;
}

export function PublicBookingSuccessPanel({
  instructorPhone,
  slotStart,
  slotEnd,
  onBookAnother,
  variant = "default",
  copyOverrides,
  timeLocale = "he-IL",
}: PublicBookingSuccessPanelProps) {
  const wa = publicInstructorWhatsAppHref(instructorPhone, slotStart, slotEnd);
  const isHilai = variant === "hilai";
  const pb = heUi.publicBooking;
  const title = copyOverrides?.successTitle ?? pb.successTitle;
  const line = copyOverrides?.inlineSuccess ?? pb.inlineSuccess;
  const waLabel =
    copyOverrides?.whatsappConfirmButton ?? pb.whatsappConfirmButton;
  const anotherLabel =
    copyOverrides?.bookAnotherButton ?? pb.bookAnotherButton;
  const summaryTitle =
    copyOverrides?.successSummaryTitle ?? pb.successSummaryTitle;
  const summaryDateLabel = copyOverrides?.summaryDate ?? pb.summaryDate;
  const summaryTimeLabel = copyOverrides?.summaryTime ?? pb.summaryTime;
  const addToCal = copyOverrides?.addToCalendarSoon ?? pb.addToCalendarSoon;

  let dateFormatted = "";
  let timeFormatted = "";
  try {
    const d = new Date(slotStart);
    if (Number.isFinite(d.getTime())) {
      dateFormatted = new Intl.DateTimeFormat(timeLocale, {
        weekday: "short",
        day: "numeric",
        month: "short",
      }).format(d);
      timeFormatted = `${new Intl.DateTimeFormat(timeLocale, {
        timeStyle: "short",
      }).format(new Date(slotStart))} – ${new Intl.DateTimeFormat(timeLocale, {
        timeStyle: "short",
      }).format(new Date(slotEnd))}`;
    }
  } catch {
    dateFormatted = slotStart;
    timeFormatted = slotEnd;
  }

  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl border shadow-lg",
        isHilai
          ? "border-pink-200/50 bg-gradient-to-br from-white via-[#fff8fc] to-[#faf5ff] shadow-pink-200/25"
          : "border-emerald-200/70 bg-gradient-to-br from-white via-emerald-50/40 to-white shadow-emerald-900/5 dark:border-emerald-800/50 dark:from-emerald-950/30 dark:via-emerald-950/20 dark:to-stone-950",
      )}
      aria-live="polite"
    >
      <div className="p-5 sm:p-6">
        <div className="flex gap-4">
          <div
            className={cn(
              "flex size-12 shrink-0 items-center justify-center rounded-full text-xl font-bold text-white shadow-md",
              isHilai
                ? "bg-gradient-to-br from-pink-500 to-fuchsia-600 shadow-pink-300/40"
                : "bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-900/20",
            )}
            aria-hidden
          >
            ✓
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              {isHilai ? "Request received" : "הבקשה נקלטה"}
            </p>
            <h2
              className={cn(
                "text-lg font-bold leading-snug sm:text-xl",
                isHilai
                  ? "text-stone-900 dark:text-rose-50"
                  : "text-neutral-900 dark:text-emerald-50",
              )}
            >
              {title}
            </h2>
            <p
              className={cn(
                "text-sm leading-relaxed text-neutral-600 dark:text-neutral-300",
              )}
            >
              {line}
            </p>
          </div>
        </div>

        {dateFormatted ? (
          <div
            className={cn(
              "mt-5 rounded-2xl border p-4 sm:p-5",
              isHilai
                ? "border-stone-200/80 bg-white/60"
                : "border-emerald-200/50 bg-white/70 dark:border-emerald-800/40 dark:bg-emerald-950/20",
            )}
          >
            <p className="text-xs font-bold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              {summaryTitle}
            </p>
            <dl className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                  {summaryDateLabel}
                </dt>
                <dd className="mt-0.5 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  {dateFormatted}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                  {summaryTimeLabel}
                </dt>
                <dd className="mt-0.5 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  {timeFormatted}
                </dd>
              </div>
            </dl>
          </div>
        ) : null}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {wa ? (
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "inline-flex min-h-[3.25rem] flex-1 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold text-white shadow-md transition hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 sm:min-h-[3rem] sm:min-w-[12rem]",
                isHilai
                  ? "bg-gradient-to-r from-pink-500 to-fuchsia-600 shadow-pink-400/30 focus-visible:outline-pink-400/60"
                  : "bg-gradient-to-r from-emerald-600 to-teal-600 shadow-emerald-900/15 focus-visible:outline-emerald-600",
              )}
            >
              <span aria-hidden className="text-lg">
                💬
              </span>
              {waLabel}
            </a>
          ) : null}
          <button
            type="button"
            disabled
            title={addToCal}
            aria-disabled="true"
            className={cn(
              "inline-flex min-h-[3.25rem] flex-1 cursor-not-allowed items-center justify-center rounded-xl border px-5 text-sm font-semibold opacity-60 sm:min-h-[3rem] sm:min-w-[12rem]",
              isHilai
                ? "border-stone-200 bg-stone-50 text-stone-600"
                : "border-neutral-200 bg-neutral-50 text-neutral-600 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-400",
            )}
          >
            {addToCal}
          </button>
          <Button
            type="button"
            variant="secondary"
            className="min-h-[3.25rem] w-full sm:min-h-[3rem] sm:w-auto"
            onClick={onBookAnother}
          >
            {anotherLabel}
          </Button>
        </div>
      </div>
    </section>
  );
}
