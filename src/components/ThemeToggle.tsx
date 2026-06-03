"use client";

import { cn } from "@/lib/cn";
import { useTheme } from "@/features/theme/ThemeProvider";

export function ThemeToggle({ className }: { className?: string }) {
  const { setTheme, resolvedTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-lg border border-neutral-300 bg-white text-base transition hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-800 dark:hover:bg-neutral-700",
        className,
      )}
      title={resolvedTheme === "dark" ? "מצב בהיר" : "מצב כהה"}
      aria-label={resolvedTheme === "dark" ? "מצב בהיר" : "מצב כהה"}
    >
      {resolvedTheme === "dark" ? "☀️" : "🌙"}
    </button>
  );
}
