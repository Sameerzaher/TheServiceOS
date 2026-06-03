"use client";

import {
  type FormEvent,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { heUi, paymentStatusLabel } from "@/config";
import { Button, EmptyState, ui } from "@/components/ui";
import { useDashboardTeacherId } from "@/features/app/DashboardTeacherContext";
import type { Appointment, AppointmentRecord } from "@/core/types/appointment";
import { AppointmentStatus, PaymentStatus } from "@/core/types/appointment";
import type { Client } from "@/core/types/client";
import {
  CustomFieldInputKind,
  type CustomFieldDefinition,
  type VerticalPreset,
} from "@/core/types/vertical";
import { customFieldsToRaw } from "@/core/utils/customFieldForm";
import { isoToLocalDateParts } from "@/core/utils/datetime";
import { buildTimeSlotValues } from "@/core/utils/timeSlots";

import { cn } from "@/lib/cn";

function emptyCustomState(
  fields: readonly CustomFieldDefinition[],
): Record<string, string> {
  const next: Record<string, string> = {};
  for (const field of fields) {
    next[field.key] = "";
  }
  return next;
}

function buildCustomFields(
  defs: readonly CustomFieldDefinition[],
  raw: Record<string, string>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};

  for (const def of defs) {
    const value = raw[def.key] ?? "";

    if (def.kind === CustomFieldInputKind.Boolean) {
      out[def.key] = value === "true";
      continue;
    }

    if (value === "") {
      continue;
    }

    switch (def.kind) {
      case CustomFieldInputKind.Number: {
        const n = Number(value);
        if (!Number.isNaN(n)) {
          out[def.key] = n;
        }
        break;
      }
      case CustomFieldInputKind.Text:
      case CustomFieldInputKind.TextArea:
      case CustomFieldInputKind.Select:
      case CustomFieldInputKind.Date:
        out[def.key] = value;
        break;
      default: {
        const _exhaustive: never = def.kind;
        throw new Error(`Unhandled custom field kind: ${String(_exhaustive)}`);
      }
    }
  }

  return out;
}

