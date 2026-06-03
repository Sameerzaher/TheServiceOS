"use client";

import { cn } from "@/lib/cn";
import { productWhatsAppHref } from "@/lib/marketing/whatsapp";

type Variant = "primary" | "soft" | "nav";

const variantClass: Record<Variant, string> = {
  primary:
    "inline-flex min-h-[2.75rem] items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-900/15 transition hover:brightness-105 active:scale-[0.98]",
  soft:
    "inline-flex min-h-[2.75rem] items-center justify-center gap-2 rounded-xl border border-[#25D366]/40 bg-[#25D366]/10 px-4 py-2.5 text-sm font-semibold text-emerald-900 transition hover:bg-[#25D366]/15",
  nav: "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50",
};

export function WhatsAppCtaLink({
  children,
  className,
  variant = "primary",
  prefillMessage,
  ariaLabel,
}: {
  children: React.ReactNode;
  className?: string;
  variant?: Variant;
  /** Opens WhatsApp with this message prefilled */
  prefillMessage?: string;
  ariaLabel?: string;
}) {
  const href = productWhatsAppHref(prefillMessage);
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(variantClass[variant], className)}
      aria-label={ariaLabel ?? (typeof children === "string" ? children : "WhatsApp")}
    >
      <span aria-hidden className="text-lg leading-none">
        💬
      </span>
      {children}
    </a>
  );
}
