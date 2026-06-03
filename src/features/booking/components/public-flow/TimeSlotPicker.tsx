"use client";

import { BookingSlotPicker, type BookingSlotPickerProps } from "@/features/booking/components/BookingSlotPicker";
import { heUi } from "@/config";

function SlotsSkeleton() {
  return (
    <div
      className="space-y-3"
      role="status"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="h-4 w-36 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-12 animate-pulse rounded-full bg-neutral-100 dark:bg-neutral-800"
          />
        ))}
      </div>
      <span className="sr-only">{heUi.loading.ariaBusy}</span>
    </div>
  );
}

export type TimeSlotPickerProps = { isLoading?: boolean } & BookingSlotPickerProps;

/**
 * Public flow wrapper: shows skeleton while appointments / slots are loading.
 */
export function TimeSlotPicker({ isLoading = false, ...rest }: TimeSlotPickerProps) {
  if (isLoading) {
    return <SlotsSkeleton />;
  }
  return (
    <BookingSlotPicker
      {...rest}
      // Ensure touch-friendly minimum height in the grid
    />
  );
}
