import { heUi } from "@/config";
import { cn } from "@/lib/cn";

import { Spinner } from "./Spinner";

export interface LoadingStateProps {
  message?: string;
  className?: string;
}

export function LoadingState({
  message = heUi.loading.ariaBusy,
  className,
}: LoadingStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-neutral-200 bg-white px-6 py-14 text-center shadow-sm",
        className,
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Spinner />
      <p className="text-sm text-neutral-600">{message}</p>
    </div>
  );
}
