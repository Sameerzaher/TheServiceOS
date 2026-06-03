"use client";

import { heUi } from "@/config";
import { EmptyState } from "@/components/ui/EmptyState";
import { ui } from "@/components/ui/theme";
import type { AvailableSlot } from "@/features/booking/utils/generateAvailableSlots";
import { cn } from "@/lib/cn";

export interface BookingSlotPickerProps {
  availableSlots: readonly AvailableSlot[];
  selectedSlotStart?: string | null;
  onSelect: (slot: AvailableSlot) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  /** Disables all slot buttons (e.g. while submitting). */
  disabled?: boolean;
  /** Branded slot buttons for specific public demos (e.g. Hilai Nails). */
  tone?: "default" | "hilai";
  /** Overrides default slot section heading (e.g. warmer copy for Hilai). */
  slotHeadingOverride?: string;
  /** Locale for time display (default Hebrew). */
  timeLocale?: string;
}

function formatTimeRange(
  startIso: string,
  endIso: string,
  locale: string,
): string {
  try {
    const fmt = new Intl.DateTimeFormat(locale, { timeStyle: "short" });
    return `${fmt.format(new Date(startIso))} - ${fmt.format(new Date(endIso))}`;
  } catch {
    return `${startIso} - ${endIso}`;
  }
}

export function BookingSlotPicker({
  availableSlots,
  selectedSlotStart = null,
  onSelect,
  emptyTitle,
  emptyDescription = "בחרו תאריך אחר או נסו שוב בהמשך.",
  disabled = false,
  tone = "default",
  slotHeadingOverride,
  timeLocale = "he-IL",
}: BookingSlotPickerProps) {
  const title = emptyTitle ?? heUi.publicBooking.slotsEmptyShort;
  const slotHeadingText = slotHeadingOverride ?? heUi.publicBooking.slotHeading;
  if (availableSlots.length === 0) {
    return (
      <EmptyState
        tone="muted"
        className={cn(
          "py-10 sm:py-12",
          tone === "default" &&
            "rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/80 dark:border-neutral-700 dark:bg-neutral-900/40",
          tone === "hilai" &&
            "border-rose-100/50 bg-gradient-to-b from-rose-50/50 to-white/90 shadow-[0_4px_24px_-12px_rgba(200,150,165,0.15)] ring-rose-100/20",
        )}
        title={title}
        description={emptyDescription}
      />
    );
  }

  return (
    <div
      className={cn(
        "rounded-2xl border border-transparent p-0 sm:p-0",
        tone === "hilai" && "border-stone-200/40 bg-stone-50/30 p-4 sm:p-5",
      )}
    >
      <div
        className={cn(
          tone === "hilai" ? "space-y-4" : "space-y-2.5 sm:space-y-3",
        )}
      >
        <h3
          className={cn(
            tone === "hilai"
              ? "text-sm font-medium text-stone-600 sm:text-[15px]"
              : "text-sm font-semibold text-neutral-900 dark:text-neutral-100 sm:text-base",
          )}
        >
          {slotHeadingText}
        </h3>
        <ul
          className={cn(
            "grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-3.5",
            tone === "hilai" && "gap-3 sm:gap-3.5",
          )}
        >
          {availableSlots.map((slot) => {
            const selected = selectedSlotStart === slot.slotStart;
            return (
              <li key={slot.slotStart} className={cn(tone === "hilai" && "min-w-0")}>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onSelect(slot)}
                  aria-pressed={selected}
                  className={cn(
                    ui.input,
                    "w-full min-h-[3.15rem] touch-manipulation justify-center px-3 text-center text-[13px] font-semibold transition-all duration-200 sm:min-h-[3.35rem] sm:text-sm",
                    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
                    disabled && "cursor-not-allowed opacity-45 grayscale-[0.3]",
                    tone === "hilai"
                      ? selected
                        ? "rounded-full border border-transparent bg-gradient-to-r from-pink-400 to-fuchsia-500 text-white shadow-md shadow-pink-400/35 ring-2 ring-pink-200/60"
                        : "rounded-full border border-pink-200/80 bg-white text-stone-700 shadow-sm hover:scale-[1.03] hover:border-pink-300 hover:bg-pink-50/80 active:scale-[0.97] dark:border-pink-900/40 dark:bg-stone-900 dark:text-stone-100"
                      : selected
                        ? "rounded-full border border-transparent bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-900/20 ring-2 ring-emerald-300/50 dark:from-emerald-500 dark:to-teal-500 dark:ring-emerald-400/30"
                        : "rounded-full border border-neutral-200/90 bg-white text-neutral-900 shadow-sm hover:border-emerald-300/60 hover:bg-emerald-50/50 active:scale-[0.98] dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:border-emerald-700/50 dark:hover:bg-emerald-950/30",
                  )}
                >
                  {formatTimeRange(slot.slotStart, slot.slotEnd, timeLocale)}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

