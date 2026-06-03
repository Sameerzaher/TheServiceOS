"use client";

import { heUi } from "@/config";
import { cn } from "@/lib/cn";

export function PublicBookingHero({
  businessName,
  teacherName,
  logoUrl,
  accentColor,
  subtitle,
  trustMicro,
}: {
  businessName: string;
  teacherName?: string;
  logoUrl?: string | null;
  accentColor?: string | null;
  /** Defaults to Hebrew conversion copy */
  subtitle?: string;
  trustMicro?: string;
}) {
  const sub = subtitle ?? heUi.publicBooking.heroSubtitle;
  const trust = trustMicro ?? heUi.publicBooking.heroTrustMicro;

  return (
    <header className="space-y-4 text-center sm:text-start">
      {logoUrl ? (
        <div className="flex justify-center sm:justify-start">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoUrl}
            alt=""
            className="h-16 max-w-[11rem] object-contain"
          />
        </div>
      ) : null}

      <div className="space-y-2">
        <h1
          className="text-pretty text-2xl font-bold leading-tight tracking-tight text-neutral-900 dark:text-neutral-100 sm:text-3xl"
          style={accentColor ? { color: accentColor } : undefined}
        >
          {businessName}
        </h1>
        {teacherName ? (
          <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
            {teacherName}
          </p>
        ) : null}
        <p className="text-base leading-relaxed text-neutral-700 dark:text-neutral-300 sm:text-lg">
          {sub}
        </p>
        <p className="text-xs font-medium leading-relaxed text-neutral-500 dark:text-neutral-400 sm:text-sm">
          {trust}
        </p>
      </div>
    </header>
  );
}

export function PublicBookingTrustStrip({
  className,
  items: itemsProp,
}: {
  className?: string;
  /** Defaults to Hebrew `heUi.publicBooking` trust lines */
  items?: readonly string[];
}) {
  const items = itemsProp ?? [
    heUi.publicBooking.trustNoCalls,
    heUi.publicBooking.trustQuickConfirm,
    heUi.publicBooking.trustPrivacy,
  ];
  return (
    <ul
      className={cn(
        "grid gap-2.5 rounded-2xl border border-neutral-200/90 bg-neutral-50/90 p-3.5 dark:border-neutral-700 dark:bg-neutral-800/50 sm:gap-3 sm:p-4",
        className,
      )}
    >
      {items.map((text) => (
        <li
          key={text}
          className="flex items-center gap-2.5 text-start text-sm font-medium text-neutral-800 dark:text-neutral-200"
        >
          <span
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-100"
            aria-hidden
          >
            ✓
          </span>
          <span className="min-w-0 leading-snug">{text}</span>
        </li>
      ))}
    </ul>
  );
}
