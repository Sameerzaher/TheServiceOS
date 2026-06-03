"use client";

import { Button, ui } from "@/components/ui";
import type {
  AvailabilitySettings,
  DayAvailability,
  WeekdayKey,
} from "@/core/types/availability";

const WEEKDAY_ROWS: ReadonlyArray<{ key: WeekdayKey; label: string }> = [
  { key: "sunday", label: "יום ראשון" },
  { key: "monday", label: "יום שני" },
  { key: "tuesday", label: "יום שלישי" },
  { key: "wednesday", label: "יום רביעי" },
  { key: "thursday", label: "יום חמישי" },
  { key: "friday", label: "יום שישי" },
  { key: "saturday", label: "יום שבת" },
];

export interface AvailabilitySettingsFormProps {
  settings: AvailabilitySettings;
  onChange: (next: AvailabilitySettings) => void;
  onReset?: () => void;
}

export function AvailabilitySettingsForm({
  settings,
  onChange,
  onReset,
}: AvailabilitySettingsFormProps) {
  function updateField<K extends keyof AvailabilitySettings>(
    key: K,
    value: AvailabilitySettings[K],
  ): void {
    onChange({ ...settings, [key]: value });
  }

  function updateDay(day: WeekdayKey, patch: Partial<DayAvailability>): void {
    const current = settings.weeklyAvailability[day];
    onChange({
      ...settings,
      weeklyAvailability: {
        ...settings.weeklyAvailability,
        [day]: {
          ...current,
          ...patch,
        },
      },
    });
  }

  return (
    <section className={ui.formCard}>
      <div className="space-y-5 sm:space-y-6">
        <div className="rounded-lg border border-neutral-200 bg-neutral-50/80 p-3 sm:p-4">
          <div className="flex items-center justify-between gap-3">
            <label
              htmlFor="booking-enabled"
              className="text-sm font-medium text-neutral-900"
            >
              הפעלת הזמנת שיעורים אונליין
            </label>
            <input
              id="booking-enabled"
              type="checkbox"
              checked={settings.bookingEnabled}
              onChange={(e) => updateField("bookingEnabled", e.target.checked)}
              className="size-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-400"
            />
          </div>
          <p className="mt-2 text-xs text-neutral-600">
            כשהאפשרות פעילה, תלמידים יכולים לבקש מועדים מתוך הזמינות שלך.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="slot-duration" className={ui.label}>
              משך סלוט (דקות)
            </label>
            <input
              id="slot-duration"
              type="number"
              min={15}
              max={180}
              step={5}
              inputMode="numeric"
              className={ui.input}
              value={settings.slotDurationMinutes}
              onChange={(e) => {
                const n = Number.parseInt(e.target.value, 10);
                updateField(
                  "slotDurationMinutes",
                  Number.isFinite(n)
                    ? Math.min(180, Math.max(15, n))
                    : settings.slotDurationMinutes,
                );
              }}
            />
          </div>
          <div>
            <label htmlFor="days-ahead" className={ui.label}>
              פתיחה להזמנה קדימה (ימים)
            </label>
            <input
              id="days-ahead"
              type="number"
              min={1}
              max={365}
              step={1}
              inputMode="numeric"
              className={ui.input}
              value={settings.daysAhead}
              onChange={(e) => {
                const n = Number.parseInt(e.target.value, 10);
                updateField(
                  "daysAhead",
                  Number.isFinite(n)
                    ? Math.min(365, Math.max(1, n))
                    : settings.daysAhead,
                );
              }}
            />
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-neutral-900">
            זמינות שבועית
          </h3>
          <p className="text-xs text-neutral-600">
            לכל יום ניתן להפעיל זמינות ולהגדיר שעת התחלה וסיום.
          </p>
        </div>

        <ul className="space-y-2 sm:space-y-3">
          {WEEKDAY_ROWS.map((row) => {
            const day = settings.weeklyAvailability[row.key];
            return (
              <li
                key={row.key}
                className="rounded-xl border border-neutral-200 bg-white p-3 shadow-sm sm:p-4"
              >
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto_auto] sm:items-center">
                  <div className="flex items-center gap-2">
                    <input
                      id={`day-enabled-${row.key}`}
                      type="checkbox"
                      checked={day.enabled}
                      onChange={(e) =>
                        updateDay(row.key, { enabled: e.target.checked })
                      }
                      className="size-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-400"
                    />
                    <label
                      htmlFor={`day-enabled-${row.key}`}
                      className="text-sm font-medium text-neutral-900"
                    >
                      {row.label}
                    </label>
                  </div>

                  <div>
                    <label
                      htmlFor={`day-start-${row.key}`}
                      className="mb-1 block text-xs text-neutral-600"
                    >
                      התחלה
                    </label>
                    <input
                      id={`day-start-${row.key}`}
                      type="time"
                      value={day.startTime}
                      disabled={!day.enabled}
                      onChange={(e) =>
                        updateDay(row.key, { startTime: e.target.value })
                      }
                      className={ui.input}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor={`day-end-${row.key}`}
                      className="mb-1 block text-xs text-neutral-600"
                    >
                      סיום
                    </label>
                    <input
                      id={`day-end-${row.key}`}
                      type="time"
                      value={day.endTime}
                      disabled={!day.enabled}
                      onChange={(e) =>
                        updateDay(row.key, { endTime: e.target.value })
                      }
                      className={ui.input}
                    />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="space-y-4 rounded-xl border border-amber-100 bg-amber-50/30 p-4">
          <h3 className="text-sm font-semibold text-neutral-900">
            תזכורות אוטומטיות ב-WhatsApp
          </h3>
          
          <div className="flex items-center gap-2">
            <input
              id="enable-auto-reminders"
              type="checkbox"
              checked={settings.enableAutoReminders ?? false}
              onChange={(e) =>
                updateField("enableAutoReminders", e.target.checked)
              }
              className="size-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-400"
            />
            <label
              htmlFor="enable-auto-reminders"
              className="text-sm font-medium text-neutral-900"
            >
              הפעל תזכורות אוטומטיות
            </label>
          </div>

          {/* Always render sub-options so the block never "vanishes" on state reload; disable when master toggle is off. */}
          <div
            className={`space-y-4 ${!(settings.enableAutoReminders ?? false) ? "pointer-events-none opacity-45" : ""}`}
          >
            <div className="flex items-center gap-2">
              <input
                id="reminder-24h"
                type="checkbox"
                disabled={!(settings.enableAutoReminders ?? false)}
                checked={settings.reminder24hBefore ?? true}
                onChange={(e) =>
                  updateField("reminder24hBefore", e.target.checked)
                }
                className="size-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-400 disabled:opacity-60"
              />
              <label
                htmlFor="reminder-24h"
                className="text-sm text-neutral-700"
              >
                שלח תזכורת 24 שעות לפני
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="reminder-1h"
                type="checkbox"
                disabled={!(settings.enableAutoReminders ?? false)}
                checked={settings.reminder1hBefore ?? true}
                onChange={(e) =>
                  updateField("reminder1hBefore", e.target.checked)
                }
                className="size-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-400 disabled:opacity-60"
              />
              <label
                htmlFor="reminder-1h"
                className="text-sm text-neutral-700"
              >
                שלח תזכורת שעה לפני
              </label>
            </div>

            <div>
              <label htmlFor="reminder-message" className={ui.label}>
                הודעת תזכורת מותאמת אישית (אופציונלי)
              </label>
              <textarea
                id="reminder-message"
                disabled={!(settings.enableAutoReminders ?? false)}
                value={settings.reminderCustomMessage ?? ""}
                onChange={(e) =>
                  updateField("reminderCustomMessage", e.target.value)
                }
                placeholder="שלום {שם}, מזכירים לך על התור שלך ב-{עסק} בתאריך {תאריך}"
                rows={3}
                className={ui.input}
              />
              <p className="mt-1 text-xs text-neutral-600">
                השאר ריק לשימוש בהודעת ברירת מחדל
              </p>
            </div>
          </div>
        </div>

        {onReset ? (
          <div className="flex justify-end">
            <Button type="button" variant="secondary" onClick={onReset}>
              איפוס לברירת מחדל
            </Button>
          </div>
        ) : null}
      </div>
    </section>
  );
}

