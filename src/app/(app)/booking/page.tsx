"use client";

import { useMemo } from "react";
import Link from "next/link";

import { appPageTitle, heUi } from "@/config";
import {
  Button,
  DataLoadErrorBanner,
  InlineLoading,
  ui,
  useToast,
} from "@/components/ui";
import { AvailabilitySettingsForm } from "@/features/booking/components/AvailabilitySettingsForm";
import { BookingRequestsPanel } from "@/features/dashboard/components/BookingRequestsPanel";
import { useDashboardTeacherSlug } from "@/features/app/DashboardTeacherContext";
import { useServiceApp } from "@/features/app/ServiceAppProvider";
import { publicBookingPath } from "@/lib/booking/publicBookingPath";
import { cn } from "@/lib/cn";

export default function BookingSettingsPage() {
  const toast = useToast();
  const teacherSlug = useDashboardTeacherSlug();
  const {
    preset,
    settings,
    availabilitySettings,
    updateAvailabilitySettings,
    resetAvailabilitySettings,
    availabilityReady,
    availabilityLoadError,
    availabilitySyncError,
    retryAvailabilityLoad,
    retryAvailabilitySync,
  } = useServiceApp();

  const displayTitle =
    settings.businessName.trim() || appPageTitle(preset);

  const publicPath = useMemo(
    () => publicBookingPath(teacherSlug),
    [teacherSlug],
  );
  const publicUrl = useMemo(() => {
    if (typeof window === "undefined") return publicPath;
    return `${window.location.origin}${publicPath}`;
  }, [publicPath]);

  const whatsappShareHref = useMemo(() => {
    const text = heUi.settings.bookingShareText(publicUrl);
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  }, [publicUrl]);

  async function copyPublicLink(): Promise<void> {
    try {
      await navigator.clipboard.writeText(publicUrl);
      toast(heUi.toast.bookingLinkCopied);
    } catch {
      toast(heUi.reminders.clipboardError, "error");
    }
  }

  return (
    <main className={ui.pageMain}>
      <header className={ui.header}>
        <h1 className={ui.pageTitle}>{displayTitle}</h1>
        <p className={ui.pageSubtitle}>{heUi.settings.bookingTitle}</p>
      </header>

      <div className={cn(ui.pageStack, ui.section)}>
        {availabilityLoadError ? (
          <DataLoadErrorBanner
            title={availabilityLoadError}
            description={heUi.data.loadFailedHint}
            onRetry={retryAvailabilityLoad}
          />
        ) : null}
        {availabilitySyncError ? (
          <DataLoadErrorBanner
            title={availabilitySyncError}
            description={heUi.data.syncFailedHint}
            onRetry={retryAvailabilitySync}
          />
        ) : null}
        <p className="text-sm text-neutral-600">{heUi.settings.bookingHint}</p>
        <div className={`${ui.card} ${ui.cardPadding} space-y-3`}>
          <p className="text-xs font-medium text-neutral-600">
            {heUi.settings.bookingPublicUrlLabel}
          </p>
          <input
            type="text"
            readOnly
            value={publicUrl}
            className={ui.input}
            dir="ltr"
            aria-label={heUi.settings.bookingPublicUrlLabel}
          />
          <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:items-center">
            <Link
              href={publicPath}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-[2.75rem] items-center justify-center rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-900 shadow-sm transition hover:bg-neutral-50"
            >
              {heUi.settings.bookingPublicLink}
            </Link>
            <Button
              type="button"
              variant="secondary"
              onClick={() => void copyPublicLink()}
            >
              {heUi.settings.bookingCopyLink}
            </Button>
            <a
              href={whatsappShareHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-[2.75rem] items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-900 shadow-sm transition hover:bg-emerald-100"
            >
              {heUi.settings.bookingShareWhatsapp}
            </a>
          </div>
        </div>
        {!availabilityReady ? (
          <InlineLoading className="py-4" />
        ) : (
          <AvailabilitySettingsForm
            settings={availabilitySettings}
            onChange={(next) => updateAvailabilitySettings(next)}
            onReset={resetAvailabilitySettings}
          />
        )}
        <BookingRequestsPanel />
      </div>
    </main>
  );
}
