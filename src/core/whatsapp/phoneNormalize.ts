/**
 * Normalizes arbitrary phone input into digits-only international form for wa.me
 * (country code, no leading +). Optimized for Israeli mobiles; supports common variants.
 */

function onlyDigits(s: string): string {
  return s.replace(/\D/g, "");
}

/**
 * Strips a mistaken leading 0 after Israel country code (e.g. 972052… → 97252…).
 */
function fixIsraeliDoubleZeroAfter972(digits: string): string {
  if (digits.startsWith("9720")) {
    return `972${digits.slice(4)}`;
  }
  return digits;
}

/**
 * Returns WhatsApp path digits (e.g. `972501234567`) or `null` if unusable.
 */
export function normalizePhoneForWhatsApp(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;

  let digits = onlyDigits(raw.replace(/^\+/, ""));
  while (digits.startsWith("00")) {
    digits = digits.slice(2);
  }
  if (!digits) return null;

  digits = fixIsraeliDoubleZeroAfter972(digits);

  if (digits.startsWith("972")) {
    const rest = digits.slice(3);
    if (rest.length >= 8 && rest.length <= 10) return `972${rest}`;
    return null;
  }

  if (digits.startsWith("0")) {
    const rest = digits.slice(1);
    if (rest.length >= 8 && rest.length <= 10) {
      return `972${rest}`;
    }
  }

  if (digits.length === 9 && digits.startsWith("5")) {
    return `972${digits}`;
  }

  if (digits.length === 10 && digits.startsWith("05")) {
    return `972${digits.slice(1)}`;
  }

  if (digits.length >= 10 && digits.length <= 15) {
    return digits;
  }

  return null;
}
