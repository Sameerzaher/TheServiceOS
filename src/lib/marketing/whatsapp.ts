import { PRODUCT_BRANDING } from "@/config/branding";

/** wa.me link for product sales/support (digits only, no +). */
export function productWhatsAppHref(prefillMessage?: string): string {
  const n = String(PRODUCT_BRANDING.contact.whatsapp).replace(/\D/g, "");
  const base = `https://wa.me/${n}`;
  if (!prefillMessage?.trim()) return base;
  return `${base}?text=${encodeURIComponent(prefillMessage.trim())}`;
}
