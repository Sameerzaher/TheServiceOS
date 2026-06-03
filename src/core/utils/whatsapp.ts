import { normalizePhoneForWhatsApp } from "@/core/whatsapp/phoneNormalize";

export { normalizePhoneForWhatsApp } from "@/core/whatsapp/phoneNormalize";

/**
 * Builds a `wa.me` deep link (digits only in path, optional `text` query).
 * Uses {@link normalizePhoneForWhatsApp} for Israeli and international input.
 */
export function buildWhatsAppHref(phone: string, message?: string): string | null {
  const digits = normalizePhoneForWhatsApp(phone);
  if (!digits) return null;
  const base = `https://wa.me/${digits}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
