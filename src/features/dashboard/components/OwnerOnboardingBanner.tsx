"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useServiceApp } from "@/features/app/ServiceAppProvider";
import { heOnboarding } from "@/features/onboarding/owner/ownerOnboardingCopy";
import { cn } from "@/lib/cn";

const DISMISS_KEY = "serviceos.ownerOnboardingBannerDismissed";

export function OwnerOnboardingBanner() {
  const { settings, settingsReady } = useServiceApp();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(DISMISS_KEY) === "1") {
        setDismissed(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  if (!settingsReady || dismissed) return null;
  if (settings.ownerOnboardingCompletedAt) return null;

  return (
    <div
      className={cn(
        "mb-4 flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-amber-950 shadow-sm",
        "dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-50 sm:flex-row sm:items-center sm:justify-between",
      )}
    >
      <p className="text-sm font-medium">{heOnboarding.bannerPrompt}</p>
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href="/onboarding"
          className="inline-flex min-h-[2.5rem] items-center justify-center rounded-lg bg-amber-800 px-4 text-sm font-medium text-white transition hover:bg-amber-900 dark:bg-amber-600 dark:hover:bg-amber-500"
        >
          {heOnboarding.bannerCta}
        </Link>
        <button
          type="button"
          className="text-sm text-amber-900/80 underline-offset-2 hover:underline dark:text-amber-100/90"
          onClick={() => {
            try {
              window.localStorage.setItem(DISMISS_KEY, "1");
            } catch {
              /* ignore */
            }
            setDismissed(true);
          }}
        >
          {heOnboarding.bannerDismiss}
        </button>
      </div>
    </div>
  );
}
