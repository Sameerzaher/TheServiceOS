"use client";

import { cn } from "@/lib/cn";
import { useLocale } from "@/features/locale/LocaleProvider";

export function LocaleToggle({ className }: { className?: string }) {
  const { locale, setLocale } = useLocale();

  return (
    <button
      type="button"
      onClick={() => setLocale(locale === "he" ? "en" : "he")}
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-lg border border-neutral-300 bg-white text-xs font-semibold transition hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-800 dark:hover:bg-neutral-700",
        className,
      )}
      title={locale === "he" ? "English" : "עברית"}
      aria-label={locale === "he" ? "Switch to English" : "עבור לעברית"}
    >
      {locale === "he" ? "EN" : "HE"}
    </button>
  );
}
