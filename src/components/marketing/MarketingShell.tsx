"use client";

import { FloatingWhatsAppButton } from "@/components/marketing/FloatingWhatsAppButton";

/** Wraps marketing routes: floating WhatsApp + page content */
export function MarketingShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <FloatingWhatsAppButton />
    </>
  );
}
