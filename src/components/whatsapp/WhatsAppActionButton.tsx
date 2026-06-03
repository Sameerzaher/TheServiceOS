"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export interface WhatsAppActionButtonProps {
  /** `wa.me` URL or `null` when phone is missing / invalid */
  href: string | null;
  children: ReactNode;
  /** Shown when `href` is null */
  disabledHint?: string;
  variant?: "primary" | "secondary" | "soft";
  className?: string;
  /** Visually full-width on mobile */
  fullWidth?: boolean;
}

const base =
  "inline-flex min-h-[2.75rem] items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-55";

const variants: Record<NonNullable<WhatsAppActionButtonProps["variant"]>, string> =
  {
    primary:
      "bg-[#25D366] text-white shadow-sm hover:brightness-105 focus-visible:outline-[#25D366]",
    secondary:
      "border border-[#25D366]/40 bg-[#25D366]/10 text-emerald-950 hover:bg-[#25D366]/16 dark:text-emerald-100",
    soft: "text-emerald-800 underline-offset-2 hover:underline dark:text-emerald-300",
  };

export function WhatsAppActionButton({
  href,
  children,
  disabledHint,
  variant = "primary",
  className,
  fullWidth,
}: WhatsAppActionButtonProps) {
  if (!href) {
    return (
      <span
        className={cn(
          base,
          "cursor-not-allowed border border-dashed border-neutral-200 bg-neutral-50 text-neutral-500 dark:border-neutral-600 dark:bg-neutral-800/50 dark:text-neutral-400",
          fullWidth && "w-full",
          className,
        )}
        title={disabledHint}
        role="status"
      >
        <span aria-hidden>💬</span>
        {children}
      </span>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        base,
        variants[variant],
        fullWidth && "w-full",
        className,
      )}
    >
      <span aria-hidden>💬</span>
      {children}
    </a>
  );
}
