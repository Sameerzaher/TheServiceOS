"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { heUi } from "@/config";
import { DataLoadErrorBanner } from "@/components/ui/DataLoadErrorBanner";
import { useToast } from "@/components/ui/Toast";
import { ui } from "@/components/ui/theme";
import { BookingSlotPicker } from "@/features/booking/components/BookingSlotPicker";
import {
  PublicBookingForm,
  type PublicBookingFormSubmitInput,
} from "@/features/booking/components/PublicBookingForm";
import { PublicBookingSuccessPanel } from "@/features/booking/components/PublicBookingSuccessPanel";
import { PublicBookingTrustStrip } from "@/features/booking/components/public/PublicBookingHero";
import { useBooking } from "@/features/booking/hooks/useBooking";
import { usePublicTeacherAppointments } from "@/features/booking/hooks/usePublicTeacherAppointments";
import { generateAvailableSlots } from "@/features/booking/utils/generateAvailableSlots";
import {
  safeNormalizeAvailabilitySettings,
  type AvailabilitySettings,
} from "@/core/types/availability";
import type { CustomFieldDefinition } from "@/core/types/vertical";
import type { BusinessType } from "@/core/types/teacher";
import {
  HILAI_PREMIUM,
  HILAI_PREMIUM_FORM_COPY,
  HILAI_PREMIUM_REVIEWS,
  HILAI_GALLERY_IMAGES,
  HILAI_SERVICE_LABEL_EN,
  HILAI_SUCCESS_COPY,
} from "@/features/booking/hilai/constants";
import {
  HilaiGalleryStrip,
  HilaiNailsServiceGrid,
  HilaiPremiumHero,
  HilaiReviewsSection,
  HilaiSectionDivider,
  HilaiSectionHeading,
  HilaiStudioWhatsAppLink,
  HilaiUrgencyStrip,
} from "@/features/booking/components/hilai/HilaiNailsSections";
import { buildWhatsAppHref } from "@/core/utils/whatsapp";
import { cn } from "@/lib/cn";

function todayLocalYmd(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addLocalDaysYmd(from: Date, daysToAdd: number): string {
  const d = new Date(
    from.getFullYear(),
    from.getMonth(),
    from.getDate(),
  );
  d.setDate(d.getDate() + daysToAdd);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function BookingSectionSkeleton({ tone = "default" }: { tone?: "default" | "hilai" }) {
  const bar =
    tone === "hilai" ? "bg-rose-100/70 dark:bg-rose-900/35" : "bg-neutral-200 dark:bg-neutral-700";
  const slot =
    tone === "hilai" ? "bg-stone-100/80 dark:bg-rose-900/25" : "bg-neutral-200 dark:bg-neutral-700";
  return (
    <div className="space-y-3" role="status" aria-busy="true">
      <div className={cn("h-4 w-40 animate-pulse rounded", bar)} />
      <div className={cn("h-10 w-full max-w-xs animate-pulse rounded-lg", bar)} />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={cn("h-10 animate-pulse rounded-lg", slot)} />
        ))}
      </div>
      <span className="sr-only">{heUi.loading.ariaBusy}</span>
    </div>
  );
}

export type PublicBookingIdentity = {
  businessName: string;
  teacherName: string;
  phone: string;
};

/** Theme for the public booking page (from Settings → branding). */
export type PublicBookingBranding = {
  logoUrl: string | null;
  primaryColor: string | null;
  accentColor: string | null;
};

export interface PublicBookingPageContentProps {
  teacherId: string;
  businessType: BusinessType;
  identity: PublicBookingIdentity;
  availability: AvailabilitySettings;
  /** Business logo + colors from app settings (optional). */
  branding?: PublicBookingBranding | null;
}

