/**
 * Single source of truth for PWA / install UI (manifest, metadata, theme).
 * Keep in sync with `body` background (`globals.css` uses Tailwind `neutral-50` ≈ #fafafa).
 */
export const PWA_APP_NAME = "ServiceOS";
export const PWA_SHORT_NAME = "ServiceOS";
export const PWA_DESCRIPTION =
  "ניהול תלמידים, שיעורים והגדרות — ServiceOS";

/** Status bar / theme-color (matches nav chrome). */
export const PWA_THEME_COLOR = "#171717";

/** Splash / manifest background; aligns with page background. */
export const PWA_BACKGROUND_COLOR = "#fafafa";
