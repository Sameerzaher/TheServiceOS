"use client";

import { useEffect } from "react";

import { heUi } from "@/config";
import { Button, ui } from "@/components/ui";

export default function ClientProfileError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className={ui.pageMain}>
      <h1 className={ui.pageTitle}>{heUi.errors.pageTitle}</h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-neutral-600">
        {heUi.errors.pageDescription}
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button type="button" variant="primary" onClick={reset}>
          {heUi.errors.tryAgain}
        </Button>
        <a
          href="/"
          className="inline-flex min-h-[2.75rem] items-center justify-center rounded-lg border border-neutral-200/90 bg-white px-4 py-2.5 text-base font-medium text-neutral-900 shadow-sm transition hover:border-emerald-200/80 hover:bg-emerald-50/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500/40"
        >
          {heUi.errors.goHome}
        </a>
      </div>
    </main>
  );
}
