"use client";

import { cn } from "@/lib/cn";

import type { PublicCatalogService } from "./types";

export interface ServiceSelectorProps {
  services: readonly PublicCatalogService[];
  selectedId: string | null;
  onSelect: (svc: PublicCatalogService) => void;
  disabled?: boolean;
  accentVar?: string;
}

function formatPrice(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "—";
  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
    maximumFractionDigits: 0,
  }).format(n);
}

export function ServiceSelector({
  services,
  selectedId,
  onSelect,
  disabled = false,
  accentVar,
}: ServiceSelectorProps) {
  return (
    <ul className="flex flex-col gap-2.5">
      {services.map((svc) => {
        const on = selectedId === svc.id;
        return (
          <li key={svc.id}>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onSelect(svc)}
              className={cn(
                "flex w-full min-h-[52px] items-center justify-between gap-3 rounded-2xl border-2 px-4 py-3 text-start transition-all",
                "touch-manipulation active:scale-[0.99]",
                on
                  ? "border-emerald-600 bg-emerald-50/90 shadow-md shadow-emerald-900/10 ring-2 ring-emerald-500/25 dark:border-emerald-500 dark:bg-emerald-950/40"
                  : "border-neutral-200 bg-white hover:border-emerald-300/80 dark:border-neutral-700 dark:bg-neutral-900/40",
              )}
              style={
                on && accentVar
                  ? {
                      borderColor: `var(${accentVar})`,
                      boxShadow: `0 8px 24px -12px color-mix(in srgb, var(${accentVar}) 35%, transparent)`,
                    }
                  : undefined
              }
            >
              <span className="min-w-0 flex-1">
                <span className="block text-base font-semibold text-neutral-900 dark:text-neutral-100">
                  {svc.name}
                </span>
                <span className="mt-0.5 block text-sm text-neutral-500">
                  {svc.durationMinutes} דק׳
                </span>
              </span>
              <span className="shrink-0 text-base font-bold tabular-nums text-neutral-800 dark:text-neutral-100">
                {formatPrice(svc.price)}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
