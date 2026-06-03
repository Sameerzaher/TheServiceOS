import type { AppointmentRecord } from "@/core/types/appointment";
import type { VerticalPreset } from "@/core/types/vertical";

/**
 * Best-effort service / treatment label for list cards (first non-empty appointment custom field, else treatmentType).
 */
export function getAppointmentServiceLabel(
  appt: AppointmentRecord,
  preset: VerticalPreset,
): string {
  for (const def of preset.appointmentFields) {
    const v = appt.customFields[def.key];
    if (v !== undefined && v !== null && String(v).trim() !== "") {
      return String(v).trim();
    }
  }
  const tt = appt.customFields.treatmentType;
  if (typeof tt === "string" && tt.trim()) return tt.trim();
  return preset.labels.lesson;
}
