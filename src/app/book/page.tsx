"use client";

import Link from "next/link";

import { heUi } from "@/config";
import { ui } from "@/components/ui/theme";

/**
 * `/book` without a teacher slug is no longer a valid public entry point.
 * Per-teacher booking lives at `/book/[slug]`.
 */
export default function BookMissingSlugPage() {
  return (
    <main className={ui.pageMain}>
      <header className={ui.header}>
        <h1 className={ui.pageTitle}>{heUi.publicBooking.incompleteLinkTitle}</h1>
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-neutral-600">
          {heUi.publicBooking.incompleteLinkDescription}
        </p>
        <p className="mt-4">
          <Link
            href="/"
            className="text-sm font-medium text-blue-700 underline-offset-4 hover:underline"
          >
            {heUi.errors.goHome}
          </Link>
        </p>
      </header>
    </main>
  );
}
