/**
 * Validates Israeli mobile numbers (05x-xxxxxxx).
 * Accepts optional +972 / 972 prefix.
 */
export function isValidIsraeliPhone(input: string): boolean {
  const raw = input.replace(/\D/g, "");
  let d = raw;
  if (raw.startsWith("972") && raw.length >= 11) {
    d = `0${raw.slice(3)}`;
  }
  if (d.length === 9 && d.startsWith("5")) {
    d = `0${d}`;
  }
  return /^05[0-9]\d{7}$/.test(d);
}
