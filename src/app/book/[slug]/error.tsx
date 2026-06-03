"use client";

import { useEffect } from "react";

import { heUi } from "@/config";
import { Button } from "@/components/ui/Button";
import { ui } from "@/components/ui/theme";

/**
 * Catches render/runtime errors under `/book/[slug]` so production never shows a generic 500 shell.
 */
export default function PublicBookingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[PublicBooking] error boundary:", error?.message, error?.digest);
  }, [error]);

  return (
    <main className={ui.pageMain}>
      <header className={ui.header}>
        <h1 className={ui.pageTitle}>{heUi.publicBooking.invalidSlugTitle}</h1>
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
          {heUi.publicBooking.bootstrapLoadFailedTitle}
        </p>
        <p className="mt-2 max-w-prose text-xs text-neutral-500 dark:text-neutral-500">
          {process.env.NODE_ENV === "development" && error?.message
            ? error.message
            : heUi.publicBooking.invalidSlugDescription}
        </p>
        <div className="mt-6">
          <Button type="button" variant="secondary" onClick={() => reset()}>
            {heUi.errors.tryAgain}
          </Button>
        </div>
      </header>
    </main>
  );
}
