"use client";

import { productWhatsAppHref } from "@/lib/marketing/whatsapp";

const DEFAULT_PREFILL =
  "היי, אשמח לשמוע עוד על תור פה — איך זה עוזר לעסק שלי?";

export function FloatingWhatsAppButton() {
  return (
    <a
      href={productWhatsAppHref(DEFAULT_PREFILL)}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-5 end-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-2xl shadow-lg shadow-emerald-900/25 ring-4 ring-white/90 transition hover:scale-105 hover:brightness-105 active:scale-95 md:bottom-8 md:end-8"
      aria-label="שיחה בווטסאפ"
      title="שיחה בווטסאפ"
    >
      <span aria-hidden>💬</span>
    </a>
  );
}
