"use client";

import { ui } from "@/components/ui/theme";
import { cn } from "@/lib/cn";

export interface BookingFormValues {
  fullName: string;
  phone: string;
  notes: string;
}

export interface BookingFormProps {
  values: BookingFormValues;
  onChange: (next: Partial<BookingFormValues>) => void;
  errors: Partial<Record<keyof BookingFormValues, string>>;
  disabled?: boolean;
  className?: string;
}

export function BookingForm({
  values,
  onChange,
  errors,
  disabled = false,
  className,
}: BookingFormProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="space-y-1.5">
        <label htmlFor="pb-fullName" className={cn(ui.label, "text-sm font-semibold")}>
          שם מלא <span className="text-red-600">*</span>
        </label>
        <input
          id="pb-fullName"
          type="text"
          autoComplete="name"
          disabled={disabled}
          value={values.fullName}
          onChange={(e) => onChange({ fullName: e.target.value })}
          className={cn(ui.input, "min-h-[48px] rounded-2xl text-base")}
          placeholder="לדוגמה: יוסי כהן"
        />
        {errors.fullName ? (
          <p className="text-sm font-medium text-red-600">{errors.fullName}</p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="pb-phone" className={cn(ui.label, "text-sm font-semibold")}>
          טלפון נייד <span className="text-red-600">*</span>
        </label>
        <input
          id="pb-phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          disabled={disabled}
          value={values.phone}
          onChange={(e) => onChange({ phone: e.target.value })}
          className={cn(ui.input, "min-h-[48px] rounded-2xl text-base")}
          placeholder="05xxxxxxxx"
          dir="ltr"
        />
        {errors.phone ? (
          <p className="text-sm font-medium text-red-600">{errors.phone}</p>
        ) : (
          <p className="text-xs text-neutral-500">מספר ישראלי תקין (05x…)</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="pb-notes" className={cn(ui.label, "text-sm font-semibold")}>
          הערות (אופציונלי)
        </label>
        <textarea
          id="pb-notes"
          rows={3}
          disabled={disabled}
          value={values.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
          className={cn(
            ui.input,
            "min-h-[96px] resize-y rounded-2xl py-3 text-base leading-relaxed",
          )}
          placeholder="בקשות מיוחדות, מיקום איסוף…"
        />
        {errors.notes ? (
          <p className="text-sm font-medium text-red-600">{errors.notes}</p>
        ) : null}
      </div>
    </div>
  );
}
