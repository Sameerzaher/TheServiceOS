"use client";

import { useEffect, useRef, useState } from "react";

import { heUi } from "@/config";
import { Button } from "@/components/ui/Button";
import type { BeforeInstallPromptEvent } from "@/types/pwa";
import { cn } from "@/lib/cn";

const DISMISS_KEY = "pwa-install-dismissed";
/** iOS has no `beforeinstallprompt`; delay the hint so it is not the first thing users see. */
const IOS_HINT_DELAY_MS = 10_000;

function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") return true;
  if (window.matchMedia("(display-mode: standalone)").matches) return true;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return Boolean(nav.standalone);
}

function readDismissed(): boolean {
  try {
    return window.localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

function writeDismissed(): void {
  try {
    window.localStorage.setItem(DISMISS_KEY, "1");
  } catch {
    /* private mode / quota */
  }
}

export function PwaInstallBanner() {
  const [ready, setReady] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [installEvent, setInstallEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);
  const installPromptSeen = useRef(false);

  useEffect(() => {
    if (isStandaloneDisplay()) {
      setReady(true);
      return;
    }
    if (readDismissed()) {
      setDismissed(true);
      setReady(true);
      return;
    }

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      installPromptSeen.current = true;
      setInstallEvent(e as BeforeInstallPromptEvent);
      setShowIosHint(false);
    };

    window.addEventListener(
      "beforeinstallprompt",
      onBeforeInstall as EventListener,
    );

    const onInstalled = (): void => {
      writeDismissed();
      setDismissed(true);
      setInstallEvent(null);
      setShowIosHint(false);
    };
    window.addEventListener("appinstalled", onInstalled);

    const isIos =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

    let timer: ReturnType<typeof setTimeout> | undefined;
    if (isIos) {
      timer = setTimeout(() => {
        if (installPromptSeen.current) return;
        if (readDismissed()) return;
        setShowIosHint(true);
      }, IOS_HINT_DELAY_MS);
    }

    setReady(true);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        onBeforeInstall as EventListener,
      );
      window.removeEventListener("appinstalled", onInstalled);
      if (timer) clearTimeout(timer);
    };
  }, []);

  const handleDismiss = (): void => {
    writeDismissed();
    setDismissed(true);
    setInstallEvent(null);
    setShowIosHint(false);
  };

  const handleInstall = async (): Promise<void> => {
    if (!installEvent) return;
    await installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
  };

  if (!ready || dismissed || isStandaloneDisplay()) return null;

  const showChrome = installEvent !== null;
  const showBanner = showChrome || showIosHint;
  if (!showBanner) return null;

  return (
    <div
      dir="rtl"
      className={cn(
        "fixed bottom-0 left-0 right-0 z-[90] border-t border-neutral-200 bg-white/95 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(0,0,0,0.08)] backdrop-blur-sm sm:bottom-4 sm:left-auto sm:right-4 sm:max-w-md sm:rounded-xl sm:border sm:p-4 sm:pb-4",
      )}
      role="region"
      aria-label={heUi.pwa.installRegionLabel}
    >
      <div className="flex flex-col gap-3">
        <div>
          <p className="text-sm font-semibold text-neutral-900">
            {heUi.pwa.installTitle}
          </p>
          <p className="mt-1 text-sm text-neutral-600">
            {showChrome ? heUi.pwa.installChromeBody : heUi.pwa.installIosBody}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button type="button" variant="secondary" onClick={handleDismiss}>
            {heUi.pwa.installDismiss}
          </Button>
          {showChrome ? (
            <Button type="button" variant="primary" onClick={handleInstall}>
              {heUi.pwa.installAction}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