/** Hilai Nails branded single-page booking (used when slug matches `HILAI_NAILS_SLUG`). */
export function PublicBookingPageContent({
  teacherId,
  businessType: _businessType,
  identity,
  availability,
  branding = null,
}: PublicBookingPageContentProps) {
  const toast = useToast();
  const toastShownForError = useRef<string | null>(null);

  const [selectedDate, setSelectedDate] = useState<string>(() => todayLocalYmd());
  const [selectedSlotStart, setSelectedSlotStart] = useState<string | null>(null);
  const [appointmentsReloadKey, setAppointmentsReloadKey] = useState(0);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [servicePreflightError, setServicePreflightError] = useState<string | null>(null);

  const {
    sortedAppointments,
    isReady: appointmentsReady,
    loadError: appointmentsLoadError,
    retryLoad: retryAppointmentsLoad,
  } = usePublicTeacherAppointments(teacherId, appointmentsReloadKey);

  const {
    isReady,
    isSubmitting,
    isSuccess,
    error,
    successSnapshot,
    submitBooking: submitBookingRaw,
    resetState,
  } = useBooking({
    teacherId,
    onPublicBookingSuccess: () =>
      setAppointmentsReloadKey((k) => k + 1),
  });

  const submitBooking = useCallback(
    async (input: PublicBookingFormSubmitInput) => {
      const svc = selectedService?.trim();
      if (!svc) {
        setServicePreflightError(HILAI_PREMIUM.serviceRequired);
        return false;
      }
      setServicePreflightError(null);
      return submitBookingRaw({
        ...input,
        bookingCustomFields: {
          ...input.bookingCustomFields,
          treatmentType: svc,
        },
      });
    },
    [selectedService, submitBookingRaw],
  );

  const safeAvailability = useMemo(
    () => safeNormalizeAvailabilitySettings(availability, teacherId),
    [availability, teacherId],
  );

  const availableSlots = useMemo(() => {
    const appts = Array.isArray(sortedAppointments) ? sortedAppointments : [];
    try {
      return generateAvailableSlots({
        date: selectedDate,
        availability: safeAvailability,
        existingAppointments: appts,
      });
    } catch (e) {
      console.error("[PublicBookingPageContent] slot_generation_failed", e);
      return [];
    }
  }, [selectedDate, safeAvailability, sortedAppointments]);

  const selectedSlot = useMemo(
    () =>
      availableSlots.find((slot) => slot.slotStart === selectedSlotStart) ?? null,
    [availableSlots, selectedSlotStart],
  );

  const isSelectedSlotAvailable = useMemo(() => {
    if (!selectedSlotStart) return false;
    return availableSlots.some((s) => s.slotStart === selectedSlotStart);
  }, [availableSlots, selectedSlotStart]);

  const maxBookDateYmd = useMemo(() => {
    const da = safeAvailability.daysAhead;
    const ahead = Math.max(1, Number.isFinite(da) ? da : 30);
    return addLocalDaysYmd(new Date(), ahead - 1);
  }, [safeAvailability.daysAhead]);

  const publicBookingExtraFields = useMemo((): readonly CustomFieldDefinition[] => [], []);

  useEffect(() => {
    if (selectedService) setServicePreflightError(null);
  }, [selectedService]);

  useEffect(() => {
    const min = todayLocalYmd();
    if (selectedDate < min) {
      setSelectedDate(min);
      setSelectedSlotStart(null);
    }
    if (selectedDate > maxBookDateYmd) {
      setSelectedDate(maxBookDateYmd);
      setSelectedSlotStart(null);
    }
  }, [maxBookDateYmd, selectedDate]);

  useEffect(() => {
    if (isSuccess) return;
    if (selectedSlotStart && !isSelectedSlotAvailable) {
      setSelectedSlotStart(null);
      resetState();
    }
  }, [isSuccess, isSelectedSlotAvailable, selectedSlotStart, resetState]);

  useEffect(() => {
    if (!appointmentsLoadError) {
      toastShownForError.current = null;
      return;
    }
    if (toastShownForError.current === appointmentsLoadError) return;
    toastShownForError.current = appointmentsLoadError;
    toast(appointmentsLoadError, "error");
  }, [appointmentsLoadError, toast]);

  const lastToastedSubmitErr = useRef<string | null>(null);
  useEffect(() => {
    if (!error) {
      lastToastedSubmitErr.current = null;
      return;
    }
    if (lastToastedSubmitErr.current === error) return;
    lastToastedSubmitErr.current = error;
    toast(
      error.includes(heUi.publicBooking.errNetwork)
        ? heUi.publicBooking.toastNetworkError
        : heUi.publicBooking.toastSubmitFailed,
      "error",
    );
  }, [error, toast]);

  const handleBookAnother = useCallback(() => {
    resetState();
    setSelectedSlotStart(null);
    setSelectedService(null);
  }, [resetState]);

  const onDateChange = useCallback(
    (next: string) => {
      setSelectedDate(next);
      setSelectedSlotStart(null);
      resetState();
    },
    [resetState],
  );

  const onSlotSelect = useCallback(
    (slot: { slotStart: string }) => {
      setSelectedSlotStart(slot.slotStart);
      resetState();
    },
    [resetState],
  );

  const bookingDataReady = appointmentsReady;
  const businessLine = (identity.businessName ?? "").trim();
  const teacherLine = (identity.teacherName ?? "").trim();
  const phoneLine = (identity.phone ?? "").trim();

  const showSuccess = Boolean(isSuccess && successSnapshot);

  const hilaiStudioWhatsAppHref = useMemo(() => {
    const p = phoneLine.trim();
    if (!p) return null;
    return buildWhatsAppHref(p, "Hi! I have a quick question about booking.");
  }, [phoneLine]);

  const hilaiShowLimitedSlotsToday = useMemo(() => {
    if (showSuccess) return false;
    if (!bookingDataReady || !safeAvailability.bookingEnabled) return false;
    if (selectedDate !== todayLocalYmd()) return false;
    return availableSlots.length > 0;
  }, [
    availableSlots.length,
    bookingDataReady,
    safeAvailability.bookingEnabled,
    selectedDate,
    showSuccess,
  ]);

  const hilaiMainClass =
    "min-h-screen bg-gradient-to-b from-[#fff0f7] via-[#fffbfd] to-[#f5f0ff] pb-10 pt-4 sm:pb-14 sm:pt-6";
  const hilaiCardClass =
    "rounded-3xl border border-pink-100/50 bg-white/95 shadow-xl shadow-pink-200/20";

  return (
    <main
        className={cn(hilaiMainClass, "px-4 sm:px-6")}
        dir="ltr"
        lang="en"
      >
        <div className="mx-auto flex max-w-md flex-col gap-9 sm:gap-12">
          <HilaiPremiumHero
            headline={HILAI_PREMIUM.heroHeadline}
            subheadline={HILAI_PREMIUM.heroSub}
            brandName={(businessLine || "Hilai Nails").toUpperCase()}
            eyebrow={HILAI_PREMIUM.heroTrustMicro}
            logoUrl={branding?.logoUrl}
            accentColor={branding?.primaryColor}
          />
          <HilaiUrgencyStrip
            show={hilaiShowLimitedSlotsToday}
            title={HILAI_PREMIUM.urgencyLimitedToday}
            subtitle={HILAI_PREMIUM.urgencyLimitedTodaySub}
          />
          {hilaiStudioWhatsAppHref ? (
            <HilaiStudioWhatsAppLink
              href={hilaiStudioWhatsAppHref}
              label={HILAI_PREMIUM.studioWhatsAppCta}
            />
          ) : null}
          <HilaiGalleryStrip
            heading={HILAI_PREMIUM.galleryHeading}
            images={HILAI_GALLERY_IMAGES}
          />
          <HilaiReviewsSection
            heading={HILAI_PREMIUM.reviewsHeading}
            reviews={HILAI_PREMIUM_REVIEWS}
          />
          <HilaiSectionDivider />

          <div className="flex flex-col gap-3">
            {appointmentsLoadError ? (
              <DataLoadErrorBanner
                title={appointmentsLoadError}
                description={heUi.data.loadFailedHint}
                onRetry={retryAppointmentsLoad}
              />
            ) : null}
          </div>

          {showSuccess && successSnapshot ? (
            <PublicBookingSuccessPanel
              instructorPhone={phoneLine}
              slotStart={successSnapshot.slotStart}
              slotEnd={successSnapshot.slotEnd}
              onBookAnother={handleBookAnother}
              variant="hilai"
              copyOverrides={HILAI_SUCCESS_COPY}
              timeLocale="en-US"
            />
          ) : null}

          {!showSuccess ? (
            <>
              <section className={cn(ui.section, "space-y-0")}>
                <HilaiNailsServiceGrid
                  heading={HILAI_PREMIUM.sectionServices}
                  stepNumber={1}
                  serviceLabels={HILAI_SERVICE_LABEL_EN}
                  selected={selectedService}
                  onSelect={(name) => setSelectedService(name)}
                  disabled={isSubmitting}
                  slotDurationMinutes={safeAvailability.slotDurationMinutes}
                />
              </section>

              <HilaiSectionDivider />

              <section className={cn(ui.section, "space-y-4 sm:space-y-5")}>
                <HilaiSectionHeading
                  title={HILAI_PREMIUM.sectionDate}
                  stepNumber={2}
                />
                <div
                  className={cn(
                    ui.formCard,
                    hilaiCardClass,
                    "space-y-5 p-4 sm:space-y-6 sm:p-6",
                    "overflow-hidden",
                  )}
                >
                  {!bookingDataReady ? (
                    <BookingSectionSkeleton tone="hilai" />
                  ) : !safeAvailability.bookingEnabled ? (
                    <p className="text-sm leading-relaxed text-stone-600">
                      {HILAI_PREMIUM.bookingClosedFriendly}
                    </p>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <label
                          htmlFor="book-date-hilai"
                          className="text-xs font-medium text-stone-500 sm:text-sm"
                        >
                          {HILAI_PREMIUM.dateLabel}
                        </label>
                        <input
                          id="book-date-hilai"
                          type="date"
                          className={cn(
                            ui.input,
                            "min-h-[3rem] w-full min-w-0 rounded-2xl border-pink-100/90 bg-[#fefcfb] text-sm",
                            "text-stone-800 shadow-inner shadow-stone-100/80",
                            "transition-all duration-200 focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-200/60",
                          )}
                          min={todayLocalYmd()}
                          max={maxBookDateYmd}
                          value={selectedDate}
                          disabled={isSubmitting}
                          onChange={(e) => onDateChange(e.target.value)}
                        />
                      </div>

                      <BookingSlotPicker
                        availableSlots={availableSlots}
                        selectedSlotStart={selectedSlotStart}
                        onSelect={onSlotSelect}
                        disabled={isSubmitting}
                        emptyTitle={HILAI_PREMIUM.slotEmptyTitle}
                        emptyDescription={HILAI_PREMIUM.slotEmptyDescription}
                        tone="hilai"
                        slotHeadingOverride={HILAI_PREMIUM.slotIntro}
                        timeLocale="en-US"
                      />
                    </>
                  )}
                </div>
              </section>

              <HilaiSectionDivider />

              <section className={cn(ui.section, "space-y-4 sm:space-y-5")}>
                <HilaiSectionHeading title={HILAI_PREMIUM.sectionContact} stepNumber={3} />
                {phoneLine ? (
                  <p className="text-[13px] text-stone-500" dir="ltr">
                    {phoneLine}
                  </p>
                ) : null}
                <PublicBookingForm
                  extraFields={publicBookingExtraFields}
                  selectedSlot={selectedSlot}
                  isSelectedSlotAvailable={isSelectedSlotAvailable}
                  submitError={error}
                  isSubmitting={isSubmitting}
                  onSubmit={(input) => submitBooking(input)}
                  className={cn(
                    !isReady ? "opacity-80" : "",
                    "pb-[calc(5.5rem_+_env(safe-area-inset-bottom))] sm:pb-0",
                  )}
                  formCardClassName={hilaiCardClass}
                  preflightError={servicePreflightError}
                  submitIdleLabel={HILAI_PREMIUM.submitCta}
                  ctaHelperText={HILAI_PREMIUM.ctaHelper}
                  formCopy={HILAI_PREMIUM_FORM_COPY}
                  timeLocale="en-US"
                  visualTone="hilai"
                  stickyMobileCta
                  trustBeforeSubmit={
                    <PublicBookingTrustStrip
                      className="border-pink-100/80 bg-white/85 dark:border-pink-900/35 dark:bg-stone-900/45"
                      items={[
                        HILAI_PREMIUM.trustNoCalls,
                        HILAI_PREMIUM.trustQuickConfirm,
                        HILAI_PREMIUM.trustPrivacy,
                      ]}
                    />
                  }
                  submitButtonClassName="!min-h-[3.85rem] !rounded-xl !border-pink-300/90 !bg-gradient-to-r !from-pink-400 !via-pink-500 !to-fuchsia-500 !text-[17px] !font-bold !text-white !shadow-[0_14px_44px_-14px_rgba(219,39,119,0.5)] !transition-all !duration-200 hover:!brightness-[1.06] hover:!shadow-[0_18px_48px_-16px_rgba(219,39,119,0.45)] active:!scale-[0.96] active:!shadow-[0_8px_24px_-12px_rgba(219,39,119,0.4)] focus-visible:!outline-pink-400/70 sm:!static sm:!min-h-[3.4rem] sm:!shadow-[0_12px_36px_-16px_rgba(219,39,119,0.42)]"
                />
              </section>
            </>
          ) : null}
        </div>
      </main>
  );
}
