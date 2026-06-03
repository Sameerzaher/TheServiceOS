"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export interface BookingStepperProps {
  /** Active booking step 1–4 (step 5 = success, hide bar). */
  activeStep: number;
  children: ReactNode;
  className?: string;
  /** e.g. "שלב 2 מתוך 4" */
  progressLabel: string;
  accentVar?: string;
}

export function BookingStepper({
  activeStep,
  children,
  className,
  progressLabel,
  accentVar,
}: BookingStepperProps) {
  const pct = Math.min(100, Math.max(0, (activeStep / 4) * 100));

  return (
    <div className={cn("flex flex-col gap-5", className)}>
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2 text-xs font-medium text-neutral-500">
          <span>{progressLabel}</span>
          <span className="tabular-nums text-neutral-400">{activeStep}/4</span>
        </div>
        <div
          className="h-2 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800"
          role="progressbar"
          aria-valuenow={activeStep}
          aria-valuemin={1}
          aria-valuemax={4}
        >
          <div
            className="h-full rounded-full transition-[width] duration-300 ease-out"
            style={{
              width: `${pct}%`,
              background: accentVar
                ? `var(${accentVar}, #059669)`
                : "linear-gradient(90deg, #059669, #0d9488)",
            }}
          />
        </div>
      </div>
      <div className="transition-opacity duration-200">{children}</div>
    </div>
  );
}
