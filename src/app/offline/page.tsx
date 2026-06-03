"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { heUi } from "@/config";
import { Button } from "@/components/ui/Button";
import { ui } from "@/components/ui/theme";

export default function OfflinePage() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setOnline(navigator.onLine);
    function sync(): void {
      setOnline(navigator.onLine);
    }
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  return (
    <main className={ui.pageMain}>
      <p
        className="text-xs font-medium uppercase tracking-wide text-neutral-500"
        role="status"
        aria-live="polite"
      >
        {online ? heUi.pwa.offlineStatusOnline : heUi.pwa.offlineStatusOffline}
      </p>
      <h1 className={ui.pageTitle}>{heUi.pwa.offlineTitle}</h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-neutral-600">
        {heUi.pwa.offlineBody}
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button
          type="button"
          variant="primary"
          onClick={() => window.location.reload()}
        >
          {heUi.pwa.offlineRetry}
        </Button>
        <Link
          href="/"
          className="inline-flex min-h-[2.75rem] items-center justify-center rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-base font-medium text-neutral-900 shadow-sm transition hover:bg-neutral-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-400"
        >
          {heUi.pwa.offlineHome}
        </Link>
      </div>
    </main>
  );
}
