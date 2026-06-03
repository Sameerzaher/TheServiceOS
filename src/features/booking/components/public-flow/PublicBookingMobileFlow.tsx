"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { heUi } from "@/config";
import { getVerticalPreset } from "@/config/verticals/registry";
import { DataLoadErrorBanner } from "@/components/ui/DataLoadErrorBanner";
import { useToast } from "@/components/ui/Toast";
import { ui } from "@/components/ui/theme";
import type { AvailabilitySettings } from "@/core/types/availability";
import {
  safeNormalizeAvailabilitySettings,
} from "@/core/types/availability";
import type { BusinessType } from "@/core/types/teacher";
import { isValidIsraeliPhone } from "@/core/utils/israeliPhone";
import { useBooking } from "@/features/booking/hooks/useBooking";
import { usePublicTeacherAppointments } from "@/features/booking/hooks/usePublicTeacherAppointments";
import { generateAvailableSlots } from "@/features/booking/utils/generateAvailableSlots";
import {
  PublicBookingHero,
  PublicBookingTrustStrip,
} from "@/features/booking/components/public/PublicBookingHero";
import type { PublicBookingBranding, PublicBookingIdentity } from "@/features/booking/components/PublicBookingPageContent";
import { BookingStepper } from "./BookingStepper";
import { BookingForm } from "./BookingForm";
import { BookingSuccess } from "./BookingSuccess";
import { ServiceSelector } from "./ServiceSelector";
import { TimeSlotPicker } from "./TimeSlotPicker";
import type { BookingFlowStep, PublicCatalogService } from "./types";
import { cn } from "@/lib/cn";
import type { CSSProperties } from "react";

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

function buildPresetCatalog(
  businessType: BusinessType,
  fallbackDuration: number,
): PublicCatalogService[] {
  const preset = getVerticalPreset(businessType);
  return preset.defaultServices.map((s, i) => ({
    id: `preset:${i}`,
    name: s.name,
    price: typeof s.price === "number" ? s.price : 0,
    durationMinutes: typeof s.duration === "number" ? s.duration : fallbackDuration,
  }));
}

export interface PublicBookingMobileFlowProps {
  teacherId: string;
  businessType: BusinessType;
  identity: PublicBookingIdentity;
  availability: AvailabilitySettings;
  branding?: PublicBookingBranding | null;
  /** From bootstrap `services` — may be empty (fallback to vertical presets). */
  catalogServices: readonly PublicCatalogService[];
}