/** Combines separate date + time inputs (reliable vs. single `datetime-local` in RTL / some browsers). */
function toIsoFromDateAndTime(date: string, time: string): string | null {
  if (!date.trim() || !time.trim()) return null;
  const t = time.length >= 5 ? time.slice(0, 5) : time;
  const combined = `${date}T${t}`;
  const d = new Date(combined);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function CustomFieldControl({
  def,
  value,
  onChange,
}: {
  def: CustomFieldDefinition;
  value: string;
  onChange: (next: string) => void;
}) {
  const selectPlaceholder = heUi.forms.selectPlaceholder;
  const id = `appt-custom-${def.key}`;

  switch (def.kind) {
    case CustomFieldInputKind.Text:
      return (
        <input
          id={id}
          type="text"
          name={def.key}
          value={value}
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
          name={def.key}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={def.required}
          rows={3}
          className={cn(ui.input, "min-h-[5rem] resize-y text-xs sm:text-sm")}
          autoComplete="off"
        />
      );

    case CustomFieldInputKind.Number:
      return (
        <input
          id={id}
          type="number"
          name={def.key}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={def.required}
          min={0}
          step="any"
          className={cn(ui.input, "text-xs sm:text-sm")}
          inputMode="decimal"
        />
      );

    case CustomFieldInputKind.Select:
      return (
        <select
          id={id}
          name={def.key}
          value={value}
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

    case CustomFieldInputKind.Boolean:
      return (
        <label className="flex items-center gap-2 text-xs text-neutral-800 dark:text-neutral-200 sm:text-sm">
          <input
            id={id}
            type="checkbox"
            name={def.key}
            checked={value === "true"}
            onChange={(e) => onChange(e.target.checked ? "true" : "")}
            className="size-4 rounded border-neutral-300 text-emerald-700 focus:ring-emerald-500/40"
          />
          <span>{def.label}</span>
        </label>
      );

    case CustomFieldInputKind.Date:
      return (
        <input
          id={id}
          type="date"
          name={def.key}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={def.required}
          className={cn(ui.input, "text-xs sm:text-sm")}
        />
      );

    default: {
      const _exhaustive: never = def.kind;
      throw new Error(`Unhandled custom field kind: ${String(_exhaustive)}`);
    }
  }
}

export interface AppointmentFormProps {
  preset: VerticalPreset;
  clients: Client[];
  onSubmit: (data: Appointment) => void;
  /** When set, the form is prefilled for editing that appointment. */
  initialAppointment?: AppointmentRecord | null;
  /** Default amount (₪) for new rows; falls back to first preset service price or 0. */
  defaultAmount?: number;
  onCancelEdit?: () => void;
  /** When adding a new lesson, pre-select this client in the dropdown. */
  prefillClientId?: string | null;
  /** From settings — shows approximate end time under date/time for new lessons. */
  defaultLessonDurationMinutes?: number;
}

export function AppointmentForm({
  preset,
  clients,
  onSubmit,
  initialAppointment,
  defaultAmount,
  onCancelEdit,
  prefillClientId,
  defaultLessonDurationMinutes,
}: AppointmentFormProps) {
  const dashboardTeacherId = useDashboardTeacherId();
  const defaultMoney = defaultAmount ?? preset.defaultServices[0]?.price ?? 0;
  const [clientId, setClientId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(
    PaymentStatus.Pending,
  );
  const [customRaw, setCustomRaw] = useState<Record<string, string>>(() =>
    emptyCustomState(preset.appointmentFields),
  );
  const [clientError, setClientError] = useState<string | null>(null);
  const [datetimeError, setDatetimeError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitLock = useRef(false);
  const firstFieldRef = useRef<HTMLSelectElement | null>(null);
  const didAutoFocusRef = useRef(false);

  const appointmentFields = useMemo(
    () => preset.appointmentFields,
    [preset.appointmentFields],
  );

  const isEditing = Boolean(initialAppointment);

  const timeSlotOptions = useMemo(() => {
    const slots = buildTimeSlotValues(6, 22, 15);
    if (initialAppointment) {
      const { time } = isoToLocalDateParts(initialAppointment.startAt);
      if (time && !slots.includes(time)) {
        return [time, ...slots];
      }
    }
    return slots;
  }, [initialAppointment]);

  const suggestedEndTime = useMemo(() => {
    if (initialAppointment) return null;
    const mins = defaultLessonDurationMinutes ?? 0;
    if (mins <= 0) return null;
    if (!startDate.trim() || !startTime.trim()) return null;
    const t = startTime.length >= 5 ? startTime.slice(0, 5) : startTime;
    const combined = `${startDate}T${t}`;
    const d = new Date(combined);
    if (Number.isNaN(d.getTime())) return null;
    d.setMinutes(d.getMinutes() + mins);
    try {
      return new Intl.DateTimeFormat("he-IL", { timeStyle: "short" }).format(
        d,
      );
    } catch {
      return null;
    }
  }, [initialAppointment, startDate, startTime, defaultLessonDurationMinutes]);

  const resetForm = useCallback((): void => {
    setClientId("");
    setStartDate("");
    setStartTime("");
    setAmountInput("");
    setPaymentStatus(PaymentStatus.Pending);
    setCustomRaw(emptyCustomState(preset.appointmentFields));
    setClientError(null);
    setDatetimeError(null);
  }, [preset.appointmentFields]);

  useEffect(() => {
    if (initialAppointment) return;
    if (!prefillClientId) return;
    // Only prefill if the client belongs to current teacher's list
    if (clients.some((c) => c.id === prefillClientId)) {
      setClientId(prefillClientId);
    } else {
      // Clear prefilled client if it doesn't belong to current teacher
      setClientId("");
    }
  }, [prefillClientId, initialAppointment, clients]);

  // Clear form when teacher changes (detect by clients changing to empty or different set)
  useEffect(() => {
    if (initialAppointment) return;
    // If there's a selected client but it's not in the current list, clear it
    if (clientId && !clients.some((c) => c.id === clientId)) {
      setClientId("");
      setClientError(null);
    }
  }, [clients, clientId, initialAppointment]);

  useEffect(() => {
    if (clients.length === 0) return;
    if (didAutoFocusRef.current) return;
    didAutoFocusRef.current = true;
    const id = window.requestAnimationFrame(() => {
      firstFieldRef.current?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(id);
  }, [clients.length]);

  useEffect(() => {
    if (initialAppointment) return;
    if (defaultMoney > 0) {
      setAmountInput((prev) => (prev === "" ? String(defaultMoney) : prev));
    }
  }, [defaultMoney, initialAppointment]);

  useEffect(() => {
    if (!initialAppointment) return;
    const { date, time } = isoToLocalDateParts(initialAppointment.startAt);
    setClientId(initialAppointment.clientId);
    setStartDate(date);
    setStartTime(time);
    setAmountInput(String(initialAppointment.amount ?? 0));
    setPaymentStatus(initialAppointment.paymentStatus);
    setCustomRaw(
      customFieldsToRaw(appointmentFields, initialAppointment.customFields),
    );
    setClientError(null);
    setDatetimeError(null);
  }, [initialAppointment, appointmentFields]);

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (submitLock.current || isSubmitting) return;

    if (!clientId || !clients.some((c) => c.id === clientId)) {
      setClientError(heUi.validation.studentRequired);
      return;
    }
    setClientError(null);

    const startAt = toIsoFromDateAndTime(startDate, startTime);
    if (!startAt) {
      setDatetimeError(heUi.validation.datetimeInvalid);
      return;
    }
    setDatetimeError(null);

    const rawAmount = amountInput.trim();
    let amount: number;
    if (rawAmount === "") {
      amount = defaultMoney;
    } else {
      const parsedAmount = Number.parseFloat(rawAmount.replace(",", "."));
      amount = Number.isFinite(parsedAmount) ? Math.max(0, parsedAmount) : 0;
    }

    submitLock.current = true;
    setIsSubmitting(true);

    try {
      onSubmit({
        teacherId:
          clients.find((c) => c.id === clientId)?.teacherId ??
          dashboardTeacherId,
        clientId,
        startAt,
        status: initialAppointment?.status ?? AppointmentStatus.Scheduled,
        paymentStatus,
        amount,
        customFields: buildCustomFields(appointmentFields, customRaw),
      });

      if (!isEditing) {
        resetForm();
      }
    } finally {
      window.setTimeout(() => {
        submitLock.current = false;
        setIsSubmitting(false);
      }, 0);
    }
  }

  function handleFormKeyDown(e: KeyboardEvent<HTMLFormElement>): void {
    if (e.key !== "Escape" || !isEditing || !onCancelEdit) return;
    e.preventDefault();
    onCancelEdit();
  }

  if (clients.length === 0) {
    return (
      <EmptyState
        className="mx-auto w-full max-w-lg py-8"
        tone="warning"
        title={heUi.empty.noStudentsForAppointmentTitle}
        description={heUi.empty.noStudentsForAppointmentDescription}
      />
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      onKeyDown={handleFormKeyDown}
      className={cn(
        "mx-auto flex w-full max-w-lg flex-col gap-4 transition-shadow sm:gap-5",
        ui.formCard,
        isEditing &&
          "ring-2 ring-amber-400/70 ring-offset-2 ring-offset-neutral-50",
      )}
      noValidate
    >
      <div className="rounded-xl border border-emerald-100/80 bg-emerald-50/50 px-3 py-2 text-[10px] text-neutral-700 ring-1 ring-emerald-900/[0.04] dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-neutral-300 sm:text-xs">
        {isEditing
          ? heUi.forms.editLesson
          : heUi.forms.saveLesson}
      </div>

      <div>
        <label htmlFor="appt-client" className={cn(ui.label, "text-xs sm:text-sm")}>
          {heUi.forms.appointmentStudent}
        </label>
        <select
          id="appt-client"
          ref={firstFieldRef}
          name="clientId"
          value={clientId}
          onChange={(e) => {
            setClientId(e.target.value);
            setClientError(null);
          }}
          className={cn(ui.select, "text-xs sm:text-sm")}
          aria-invalid={clientError ? true : undefined}
          aria-describedby={clientError ? "appt-client-error" : undefined}
        >
          <option value="">{heUi.forms.selectStudentPlaceholder}</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.fullName}
            </option>
          ))}
        </select>
        {clientError ? (
          <p id="appt-client-error" className="mt-1 text-xs text-red-600 sm:text-sm">
            {clientError}
          </p>
        ) : null}
      </div>

      <fieldset className="space-y-3 border-0 p-0">
        <legend className={cn(ui.label, "mb-0 text-xs sm:text-sm")}>
          {heUi.forms.appointmentDatetime}
        </legend>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="appt-date" className="mb-1 block text-[11px] text-neutral-700 dark:text-neutral-300 sm:text-sm">
              {heUi.forms.appointmentDate}
            </label>
            <input
              id="appt-date"
              name="startDate"
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setDatetimeError(null);
              }}
              className={cn(ui.input, "text-xs sm:text-sm")}
              aria-invalid={datetimeError ? true : undefined}
              aria-describedby={datetimeError ? "appt-datetime-error" : undefined}
            />
          </div>
          <div>
            <label htmlFor="appt-time" className="mb-1 block text-[11px] text-neutral-700 dark:text-neutral-300 sm:text-sm">
              {heUi.forms.appointmentTime}
            </label>
            <select
              id="appt-time"
              name="startTime"
              value={startTime}
              onChange={(e) => {
                setStartTime(e.target.value);
                setDatetimeError(null);
              }}
              className={cn(ui.select, "text-xs sm:text-sm")}
              aria-invalid={datetimeError ? true : undefined}
              aria-describedby={datetimeError ? "appt-datetime-error" : undefined}
            >
              <option value="">{heUi.forms.appointmentTimePlaceholder}</option>
              {timeSlotOptions.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
          </div>
        </div>
        {datetimeError ? (
          <p id="appt-datetime-error" className="mt-1 text-xs text-red-600 sm:text-sm">
            {datetimeError}
          </p>
        ) : null}
        {suggestedEndTime ? (
          <p className="text-[10px] text-neutral-500 dark:text-neutral-400 sm:text-xs">
            {heUi.forms.suggestedLessonEnd(suggestedEndTime)}
          </p>
        ) : null}
      </fieldset>

      <div>
        <label htmlFor="appt-payment" className={cn(ui.label, "text-xs sm:text-sm")}>
          {heUi.forms.paymentStatus}
        </label>
        <select
          id="appt-payment"
          name="paymentStatus"
          value={paymentStatus}
          onChange={(e) =>
            setPaymentStatus(e.target.value as PaymentStatus)
          }
          className={cn(ui.select, "text-xs sm:text-sm")}
        >
          {(Object.values(PaymentStatus) as PaymentStatus[]).map((status) => (
            <option key={status} value={status}>
              {paymentStatusLabel(status)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="appt-amount" className={cn(ui.label, "text-xs sm:text-sm")}>
          {heUi.forms.amount}
        </label>
        <input
          id="appt-amount"
          name="amount"
          type="number"
          min={0}
          step={1}
          inputMode="decimal"
          value={amountInput}
          onChange={(e) => setAmountInput(e.target.value)}
          className={cn(ui.input, "text-xs sm:text-sm")}
          autoComplete="off"
        />
        {!isEditing && defaultMoney > 0 ? (
          <p className="mt-1 text-[10px] text-neutral-500 dark:text-neutral-400 sm:text-xs">
            {heUi.forms.defaultAmountHint(defaultMoney)}
          </p>
        ) : null}
      </div>

      {appointmentFields.map((def) => (
        <div key={def.key}>
          {def.kind === CustomFieldInputKind.Boolean ? (
            <CustomFieldControl
              def={def}
              value={customRaw[def.key] ?? ""}
              onChange={(next) =>
                setCustomRaw((prev) => ({ ...prev, [def.key]: next }))
              }
            />
          ) : (
            <>
              <label htmlFor={`appt-custom-${def.key}`} className={cn(ui.label, "text-xs sm:text-sm")}>
                {def.label}
                {def.required ? (
                  <span className="text-red-600" aria-hidden>
                    {" "}
                    *
                  </span>
                ) : null}
              </label>
              <CustomFieldControl
                def={def}
                value={customRaw[def.key] ?? ""}
                onChange={(next) =>
                  setCustomRaw((prev) => ({ ...prev, [def.key]: next }))
                }
              />
            </>
          )}
        </div>
      ))}

      <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] z-30 -mx-2 mt-1 flex w-auto flex-col gap-2 border-t border-neutral-200/80 bg-white/95 px-2 pb-3 pt-3 backdrop-blur dark:border-neutral-700 dark:bg-neutral-900/95 sm:static sm:bottom-0 sm:mx-0 sm:w-full sm:flex-row sm:justify-end sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-0">
        {isEditing && onCancelEdit ? (
          <Button
            type="button"
            variant="secondary"
            className="w-full text-xs sm:max-w-xs sm:self-end sm:text-sm"
            onClick={onCancelEdit}
            disabled={isSubmitting}
          >
            {heUi.forms.cancelEdit}
          </Button>
        ) : null}
        <Button
          type="submit"
          variant="primary"
          className="w-full text-xs sm:max-w-xs sm:self-end sm:text-sm"
          disabled={isSubmitting}
        >
          {isSubmitting
            ? heUi.forms.saving
            : isEditing
              ? heUi.forms.saveChanges
              : heUi.forms.saveLesson}
        </Button>
      </div>
    </form>
  );
}
