"use client";

import { heUi } from "@/config";

export interface DataLoadErrorBannerProps {
  title: string;
  description?: string;
  onRetry?: () => void;
}

export function DataLoadErrorBanner({
  title,
  description,
  onRetry,
}: DataLoadErrorBannerProps) {
  return (
    <div
      className="rounded-xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-amber-950 shadow-sm"
      role="alert"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="font-semibold">{title}</p>
          {description ? (
            <p className="text-amber-900/90">{description}</p>
          ) : null}
        </div>
        {onRetry ? (
          <button
            type="button"
            className="inline-flex min-h-[2.5rem] shrink-0 items-center justify-center rounded-lg border border-amber-400/80 bg-white px-3 py-1.5 text-sm font-medium text-amber-950 transition hover:bg-amber-100"
            onClick={onRetry}
          >
            {heUi.errors.tryAgain}
          </button>
        ) : null}
      </div>
    </div>
  );
}
