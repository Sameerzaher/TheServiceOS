"use client";

import {
  type FormEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { heUi } from "@/config";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { ui } from "@/components/ui/theme";
import type { AvailableSlot } from "@/features/booking/utils/generateAvailableSlots";
import {
  CustomFieldInputKind,
  type CustomFieldDefinition,
} from "@/core/types/vertical";
import { cn } from "@/lib/cn";

export interface PublicBookingFormSubmitInput {
  fullName: string;
  phone: string;
  notes: string;
  slotStart: string;
  slotEnd: string;
  bookingCustomFields: Record<string, string>;
}

export interface PublicBookingFormProps {
  extraFields: readonly CustomFieldDefinition[];
  selectedSlot: AvailableSlot | null;
  /** False if the slot was taken / no longer in the generated list (race). */
  isSelectedSlotAvailable: boolean;
  onSubmit: (input: PublicBookingFormSubmitInput) => Promise<boolean> | boolean;
  submitError?: string | null;
  isSubmitting: boolean;
  className?: string;
  /** Shown above the submit button (e.g. missing service selection). */
  preflightError?: string | null;
  /** Override default CTA label (idle state). */
  submitIdleLabel?: string;
  /** Extra classes for the outer form card (branded public pages). */
  formCardClassName?: string;
  /** Override primary CTA appearance (e.g. branded gradient). */
  submitButtonClassName?: string;
  /** Softer field + slot summary styling for branded public demos (no logic change). */
  visualTone?: "default" | "hilai";
  /** Pin primary CTA to bottom on small screens (Hilai demo). */
  stickyMobileCta?: boolean;
  /** Short reassurance line above the primary CTA (conversion copy). */
  ctaHelperText?: string;
  /** Friendly labels/messages (e.g. English premium booking page). */
  formCopy?: PublicBookingFormCopy;
  /** Locale for displaying selected time range (default Hebrew). */
  timeLocale?: string;
  /** Hide notes and optional `extraFields` (only `required` extras stay). Parent should filter extras when using service cards. */
  minimalContact?: boolean;
  /** Trust bullets / reassurance rendered above the primary CTA. */
  trustBeforeSubmit?: ReactNode;
}

export type PublicBookingFormCopy = {
  labels?: Partial<{
    selectedSlot: string;
    noSlotSelected: string;
    fullName: string;
    phone: string;
    notes: string;
  }>;
  messages?: Partial<{
    errFullName: string;
    errFullNameShort: string;
    errPhone: string;
    errPhoneInvalid: string;
    errSlot: string;
    errSlotInvalid: string;
    errSlotTaken: string;
  }>;
  submitSubmitting?: string;
};

interface FieldErrors {
  fullName?: string;
  phone?: string;
  slot?: string;
  extra?: Record<string, string>;
}

function emptyExtra(
  defs: readonly CustomFieldDefinition[],
): Record<string, string> {
  const o: Record<string, string> = {};
  for (const d of defs) o[d.key] = "";
  return o;
}

function PublicExtraFieldControl({
  def,
  value,
  disabled,
  onChange,
}: {
  def: CustomFieldDefinition;
  value: string;
  disabled: boolean;
  onChange: (next: string) => void;
}) {
  const selectPlaceholder = heUi.forms.selectPlaceholder;
  const id = `public-booking-extra-${def.key}`;

  switch (def.kind) {
    case CustomFieldInputKind.Text:
      return (
        <input
          id={id}
          type="text"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          required={def.required}
          className={cn(ui.input, "text-xs sm:text-sm")}
          autoComplete="off"
        />
      );
    case CustomFieldInputKind.TextArea:
      return (
        <textarea
          id={id}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          required={def.required}
          rows={3}
          className={cn(ui.input, "min-h-[5rem] resize-y text-xs sm:text-sm")}
          autoComplete="off"
        />
      );
    case CustomFieldInputKind.Select:
      return (
        <select
          id={id}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          required={def.required}
          className={cn(ui.select, "text-xs sm:text-sm")}
        >
          <option value="">{selectPlaceholder}</option>
          {(def.options ?? []).map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );
    case CustomFieldInputKind.Number:
      return (
        <input
          id={id}
          type="number"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          required={def.required}
          min={0}
          step="any"
          className={cn(ui.input, "text-xs sm:text-sm")}
          inputMode="decimal"
        />
      );
    default:
      return null;
  }
}

function toLocalDate(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function toLocalTime(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "";
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function slotDateTimeValid(slot: AvailableSlot): boolean {
  if (!Number.isFinite(new Date(slot.slotStart).getTime())) return false;
  const date = toLocalDate(slot.slotStart);
  const time = toLocalTime(slot.slotStart);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  if (!/^\d{2}:\d{2}$/.test(time)) return false;
  return true;
}

export function PublicBookingForm({
  extraFields,
  selectedSlot,
  isSelectedSlotAvailable,
  onSubmit,
  submitError = null,
  isSubmitting,
  className,
  preflightError = null,
  submitIdleLabel,
  formCardClassName,
  submitButtonClassName,
  visualTone = "default",
  stickyMobileCta = false,
  ctaHelperText,
  formCopy,
  timeLocale = "he-IL",
  minimalContact = false,
  trustBeforeSubmit,
}: PublicBookingFormProps) {
  const hilaiVisual = visualTone === "hilai";
  const stickyBar = stickyMobileCta;
  const pb = heUi.publicBooking;
  const L = {
    selectedSlot: formCopy?.labels?.selectedSlot ?? pb.selectedSlotLabel,
    noSlotSelected: formCopy?.labels?.noSlotSelected ?? pb.noSlotSelected,
    fullName: formCopy?.labels?.fullName ?? pb.fullNameLabel,
    phone: formCopy?.labels?.phone ?? pb.phoneLabel,
    notes: formCopy?.labels?.notes ?? pb.notesLabel,
  };
  const msg = {
    errFullName: formCopy?.messages?.errFullName ?? pb.errFullName,
    errFullNameShort: formCopy?.messages?.errFullNameShort ?? pb.errFullNameShort,
    errPhone: formCopy?.messages?.errPhone ?? pb.errPhone,
    errPhoneInvalid: formCopy?.messages?.errPhoneInvalid ?? pb.errPhoneInvalid,
    errSlot: formCopy?.messages?.errSlot ?? pb.errSlot,
    errSlotInvalid: formCopy?.messages?.errSlotInvalid ?? pb.errSlotInvalid,
    errSlotTaken: formCopy?.messages?.errSlotTaken ?? pb.errSlotTaken,
  };
  const submittingLabel = formCopy?.submitSubmitting ?? pb.submitSubmitting;
  const fieldLabel = cn(
    ui.label,
    "text-xs sm:text-sm",
    hilaiVisual && "font-medium text-stone-600",
  );
  const fieldInput = cn(
    ui.input,
    hilaiVisual ? "text-xs sm:text-sm" : "min-h-[3rem] text-base sm:min-h-[2.85rem] sm:text-sm",
    hilaiVisual &&
      "rounded-2xl border-stone-200/80 bg-white/95 shadow-none transition-shadow placeholder:text-stone-400 focus:border-rose-300/80 focus:ring-2 focus:ring-rose-200/40",
    !hilaiVisual && "rounded-2xl",
  );
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [extra, setExtra] = useState<Record<string, string>>(() =>
    emptyExtra(extraFields),
  );
  const [errors, setErrors] = useState<FieldErrors>({});
  const nameInputRef = useRef<HTMLInputElement>(null);

  const extraKey = useMemo(
    () => extraFields.map((d) => d.key).join("|"),
    [extraFields],
  );

  useEffect(() => {
    setExtra(emptyExtra(extraFields));
  }, [extraKey, extraFields]);

  useEffect(() => {
    if (!selectedSlot || isSubmitting) return;
    const t = window.setTimeout(() => nameInputRef.current?.focus(), 80);
    return () => window.clearTimeout(t);
  }, [selectedSlot?.slotStart, isSubmitting, selectedSlot]);

  const selectedSlotLabel = useMemo(() => {
    if (!selectedSlot) return "";
    try {
      const fmt = new Intl.DateTimeFormat(timeLocale, { timeStyle: "short" });
      return `${fmt.format(new Date(selectedSlot.slotStart))} - ${fmt.format(
        new Date(selectedSlot.slotEnd),
      )}`;
    } catch {
      return `${selectedSlot.slotStart} - ${selectedSlot.slotEnd}`;
    }
  }, [selectedSlot, timeLocale]);

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    const extraErr: Record<string, string> = {};

    const name = fullName.trim();
    if (!name) next.fullName = msg.errFullName;
    else if (name.length < 2) next.fullName = msg.errFullNameShort;

    const phoneTrim = phone.trim();
    if (!phoneTrim) next.phone = msg.errPhone;
    else if (phoneTrim.replace(/\D/g, "").length < 8) next.phone = msg.errPhoneInvalid;

    if (!selectedSlot) next.slot = msg.errSlot;
    else if (!slotDateTimeValid(selectedSlot)) next.slot = msg.errSlotInvalid;

    for (const def of extraFields) {
      if (!def.required) continue;
      const v = (extra[def.key] ?? "").trim();
      if (!v) {
        extraErr[def.key] = heUi.validation.fieldRequiredShort;
      }
    }
    if (Object.keys(extraErr).length > 0) next.extra = extraErr;

    return next;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    if (isSubmitting) return;

    if (selectedSlot && !isSelectedSlotAvailable) {
      setErrors((prev) => ({
        ...prev,
        slot: msg.errSlotTaken,
      }));
      return;
    }

    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    if (!selectedSlot) return;

    const bookingCustomFields: Record<string, string> = {};
    for (const def of extraFields) {
      const v = (extra[def.key] ?? "").trim();
      if (v) bookingCustomFields[def.key] = v;
    }

    const ok = await onSubmit({
      fullName: fullName.trim(),
      phone: phone.trim(),
      notes: notes.trim(),
      slotStart: selectedSlot.slotStart,
      slotEnd: selectedSlot.slotEnd,
      bookingCustomFields,
    });
    if (ok) {
      setFullName("");
      setPhone("");
      setNotes("");
      setExtra(emptyExtra(extraFields));
      setErrors({});
    }
  }

  const submitCtaClassName = cn(
    "w-full text-xs sm:text-sm",
    hilaiVisual &&
      "min-h-[3.25rem] rounded-2xl text-[15px] font-semibold tracking-wide shadow-[0_12px_36px_-16px_rgba(190,130,155,0.55)]",
    submitButtonClassName,
  );

  const submitCta = (
    <Button
      type="submit"
      variant="primary"
      className={submitCtaClassName}
      disabled={isSubmitting}
      aria-busy={isSubmitting}
    >
      {isSubmitting ? (
        <span className="flex items-center justify-center gap-2">
          <Spinner className="size-4 border-white/40 border-t-white" />
          {submittingLabel}
        </span>
      ) : (
        submitIdleLabel ?? heUi.publicBooking.submitIdle
      )}
    </Button>
  );

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className={cn(
        ui.formCard,
        hilaiVisual ? "space-y-5 p-4 sm:space-y-6 sm:p-6" : "space-y-4 p-3 sm:space-y-5 sm:p-4",
        formCardClassName,
        className,
      )}
    >
      <div
        className={cn(
          "rounded-lg border px-3 py-2",
          hilaiVisual
            ? "border-stone-200/60 bg-gradient-to-b from-stone-50/90 to-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9)]"
            : "border-neutral-200 bg-neutral-50/90 dark:border-neutral-700 dark:bg-neutral-800",
        )}
      >
        <p
          className={cn(
            "text-[10px] sm:text-xs",
            hilaiVisual
              ? "font-medium text-stone-500"
              : "text-neutral-600 dark:text-neutral-400",
          )}
        >
          {L.selectedSlot}
        </p>
        <p
          className={cn(
            "mt-1 text-xs sm:text-sm",
            hilaiVisual
              ? "font-semibold text-stone-800"
              : "font-semibold text-neutral-900 dark:text-neutral-100",
          )}
        >
          {selectedSlotLabel || L.noSlotSelected}
        </p>
        {errors.slot ? (
          <p className="mt-1 text-xs text-red-600 sm:text-sm">{errors.slot}</p>
        ) : null}
      </div>

      <div>
        <label htmlFor="public-booking-name" className={fieldLabel}>
          {L.fullName}
        </label>
        <input
          ref={nameInputRef}
          id="public-booking-name"
          type="text"
          value={fullName}
          disabled={isSubmitting}
          onChange={(e) => {
            setFullName(e.target.value);
            setErrors((prev) => ({ ...prev, fullName: undefined }));
          }}
          className={fieldInput}
          autoComplete="name"
          aria-invalid={errors.fullName ? true : undefined}
          aria-describedby={errors.fullName ? "public-booking-name-error" : undefined}
        />
        {errors.fullName ? (
          <p id="public-booking-name-error" className="mt-1 text-xs text-red-600 sm:text-sm">
            {errors.fullName}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="public-booking-phone" className={fieldLabel}>
          {L.phone}
        </label>
        <input
          id="public-booking-phone"
          type="tel"
          value={phone}
          disabled={isSubmitting}
          onChange={(e) => {
            setPhone(e.target.value);
            setErrors((prev) => ({ ...prev, phone: undefined }));
          }}
          className={fieldInput}
          autoComplete="tel"
          inputMode="tel"
          aria-invalid={errors.phone ? true : undefined}
          aria-describedby={errors.phone ? "public-booking-phone-error" : undefined}
        />
        {errors.phone ? (
          <p id="public-booking-phone-error" className="mt-1 text-xs text-red-600 sm:text-sm">
            {errors.phone}
          </p>
        ) : null}
      </div>

      {!minimalContact ? (
        <div>
          <label htmlFor="public-booking-notes" className={fieldLabel}>
            {L.notes}
          </label>
          <textarea
            id="public-booking-notes"
            value={notes}
            disabled={isSubmitting}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className={cn(fieldInput, "min-h-[5.5rem] resize-y")}
          />
        </div>
      ) : null}

      {extraFields.map((def) => (
        <div key={def.key}>
          <label htmlFor={`public-booking-extra-${def.key}`} className={cn(ui.label, "text-xs sm:text-sm")}>
            {def.label}
            {def.required ? (
              <span className="text-red-600" aria-hidden>
                {" "}
                *
              </span>
            ) : null}
          </label>
          <PublicExtraFieldControl
            def={def}
            value={extra[def.key] ?? ""}
            disabled={isSubmitting}
            onChange={(next) => {
              setExtra((prev) => ({ ...prev, [def.key]: next }));
              setErrors((prev) => {
                const ex = prev.extra ? { ...prev.extra } : undefined;
                if (ex && def.key in ex) delete ex[def.key];
                return {
                  ...prev,
                  extra:
                    ex && Object.keys(ex).length > 0 ? ex : undefined,
                };
              });
            }}
          />
          {errors.extra?.[def.key] ? (
            <p className="mt-1 text-xs text-red-600 sm:text-sm">{errors.extra[def.key]}</p>
          ) : null}
        </div>
      ))}

      {preflightError ? (
        <p className="text-xs text-red-600 sm:text-sm" role="alert">
          {preflightError}
        </p>
      ) : null}

      {stickyBar ? (
        <div
          className={cn(
            "max-sm:fixed max-sm:bottom-0 max-sm:left-0 max-sm:right-0 max-sm:z-40 max-sm:px-4 max-sm:pb-[max(0.75rem,env(safe-area-inset-bottom))] max-sm:pt-3",
            hilaiVisual
              ? "max-sm:border-t max-sm:border-pink-100/70 max-sm:bg-gradient-to-t max-sm:from-[#fef7fb] max-sm:via-[#fef7fb]/97 max-sm:to-transparent max-sm:shadow-[0_-12px_40px_-16px_rgba(219,39,119,0.12)]"
              : "max-sm:border-t max-sm:border-neutral-200/90 max-sm:bg-white/95 max-sm:shadow-[0_-10px_40px_-18px_rgba(0,0,0,0.15)] max-sm:backdrop-blur-md dark:max-sm:border-neutral-700 dark:max-sm:bg-neutral-950/92",
          )}
        >
          {trustBeforeSubmit ? <div className="mb-3">{trustBeforeSubmit}</div> : null}
          {ctaHelperText ? (
            <p
              className={cn(
                "mb-3 text-center text-[13px] font-medium leading-snug sm:mb-4 sm:text-sm",
                hilaiVisual ? "text-stone-600" : "text-neutral-600 dark:text-neutral-400",
              )}
            >
              {ctaHelperText}
            </p>
          ) : null}
          {submitCta}
        </div>
      ) : (
        <>
          {trustBeforeSubmit ? <div className="mb-3">{trustBeforeSubmit}</div> : null}
          {ctaHelperText ? (
            <p
              className={cn(
                "mb-2 text-center text-[13px] font-medium sm:mb-3 sm:text-sm",
                hilaiVisual ? "text-stone-600" : "text-neutral-600 dark:text-neutral-400",
              )}
            >
              {ctaHelperText}
            </p>
          ) : null}
          {submitCta}
        </>
      )}
      {submitError ? (
        <p className="text-xs text-red-600 sm:text-sm" role="alert">
          {submitError}
        </p>
      ) : null}
    </form>
  );
}
