import { heUi } from "@/config";
import { cn } from "@/lib/cn";

import { Spinner } from "./Spinner";

export interface InlineLoadingProps {
  className?: string;
  /** If omitted, only a screen-reader label is shown alongside the spinner. */
  visibleLabel?: string;
}

/**
 * Lightweight loading indicator for in-flow sections (vs. full {@link LoadingState} cards).
 */
export function InlineLoading({ className, visibleLabel }: InlineLoadingProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 py-4 text-sm text-neutral-600",
        className,
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Spinner className="size-4 shrink-0 border-neutral-300 border-t-neutral-700" />
      {visibleLabel ? (
        <span>{visibleLabel}</span>
      ) : (
        <span className="sr-only">{heUi.loading.ariaBusy}</span>
      )}
    </div>
  );
}
