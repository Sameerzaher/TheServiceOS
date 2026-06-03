"use client";

import { heUi } from "@/config";
/** Do not use `@/components/ui` barrel here — import `theme` directly. */
import { ui } from "@/components/ui/theme";

/** UI when Supabase public env is not set (works from client `page.tsx`). */
export function PublicBookingEnvMissing() {
  return (
    <main className={ui.pageMain}>
      <header className={ui.header}>
        <h1 className={ui.pageTitle}>{heUi.publicBooking.invalidSlugTitle}</h1>
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-neutral-600">
          השירות אינו זמין כרגע (הגדרות שרת חסרות). פנו למנהל המערכת.
        </p>
      </header>
    </main>
  );
}
