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

import { heUi } from "@/config";
import { Button, ui } from "@/components/ui";
import { useDashboardTeacherId } from "@/features/app/DashboardTeacherContext";
import type { Client } from "@/core/types/client";
import { customFieldsToRaw } from "@/core/utils/customFieldForm";
import { cn } from "@/lib/cn";
import {
  CustomFieldInputKind,
  type CustomFieldDefinition,
  type VerticalPreset,
} from "@/core/types/vertical";

export type ClientFormSubmitData = Omit<
  Client,
  "id" | "createdAt" | "updatedAt"
>;

export interface ClientFormProps {
  preset: VerticalPreset;
  onSubmit: (data: ClientFormSubmitData) => void;
  /** When set, the form is prefilled for editing that client. */
  initialClient?: Client | null;
  onCancelEdit?: () => void;
  /** בלי מסגרת כרטיס — לשימוש בתוך מודאל או הטמעה שטוחה */
  embedded?: boolean;
}

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
  const id = `client-custom-${def.key}`;

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
            className="size-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-400"
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

export function ClientForm({
  preset,
  onSubmit,
  initialClient,
  onCancelEdit,
  embedded = false,
}: ClientFormProps) {
  const dashboardTeacherId = useDashboardTeacherId();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [customRaw, setCustomRaw] = useState<Record<string, string>>(() =>
    emptyCustomState(preset.clientFields),
  );
  const [nameError, setNameError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitLock = useRef(false);
  const firstInputRef = useRef<HTMLInputElement | null>(null);

  const clientFields = useMemo(
    () => preset.clientFields,
    [preset.clientFields],
  );

  const isEditing = Boolean(initialClient);

  const resetForm = useCallback((): void => {
    setFullName("");
    setPhone("");
    setNotes("");
    setCustomRaw(emptyCustomState(preset.clientFields));
    setNameError(null);
    setPhoneError(null);
  }, [preset.clientFields]);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => {
      firstInputRef.current?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (!initialClient) return;
    setFullName(initialClient.fullName);
    setPhone(initialClient.phone);
    setNotes(initialClient.notes);
    setCustomRaw(customFieldsToRaw(clientFields, initialClient.customFields));
    setNameError(null);
    setPhoneError(null);
  }, [initialClient, clientFields]);

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (submitLock.current || isSubmitting) return;

    const trimmedName = fullName.trim();
    if (trimmedName.length < 2) {
      setNameError(heUi.validation.fullNameRequired);
      return;
    }

    const trimmedPhone = phone.trim();
    if (trimmedPhone.length > 0 && trimmedPhone.replace(/\D/g, "").length < 9) {
      setPhoneError(heUi.validation.phoneInvalid);
      return;
    }

    setNameError(null);
    setPhoneError(null);

    submitLock.current = true;
    setIsSubmitting(true);

    try {
      onSubmit({
        teacherId: initialClient?.teacherId ?? dashboardTeacherId,
        fullName: trimmedName,
        phone: trimmedPhone,
        notes: notes.trim(),
        customFields: buildCustomFields(clientFields, customRaw),
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

  return (
    <form
      onSubmit={handleSubmit}
      onKeyDown={handleFormKeyDown}
      className={cn(
        "flex w-full flex-col",
        embedded ? "gap-4" : "mx-auto max-w-lg gap-4 sm:gap-5",
        !embedded && ui.formCard,
        embedded && "border-0 bg-transparent p-0 shadow-none ring-0",
        isEditing &&
          !embedded &&
          "ring-2 ring-amber-400/70 ring-offset-2 ring-offset-neutral-50",
      )}
      noValidate
    >
      <div>
        <label htmlFor="client-fullName" className={cn(ui.label, "text-xs sm:text-sm")}>
          {heUi.forms.fullName}
        </label>
        <input
          id="client-fullName"
          ref={firstInputRef}
          name="fullName"
          type="text"
          value={fullName}
          onChange={(e) => {
            setFullName(e.target.value);
            setNameError(null);
          }}
          className={cn(ui.input, "text-xs sm:text-sm")}
          autoComplete="name"
          aria-invalid={nameError ? true : undefined}
          aria-describedby={nameError ? "client-fullName-error" : undefined}
        />
        {nameError ? (
          <p id="client-fullName-error" className="mt-1 text-xs text-red-600 sm:text-sm">
            {nameError}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="client-phone" className={cn(ui.label, "text-xs sm:text-sm")}>
          {heUi.forms.phone}
        </label>
        <input
          id="client-phone"
          name="phone"
          type="tel"
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value);
            setPhoneError(null);
          }}
          className={cn(ui.input, "text-xs sm:text-sm")}
          autoComplete="tel"
          inputMode="tel"
          aria-invalid={phoneError ? true : undefined}
          aria-describedby={phoneError ? "client-phone-error" : undefined}
        />
        {phoneError ? (
          <p id="client-phone-error" className="mt-1 text-xs text-red-600 sm:text-sm">
            {phoneError}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="client-notes" className={cn(ui.label, "text-xs sm:text-sm")}>
          {heUi.forms.notes}
        </label>
        <textarea
          id="client-notes"
          name="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className={cn(ui.input, "min-h-[5rem] resize-y text-xs sm:text-sm")}
        />
      </div>

      {clientFields.map((def) => (
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
              <label htmlFor={`client-custom-${def.key}`} className={cn(ui.label, "text-xs sm:text-sm")}>
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

      <div className="mt-1 flex w-full flex-col gap-2 sm:flex-row sm:justify-end">
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
              : heUi.forms.save}
        </Button>
      </div>
    </form>
  );
}