export function PublicBookingMobileFlow({
  teacherId,
  businessType,
  identity,
  availability,
  branding = null,
  catalogServices,
}: PublicBookingMobileFlowProps) {
  const toast = useToast();
  const verticalPreset = useMemo(() => getVerticalPreset(businessType), [businessType]);

  const safeAvailability = useMemo(
    () => safeNormalizeAvailabilitySettings(availability, teacherId),
    [availability, teacherId],
  );

  const services = useMemo((): PublicCatalogService[] => {
    if (catalogServices.length > 0) return [...catalogServices];
    const fd = Math.max(
      15,
      Math.trunc(
        Number.isFinite(safeAvailability.slotDurationMinutes)
          ? safeAvailability.slotDurationMinutes
          : 45,
      ),
    );
    return buildPresetCatalog(businessType, fd);
  }, [catalogServices, businessType, safeAvailability.slotDurationMinutes]);

  const [step, setStep] = useState<BookingFlowStep>(1);
  const [selectedService, setSelectedService] = useState<PublicCatalogService | null>(
    null,
  );
  const [selectedDate, setSelectedDate] = useState<string>(() => todayLocalYmd());
  const [selectedSlotStart, setSelectedSlotStart] = useState<string | null>(null);
  const [selectedSlotEnd, setSelectedSlotEnd] = useState<string | null>(null);
  const [form, setForm] = useState({ fullName: "", phone: "", notes: "" });
  const [formErrors, setFormErrors] = useState<Partial<Record<"fullName" | "phone" | "notes", string>>>({});

  const [appointmentsReloadKey, setAppointmentsReloadKey] = useState(0);
  const {
    sortedAppointments,
    isReady: appointmentsReady,
    loadError: appointmentsLoadError,
    retryLoad: retryAppointmentsLoad,
  } = usePublicTeacherAppointments(teacherId, appointmentsReloadKey);

  const {
    isSubmitting,
    isSuccess,
    error,
    successSnapshot,
    submitBooking,
    resetState,
  } = useBooking({
    teacherId,
    onPublicBookingSuccess: () => setAppointmentsReloadKey((k) => k + 1),
  });

  const maxBookDateYmd = useMemo(() => {
    const da = safeAvailability.daysAhead;
    const ahead = Math.max(1, Number.isFinite(da) ? da : 30);
    return addLocalDaysYmd(new Date(), ahead - 1);
  }, [safeAvailability.daysAhead]);

  const slotDurationOverride = selectedService?.durationMinutes;

  const availableSlots = useMemo(() => {
    const appts = Array.isArray(sortedAppointments) ? sortedAppointments : [];
    try {
      return generateAvailableSlots({
        date: selectedDate,
        availability: safeAvailability,
        existingAppointments: appts,
        slotDurationMinutesOverride: slotDurationOverride,
      });
    } catch {
      return [];
    }
  }, [selectedDate, safeAvailability, sortedAppointments, slotDurationOverride]);

  const selectedSlot = useMemo(() => {
    if (!selectedSlotStart) return null;
    return availableSlots.find((s) => s.slotStart === selectedSlotStart) ?? null;
  }, [availableSlots, selectedSlotStart]);

  const isSlotStillValid = useMemo(() => {
    if (!selectedSlotStart) return false;
    return availableSlots.some((s) => s.slotStart === selectedSlotStart);
  }, [availableSlots, selectedSlotStart]);

  useEffect(() => {
    const min = todayLocalYmd();
    if (selectedDate < min) {
      setSelectedDate(min);
      setSelectedSlotStart(null);
      setSelectedSlotEnd(null);
    }
    if (selectedDate > maxBookDateYmd) {
      setSelectedDate(maxBookDateYmd);
      setSelectedSlotStart(null);
      setSelectedSlotEnd(null);
    }
  }, [maxBookDateYmd, selectedDate]);

  useEffect(() => {
    if (!selectedService) return;
    setSelectedSlotStart(null);
    setSelectedSlotEnd(null);
    resetState();
  }, [selectedService?.id, resetState]);

  useEffect(() => {
    setSelectedSlotStart(null);
    setSelectedSlotEnd(null);
    resetState();
  }, [selectedDate, resetState]);

  const onSlotSelect = useCallback(
    (slot: { slotStart: string; slotEnd: string }) => {
      setSelectedSlotStart(slot.slotStart);
      setSelectedSlotEnd(slot.slotEnd);
      resetState();
    },
    [resetState],
  );

  const validateForm = useCallback((): boolean => {
    const next: Partial<Record<"fullName" | "phone" | "notes", string>> = {};
    const name = form.fullName.trim();
    if (name.length < 2) {
      next.fullName = "נא להזין שם מלא (לפחות 2 תווים).";
    }
    const phone = form.phone.trim();
    if (!phone) {
      next.phone = "נא להזין מספר טלפון.";
    } else if (!isValidIsraeliPhone(phone)) {
      next.phone = "מספר טלפון לא תקין (פורמט ישראלי: 05x…).";
    }
    setFormErrors(next);
    return Object.keys(next).length === 0;
  }, [form.fullName, form.phone]);

  const buildCustomFields = useCallback((): Record<string, string> => {
    const cf: Record<string, string> = {};
    const svcName = selectedService?.name?.trim();
    if (
      svcName &&
      verticalPreset.publicBookingFields.some((f) => f.key === "treatmentType")
    ) {
      cf.treatmentType = svcName;
    }
    return cf;
  }, [selectedService?.name, verticalPreset.publicBookingFields]);

  const handlePrimaryCta = useCallback(async () => {
    if (step === 1) {
      if (!selectedService) {
        toast("נא לבחור שירות.", "error");
        return;
      }
      setStep(2);
      return;
    }
    if (step === 2) {
      setStep(3);
      return;
    }
    if (step === 3) {
      if (!selectedSlotStart || !selectedSlot || !isSlotStillValid) {
        toast("נא לבחור שעה.", "error");
        return;
      }
      setStep(4);
      return;
    }
    if (step === 4) {
      if (!selectedSlot || !selectedService) return;
      if (!validateForm()) return;
      const end =
        selectedSlotEnd ??
        selectedSlot.slotEnd;
      const ok = await submitBooking({
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        notes: form.notes.trim(),
        slotStart: selectedSlot.slotStart,
        slotEnd: end,
        bookingCustomFields: buildCustomFields(),
        serviceName: selectedService.name,
      });
      if (ok) setStep(5);
      else toast(heUi.publicBooking.toastSubmitFailed, "error");
    }
  }, [
    step,
    selectedService,
    selectedSlotStart,
    selectedSlot,
    selectedSlotEnd,
    isSlotStillValid,
    validateForm,
    form,
    submitBooking,
    buildCustomFields,
    toast,
  ]);

  const goBack = useCallback(() => {
    if (step <= 1 || step >= 5) return;
    setStep((s) => (s > 1 ? ((s - 1) as BookingFlowStep) : s));
  }, [step]);

  const handleBookAnother = useCallback(() => {
    resetState();
    setStep(1);
    setSelectedService(null);
    setSelectedDate(todayLocalYmd());
    setSelectedSlotStart(null);
    setSelectedSlotEnd(null);
    setForm({ fullName: "", phone: "", notes: "" });
    setFormErrors({});
  }, [resetState]);

  const accentVar = branding?.primaryColor
    ? "--public-booking-accent"
    : undefined;
  const showSuccess = Boolean(isSuccess && successSnapshot && step === 5 && !isSubmitting);

  const ctaDisabled =
    (step === 1 && !selectedService) ||
    (step === 3 &&
      (!selectedSlotStart ||
        !isSlotStillValid ||
        !appointmentsReady ||
        !safeAvailability.bookingEnabled)) ||
    isSubmitting ||
    ((step === 1 || step === 2 || step === 4) && !safeAvailability.bookingEnabled);

  const ctaLabel =
    step === 4 ? "קבע תור" : step < 5 ? "המשך" : "";

  const progressLabel = `שלב ${Math.min(step, 4)} מתוך 4`;

  const phoneLine = (identity.phone ?? "").trim();
  const businessLine = (identity.businessName ?? "").trim();
  const teacherLine = (identity.teacherName ?? "").trim();

  return (
    <main
      className="min-h-dvh bg-neutral-50 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-4 dark:bg-neutral-950 sm:pb-10 sm:pt-6"
      style={
        branding?.primaryColor
          ? ({
              ["--public-booking-accent"]: branding.primaryColor,
            } as CSSProperties)
          : undefined
      }
    >
      <div className="mx-auto w-full max-w-[420px] px-4">
        <PublicBookingHero
          businessName={businessLine || heUi.publicBooking.pageTitle}
          teacherName={teacherLine || undefined}
          logoUrl={branding?.logoUrl}
          accentColor={branding?.primaryColor}
        />

        {phoneLine ? (
          <p
            className="mb-6 text-center text-sm font-medium text-neutral-600 dark:text-neutral-400"
            dir="ltr"
          >
            {phoneLine}
          </p>
        ) : null}

        {appointmentsLoadError ? (
          <div className="mb-4">
            <DataLoadErrorBanner
              title={appointmentsLoadError}
              description={heUi.data.loadFailedHint}
              onRetry={retryAppointmentsLoad}
            />
          </div>
        ) : null}

        {showSuccess && successSnapshot ? (
          <BookingSuccess
            slotStart={successSnapshot.slotStart}
            slotEnd={successSnapshot.slotEnd}
            serviceName={successSnapshot.serviceName ?? selectedService?.name}
            instructorPhone={phoneLine}
            onBookAnother={handleBookAnother}
            accentColor={branding?.primaryColor}
          />
        ) : (
          <>
            {step < 5 ? (
              <BookingStepper
                activeStep={step}
                progressLabel={progressLabel}
                accentVar={accentVar}
                className="mb-6"
              >
                {step > 1 && step < 5 ? (
                  <button
                    type="button"
                    onClick={goBack}
                    className="mb-3 text-sm font-medium text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400"
                  >
                    ← חזרה
                  </button>
                ) : null}

                {step === 1 ? (
                  <section className="space-y-3">
                    <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                      בחרו שירות
                    </h2>
                    <ServiceSelector
                      services={services}
                      selectedId={selectedService?.id ?? null}
                      onSelect={setSelectedService}
                      disabled={isSubmitting}
                      accentVar={accentVar}
                    />
                  </section>
                ) : null}

                {step === 2 ? (
                  <section className="space-y-3">
                    <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                      {heUi.publicBooking.sectionDate}
                    </h2>
                    <label className={cn(ui.label, "text-sm font-semibold")} htmlFor="pb-flow-date">
                      תאריך
                    </label>
                    <input
                      id="pb-flow-date"
                      type="date"
                      className={cn(
                        ui.input,
                        "min-h-[48px] w-full rounded-2xl text-base",
                      )}
                      min={todayLocalYmd()}
                      max={maxBookDateYmd}
                      value={selectedDate}
                      disabled={isSubmitting}
                      onChange={(e) => {
                        setSelectedDate(e.target.value);
                        setSelectedSlotStart(null);
                        setSelectedSlotEnd(null);
                      }}
                    />
                  </section>
                ) : null}

                {step === 3 ? (
                  <section className="space-y-3">
                    <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                      {heUi.publicBooking.slotHeading}
                    </h2>
                    {!safeAvailability.bookingEnabled ? (
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        {heUi.publicBooking.bookingClosed}
                      </p>
                    ) : (
                      <TimeSlotPicker
                        isLoading={!appointmentsReady}
                        availableSlots={availableSlots}
                        selectedSlotStart={selectedSlotStart}
                        onSelect={onSlotSelect}
                        disabled={isSubmitting}
                        emptyTitle={heUi.publicBooking.slotEmptyTitle}
                        emptyDescription={heUi.publicBooking.slotEmptyDescription}
                      />
                    )}
                  </section>
                ) : null}

                {step === 4 ? (
                  <section className="space-y-3">
                    <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                      פרטי קשר
                    </h2>
                    <BookingForm
                      values={form}
                      onChange={(p) => setForm((f) => ({ ...f, ...p }))}
                      errors={formErrors}
                      disabled={isSubmitting}
                    />
                    <PublicBookingTrustStrip className="mt-2" />
                  </section>
                ) : null}
              </BookingStepper>
            ) : null}

            {error && step === 4 ? (
              <p className="mt-2 text-center text-sm font-medium text-red-600" role="alert">
                {error}
              </p>
            ) : null}
          </>
        )}
      </div>

      {!showSuccess && step < 5 ? (
        <div
          className="fixed bottom-0 left-0 right-0 z-50 border-t border-neutral-200/90 bg-white/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-950/95"
        >
          <div className="mx-auto w-full max-w-[420px]">
            <button
              type="button"
              onClick={() => void handlePrimaryCta()}
              disabled={ctaDisabled}
              className={cn(
                "flex min-h-[48px] w-full items-center justify-center rounded-2xl border-2 border-emerald-600 bg-gradient-to-r from-emerald-600 to-teal-600 text-base font-bold text-white shadow-lg transition hover:from-emerald-700 hover:to-teal-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-emerald-500 dark:from-emerald-500 dark:to-teal-600",
              )}
              style={
                branding?.primaryColor
                  ? {
                      borderColor: branding.primaryColor,
                      background: `linear-gradient(90deg, ${branding.primaryColor}, #0d9488)`,
                    }
                  : undefined
              }
            >
              {isSubmitting && step === 4 ? "שולח…" : ctaLabel}
            </button>
            <p className="mt-2 text-center text-xs text-neutral-500">
              {heUi.publicBooking.whatsappHelper}
            </p>
          </div>
        </div>
      ) : null}
    </main>
  );
}
