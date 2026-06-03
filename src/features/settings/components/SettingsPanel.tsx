"use client";

import { useEffect, useMemo, useState } from "react";

import { heUi } from "@/config";
import { Button, ui } from "@/components/ui";
import type { AvailabilitySettings } from "@/core/types/availability";
import type { ActivePreset, AppSettings } from "@/core/types/settings";
import { applyReminderTemplate } from "@/core/utils/reminderTemplate";
import { cn } from "@/lib/cn";
import { GoogleCalendarSettingsCard } from "@/features/settings/components/GoogleCalendarSettingsCard";
import { useAuth } from "@/features/auth/AuthContext";

export interface SettingsPanelProps {
  settings: AppSettings;
  availabilitySettings: AvailabilitySettings;
  onSave: (
    next: AppSettings,
    nextAvailability: AvailabilitySettings,
  ) => Promise<boolean> | boolean;
}

const ACTIVE_PRESET_OPTIONS: ReadonlyArray<{
  value: ActivePreset;
  label: string;
}> = [
  {
    value: "driving_instructor",
    label: heUi.settings.activePresetDrivingInstructor,
  },
  {
    value: "cosmetic_clinic",
    label: heUi.settings.activePresetCosmeticClinic,
  },
];

export function SettingsPanel({
  settings,
  availabilitySettings,
  onSave,
}: SettingsPanelProps) {
  const { isAdmin } = useAuth();
  const [draft, setDraft] = useState(settings);
  const [bookingEnabled, setBookingEnabled] = useState(
    availabilitySettings.bookingEnabled,
  );
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setDraft(settings);
  }, [settings]);
  useEffect(() => {
    setBookingEnabled(availabilitySettings.bookingEnabled);
  }, [availabilitySettings.bookingEnabled]);

  const reminderPreview = useMemo(
    () =>
      applyReminderTemplate(draft.reminderTemplate, {
        name: heUi.settings.previewStudentName,
        time: heUi.settings.previewLessonTime,
        date: heUi.settings.previewLessonDate,
        businessName:
          draft.businessName.trim() || heUi.settings.previewBusinessFallback,
        businessPhone:
          draft.businessPhone.trim() || heUi.settings.previewPhoneFallback,
      }),
    [
      draft.reminderTemplate,
      draft.businessName,
      draft.businessPhone,
    ],
  );

  const paymentReminderPreview = useMemo(
    () =>
      applyReminderTemplate(draft.paymentReminderTemplate, {
        name: heUi.settings.previewStudentName,
        time: heUi.settings.previewLessonTime,
        date: heUi.settings.previewLessonDate,
        businessName:
          draft.businessName.trim() || heUi.settings.previewBusinessFallback,
        businessPhone:
          draft.businessPhone.trim() || heUi.settings.previewPhoneFallback,
        amountDue: heUi.settings.previewAmountDue,
      }),
    [
      draft.paymentReminderTemplate,
      draft.businessName,
      draft.businessPhone,
    ],
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Public booking branding */}
      <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-800 sm:p-6">
        <h2 className="mb-1 text-base font-semibold text-neutral-900 dark:text-neutral-100 sm:text-lg">
          מיתוג דף ההזמנה הציבורי
        </h2>
        <p className="mb-4 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400 sm:text-sm">
          הלקוחות רואים לוגו וצבעים בקישור לקביעת תור — כדי שירגישו את המותג שלכם, לא &quot;מערכת גנרית&quot;.
        </p>
        <div className="space-y-4">
          <div>
            <label htmlFor="settings-brand-logo" className={cn(ui.label, "text-xs sm:text-sm")}>
              כתובת תמונת לוגו (HTTPS)
            </label>
            <input
              id="settings-brand-logo"
              type="url"
              inputMode="url"
              autoComplete="off"
              placeholder="https://…"
              dir="ltr"
              value={draft.brandLogoUrl}
              onChange={(e) =>
                setDraft((d) => ({ ...d, brandLogoUrl: e.target.value.trim() }))
              }
              className={cn(ui.input, "text-xs sm:text-sm")}
            />
            <p className="mt-1 text-[10px] text-neutral-500 dark:text-neutral-400 sm:text-xs">
              PNG או JPG בכתובת ציבורית (למשל מהאתר או מענן). רק קישורי HTTPS.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="settings-brand-primary" className={cn(ui.label, "text-xs sm:text-sm")}>
                צבע ראשי
              </label>
              <div className="flex items-center gap-3">
                <input
                  id="settings-brand-primary"
                  type="color"
                  value={
                    /^#[0-9A-Fa-f]{6}$/.test(draft.brandPrimaryColor)
                      ? draft.brandPrimaryColor
                      : "#059669"
                  }
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, brandPrimaryColor: e.target.value }))
                  }
                  className="h-10 w-14 cursor-pointer rounded border border-neutral-200 bg-white p-0.5 dark:border-neutral-600"
                />
                <input
                  type="text"
                  dir="ltr"
                  value={draft.brandPrimaryColor}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, brandPrimaryColor: e.target.value.trim() }))
                  }
                  className={cn(ui.input, "min-w-0 flex-1 font-mono text-xs sm:text-sm")}
                  placeholder="#059669"
                />
              </div>
            </div>
            <div>
              <label htmlFor="settings-brand-accent" className={cn(ui.label, "text-xs sm:text-sm")}>
                צבע משני / הדגשות
              </label>
              <div className="flex items-center gap-3">
                <input
                  id="settings-brand-accent"
                  type="color"
                  value={
                    /^#[0-9A-Fa-f]{6}$/.test(draft.brandAccentColor)
                      ? draft.brandAccentColor
                      : "#0d9488"
                  }
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, brandAccentColor: e.target.value }))
                  }
                  className="h-10 w-14 cursor-pointer rounded border border-neutral-200 bg-white p-0.5 dark:border-neutral-600"
                />
                <input
                  type="text"
                  dir="ltr"
                  value={draft.brandAccentColor}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, brandAccentColor: e.target.value.trim() }))
                  }
                  className={cn(ui.input, "min-w-0 flex-1 font-mono text-xs sm:text-sm")}
                  placeholder="#0d9488"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Business Info Section */}
      <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-800 sm:p-6">
        <h2 className="mb-3 text-base font-semibold text-neutral-900 dark:text-neutral-100 sm:mb-4 sm:text-lg">
          פרטי העסק
        </h2>
        
        <div className="space-y-3 sm:space-y-4">
          <div>
            <label htmlFor="settings-business" className={cn(ui.label, "text-xs sm:text-sm")}>
              {heUi.settings.businessName}
            </label>
            <input
              id="settings-business"
              type="text"
              value={draft.businessName}
              onChange={(e) =>
                setDraft((d) => ({ ...d, businessName: e.target.value }))
              }
              className={cn(ui.input, "text-xs sm:text-sm")}
              placeholder="השם שיופיע ללקוחות"
              autoComplete="organization"
            />
            <p className="mt-1 text-[10px] text-neutral-500 dark:text-neutral-400 sm:text-xs">
              {heUi.settings.businessNameHint}
            </p>
          </div>

          <div>
            <label htmlFor="settings-teacher-name" className={cn(ui.label, "text-xs sm:text-sm")}>
              {heUi.settings.teacherName}
            </label>
            <input
              id="settings-teacher-name"
              type="text"
              value={draft.teacherName}
              onChange={(e) =>
                setDraft((d) => ({ ...d, teacherName: e.target.value }))
              }
              className={cn(ui.input, "text-xs sm:text-sm")}
              placeholder={heUi.settings.teacherNamePlaceholder}
              autoComplete="name"
            />
          </div>

          <div>
            <label htmlFor="settings-business-phone" className={cn(ui.label, "text-xs sm:text-sm")}>
              {heUi.settings.businessPhone}
            </label>
            <input
              id="settings-business-phone"
              type="tel"
              value={draft.businessPhone}
              onChange={(e) =>
                setDraft((d) => ({ ...d, businessPhone: e.target.value }))
              }
              className={cn(ui.input, "text-xs sm:text-sm")}
              inputMode="tel"
              autoComplete="tel"
              placeholder="050-0000000"
            />
            <p className="mt-1 text-[10px] text-neutral-500 dark:text-neutral-400 sm:text-xs">
              {heUi.settings.businessPhoneHint}
            </p>
          </div>
        </div>
      </div>

      {/* Lesson Defaults Section */}
      <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-800 sm:p-6">
        <h2 className="mb-3 text-base font-semibold text-neutral-900 dark:text-neutral-100 sm:mb-4 sm:text-lg">
          הגדרות שיעורים
        </h2>
        
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
          <div>
            <label htmlFor="settings-price" className={cn(ui.label, "text-xs sm:text-sm")}>
              {heUi.settings.defaultLessonPrice}
            </label>
            <div className="relative">
              <input
                id="settings-price"
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                value={draft.defaultLessonPrice === 0 ? "" : draft.defaultLessonPrice}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "") {
                    setDraft((d) => ({ ...d, defaultLessonPrice: 0 }));
                    return;
                  }
                  const n = Number.parseInt(v, 10);
                  setDraft((d) => ({
                    ...d,
                    defaultLessonPrice: Number.isFinite(n) ? Math.max(0, n) : 0,
                  }));
                }}
                className={cn(ui.input, "text-xs sm:text-sm")}
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 sm:text-sm">
                ₪
              </span>
            </div>
            <p className="mt-1 text-[10px] text-neutral-500 dark:text-neutral-400 sm:text-xs">
              {heUi.settings.defaultLessonPriceHint}
            </p>
          </div>

          <div>
            <label htmlFor="settings-duration" className={cn(ui.label, "text-xs sm:text-sm")}>
              {heUi.settings.defaultLessonDuration}
            </label>
            <div className="relative">
              <input
                id="settings-duration"
                type="number"
                min={15}
                max={240}
                step={5}
                inputMode="numeric"
                value={draft.defaultLessonDurationMinutes}
                onChange={(e) => {
                  const v = e.target.value;
                  const n = Number.parseInt(v, 10);
                  setDraft((d) => ({
                    ...d,
                    defaultLessonDurationMinutes: Number.isFinite(n)
                      ? Math.min(240, Math.max(15, n))
                      : d.defaultLessonDurationMinutes,
                  }));
                }}
                className={cn(ui.input, "text-xs sm:text-sm")}
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 sm:text-sm">
                {"דק'"}
              </span>
            </div>
            <p className="mt-1 text-[10px] text-neutral-500 dark:text-neutral-400 sm:text-xs">
              {heUi.settings.defaultLessonDurationHint}
            </p>
          </div>
        </div>

        <div className="mt-3 sm:mt-4">
          <label htmlFor="settings-buffer" className={cn(ui.label, "text-xs sm:text-sm")}>
            {heUi.settings.lessonBuffer}
          </label>
          <div className="relative max-w-full sm:max-w-xs">
            <input
              id="settings-buffer"
              type="number"
              min={0}
              max={120}
              step={5}
              inputMode="numeric"
              value={draft.lessonBufferMinutes}
              onChange={(e) => {
                const v = e.target.value;
                const n = Number.parseInt(v, 10);
                setDraft((d) => ({
                  ...d,
                  lessonBufferMinutes: Number.isFinite(n)
                    ? Math.min(120, Math.max(0, n))
                    : d.lessonBufferMinutes,
                }));
              }}
              className={cn(ui.input, "text-xs sm:text-sm")}
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 sm:text-sm">
              {"דק'"}
            </span>
          </div>
          <p className="mt-1 text-[10px] text-neutral-500 dark:text-neutral-400 sm:text-xs">
            {heUi.settings.lessonBufferHint}
          </p>
        </div>
      </div>

      {/* Working Hours & Booking Section */}
      <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-800 sm:p-6">
        <h2 className="mb-3 text-base font-semibold text-neutral-900 dark:text-neutral-100 sm:mb-4 sm:text-lg">
          שעות עבודה והזמנות
        </h2>
        
        <div className="space-y-3 sm:space-y-4">
          <div className="rounded-lg border border-emerald-100 bg-emerald-50/50 p-3 dark:border-emerald-900 dark:bg-emerald-950/20 sm:p-4">
            <label
              htmlFor="settings-booking-enabled"
              className="mb-2 flex items-center justify-between"
            >
              <span className="text-xs font-medium text-neutral-800 dark:text-neutral-200 sm:text-sm">
                {heUi.settings.bookingEnabled}
              </span>
              <input
                id="settings-booking-enabled"
                type="checkbox"
                checked={bookingEnabled}
                onChange={(e) => setBookingEnabled(e.target.checked)}
                className="size-5 rounded border-neutral-300 text-emerald-600 focus:ring-emerald-500"
              />
            </label>
            <p className="text-[10px] text-neutral-600 dark:text-neutral-400 sm:text-xs">{heUi.settings.bookingHint}</p>
          </div>

          <div>
            <p className={cn(ui.label, "text-xs sm:text-sm")}>{heUi.settings.workingHours}</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="settings-working-start" className="mb-1 block text-[11px] text-neutral-700 dark:text-neutral-300 sm:text-sm">
                  {heUi.settings.workingHoursStart}
                </label>
                <input
                  id="settings-working-start"
                  type="time"
                  value={draft.workingHoursStart}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, workingHoursStart: e.target.value }))
                  }
                  className={cn(ui.input, "text-xs sm:text-sm")}
                />
              </div>
              <div>
                <label htmlFor="settings-working-end" className="mb-1 block text-[11px] text-neutral-700 dark:text-neutral-300 sm:text-sm">
                  {heUi.settings.workingHoursEnd}
                </label>
                <input
                  id="settings-working-end"
                  type="time"
                  value={draft.workingHoursEnd}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, workingHoursEnd: e.target.value }))
                  }
                  className={cn(ui.input, "text-xs sm:text-sm")}
                />
              </div>
            </div>
            <p className="mt-1 text-[10px] text-neutral-500 dark:text-neutral-400 sm:text-xs">{heUi.settings.workingHoursHint}</p>
          </div>
        </div>
      </div>

      {/* Reminder Template Section */}
      <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-800 sm:p-6">
        <h2 className="mb-3 text-base font-semibold text-neutral-900 dark:text-neutral-100 sm:mb-4 sm:text-lg">
          תזכורות ללקוחות
        </h2>

        <div className="mb-6 space-y-3 rounded-lg border border-neutral-100 bg-neutral-50/80 p-3 dark:border-neutral-600 dark:bg-neutral-900/40 sm:p-4">
          <label className="flex cursor-pointer items-start gap-3 text-sm text-neutral-800 dark:text-neutral-200">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-neutral-300 text-emerald-600 focus:ring-emerald-500"
              checked={draft.remindersEnabled}
              onChange={(e) =>
                setDraft((d) => ({ ...d, remindersEnabled: e.target.checked }))
              }
            />
            <span>
              <span className="font-medium">{heUi.settings.remindersEnabled}</span>
              <span className="mt-1 block text-xs font-normal text-neutral-600 dark:text-neutral-400">
                {heUi.settings.remindersEnabledHint}
              </span>
            </span>
          </label>
          <div className="ms-7 flex flex-col gap-2.5 border-t border-neutral-200/80 pt-3 dark:border-neutral-600">
            <label className="flex cursor-pointer items-center gap-2.5 text-sm text-neutral-800 dark:text-neutral-200">
              <input
                type="checkbox"
                className="h-4 w-4 shrink-0 rounded border-neutral-300 text-emerald-600 focus:ring-emerald-500"
                checked={draft.reminderTomorrow}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    reminderTomorrow: e.target.checked,
                  }))
                }
              />
              {heUi.settings.reminderChannelTomorrow}
            </label>
            <label className="flex cursor-pointer items-center gap-2.5 text-sm text-neutral-800 dark:text-neutral-200">
              <input
                type="checkbox"
                className="h-4 w-4 shrink-0 rounded border-neutral-300 text-emerald-600 focus:ring-emerald-500"
                checked={draft.reminderSameDay}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    reminderSameDay: e.target.checked,
                  }))
                }
              />
              {heUi.settings.reminderChannelSameDay}
            </label>
            <label className="flex cursor-pointer items-center gap-2.5 text-sm text-neutral-800 dark:text-neutral-200">
              <input
                type="checkbox"
                className="h-4 w-4 shrink-0 rounded border-neutral-300 text-emerald-600 focus:ring-emerald-500"
                checked={draft.reminderPaymentUnpaid}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    reminderPaymentUnpaid: e.target.checked,
                  }))
                }
              />
              {heUi.settings.reminderChannelPayment}
            </label>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label htmlFor="settings-template" className={cn(ui.label, "text-xs sm:text-sm")}>
              {heUi.settings.reminderTemplate}
            </label>
            <textarea
              id="settings-template"
              value={draft.reminderTemplate}
              onChange={(e) =>
                setDraft((d) => ({ ...d, reminderTemplate: e.target.value }))
              }
              rows={4}
              className={cn(ui.input, "min-h-[6rem] resize-y font-mono text-xs sm:text-sm")}
            />
            <p className="mt-1 text-[10px] text-neutral-500 dark:text-neutral-400 sm:text-xs">
              {heUi.settings.reminderTemplateHint}
            </p>
            <div
              className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50/60 p-2.5 dark:border-emerald-900 dark:bg-emerald-950/20 sm:p-3"
              aria-live="polite"
            >
              <p className="text-[10px] font-medium uppercase tracking-wide text-emerald-900/70 dark:text-emerald-400/70 sm:text-xs">
                {heUi.settings.reminderPreviewTitle}
              </p>
              <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-neutral-900 dark:text-neutral-100 sm:text-sm">
                {reminderPreview}
              </p>
            </div>
          </div>

          <div>
            <label
              htmlFor="settings-sameday-template"
              className={cn(ui.label, "text-xs sm:text-sm")}
            >
              {heUi.settings.sameDayReminderTemplate}
            </label>
            <textarea
              id="settings-sameday-template"
              value={draft.sameDayReminderTemplate}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  sameDayReminderTemplate: e.target.value,
                }))
              }
              rows={3}
              placeholder={heUi.settings.reminderTemplate}
              className={cn(ui.input, "min-h-[5rem] resize-y font-mono text-xs sm:text-sm")}
            />
            <p className="mt-1 text-[10px] text-neutral-500 dark:text-neutral-400 sm:text-xs">
              {heUi.settings.sameDayReminderTemplateHint}
            </p>
          </div>

          <div>
            <label
              htmlFor="settings-payment-template"
              className={cn(ui.label, "text-xs sm:text-sm")}
            >
              {heUi.settings.paymentReminderTemplate}
            </label>
            <textarea
              id="settings-payment-template"
              value={draft.paymentReminderTemplate}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  paymentReminderTemplate: e.target.value,
                }))
              }
              rows={4}
              className={cn(ui.input, "min-h-[6rem] resize-y font-mono text-xs sm:text-sm")}
            />
            <p className="mt-1 text-[10px] text-neutral-500 dark:text-neutral-400 sm:text-xs">
              {heUi.settings.paymentReminderTemplateHint}
            </p>
            <div
              className="mt-3 rounded-lg border border-amber-100 bg-amber-50/60 p-2.5 dark:border-amber-900 dark:bg-amber-950/20 sm:p-3"
              aria-live="polite"
            >
              <p className="text-[10px] font-medium uppercase tracking-wide text-amber-900/70 dark:text-amber-400/70 sm:text-xs">
                {heUi.settings.paymentReminderPreviewTitle}
              </p>
              <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-neutral-900 dark:text-neutral-100 sm:text-sm">
                {paymentReminderPreview}
              </p>
            </div>
          </div>
        </div>
      </div>

      <GoogleCalendarSettingsCard />

      {/* Save Button - Sticky on Mobile */}
      <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] z-30 -mx-2 border-t border-neutral-200 bg-white/95 px-2 pb-3 pt-3 backdrop-blur dark:border-neutral-700 dark:bg-neutral-900/95 sm:static sm:bottom-0 sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-0">
        <Button
          type="button"
          variant="primary"
          className="w-full text-sm sm:w-auto"
          disabled={isSaving}
          aria-busy={isSaving}
          onClick={() => {
            if (isSaving) return;
            setIsSaving(true);
            const weekly = { ...availabilitySettings.weeklyAvailability };
            for (const day of Object.keys(weekly) as Array<keyof typeof weekly>) {
              weekly[day] = {
                ...weekly[day],
                startTime: draft.workingHoursStart,
                endTime: draft.workingHoursEnd,
              };
            }
            void (async () => {
              try {
                await onSave(draft, {
                  ...availabilitySettings,
                  bookingEnabled,
                  weeklyAvailability: weekly,
                });
              } finally {
                setIsSaving(false);
              }
            })();
          }}
        >
          {isSaving ? heUi.settings.saving : heUi.settings.save}
        </Button>
      </div>
    </div>
  );
}
