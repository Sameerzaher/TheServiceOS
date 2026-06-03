"use client";

import { useEffect } from "react";

import { heUi } from "@/config";

/**
 * Replaces the root layout when an error bubbles above `app/layout.tsx`.
 * Must define its own `<html>` / `<body>` (Next.js requirement).
 */
export default function GlobalError({
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
    <html lang="he" dir="rtl">
      <body className="min-h-dvh bg-neutral-50 px-4 py-10 font-sans text-neutral-900 antialiased sm:px-6">
        <main className="mx-auto w-full max-w-lg">
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
            {heUi.errors.globalTitle}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-neutral-600">
            {heUi.errors.globalDescription}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-lg border border-neutral-900 bg-neutral-900 px-4 py-2.5 text-base font-medium text-white shadow-sm transition hover:bg-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
              onClick={reset}
            >
              {heUi.errors.tryAgain}
            </button>
            <a
              href="/"
              className="inline-flex items-center justify-center rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-base font-medium text-neutral-900 shadow-sm transition hover:bg-neutral-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-400"
            >
              {heUi.errors.goHome}
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
