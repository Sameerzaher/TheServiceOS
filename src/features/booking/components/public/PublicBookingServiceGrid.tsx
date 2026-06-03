"use client";

import { heUi } from "@/config";
import type { Service } from "@/core/types/service";
import { cn } from "@/lib/cn";

function formatPrice(price: number): string | null {
  if (!Number.isFinite(price) || price <= 0) return null;
  return heUi.publicBooking.priceFormatted.replace(
    "{price}",
    String(Math.round(price)),
  );
}

export function PublicBookingServiceGrid({
  services,
  selectedName,
  onSelect,
  disabled,
  heading,
}: {
  services: readonly Service[];
  selectedName: string | null;
  onSelect: (serviceName: string) => void;
  disabled?: boolean;
  heading: string;
}) {
  const durLabel = heUi.publicBooking.durationMinutesShort;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold leading-snug tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-xl">
        {heading}
      </h2>
      <ul className="grid grid-cols-1 gap-3 sm:gap-3.5">
        {services.map((svc) => {
          const on = selectedName === svc.name;
          const priceLine = formatPrice(svc.price);
          const durationLine =
            Number.isFinite(svc.duration) && svc.duration > 0
              ? `${svc.duration} ${durLabel}`
              : null;
          return (
            <li key={svc.name}>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onSelect(svc.name)}
                aria-pressed={on}
                className={cn(
                  "flex w-full min-h-[4.25rem] items-start gap-4 rounded-2xl border px-4 py-3.5 text-start transition-all duration-200 sm:min-h-[4.5rem] sm:px-5 sm:py-4",
                  "touch-manipulation focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
                  disabled && "cursor-not-allowed opacity-50",
                  on
                    ? "border-emerald-600/90 bg-gradient-to-br from-emerald-50 to-white shadow-lg shadow-emerald-900/10 ring-2 ring-emerald-500/35 dark:border-emerald-400/60 dark:from-emerald-950/40 dark:to-neutral-900 dark:ring-emerald-400/25"
                    : "border-neutral-200/90 bg-white shadow-sm hover:border-emerald-300/70 hover:shadow-md active:scale-[0.99] dark:border-neutral-700 dark:bg-neutral-900/40 dark:hover:border-emerald-700/50",
                )}
              >
                <span className="min-w-0 flex-1 space-y-1">
                  <span
                    className={cn(
                      "block text-[15px] font-bold leading-snug sm:text-base",
                      on
                        ? "text-emerald-950 dark:text-emerald-50"
                        : "text-neutral-900 dark:text-neutral-100",
                    )}
                  >
                    {svc.name}
                  </span>
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm font-medium text-neutral-600 dark:text-neutral-400">
                    {durationLine ? (
                      <span className="tabular-nums">{durationLine}</span>
                    ) : null}
                    {durationLine && priceLine ? (
                      <span className="text-neutral-300 dark:text-neutral-600" aria-hidden>
                        ·
                      </span>
                    ) : null}
                    {priceLine ? (
                      <span className="tabular-nums text-neutral-800 dark:text-neutral-200">
                        {priceLine}
                      </span>
                    ) : null}
                  </span>
                </span>
                <span
                  className={cn(
                    "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border-2 text-[11px] font-bold transition-colors",
                    on
                      ? "border-emerald-600 bg-emerald-600 text-white dark:border-emerald-400 dark:bg-emerald-400 dark:text-emerald-950"
                      : "border-neutral-300 text-transparent dark:border-neutral-600",
                  )}
                  aria-hidden
                >
                  ✓
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
