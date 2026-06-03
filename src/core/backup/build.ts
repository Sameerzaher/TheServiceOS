import type { AppointmentRecord } from "@/core/types/appointment";
import type { Client } from "@/core/types/client";
import type { AppSettings } from "@/core/types/settings";

import { BACKUP_VERSION, type AppBackupPayload } from "./schema";

export function buildBackupPayload(
  clients: readonly Client[],
  appointments: readonly AppointmentRecord[],
  settings: AppSettings,
): AppBackupPayload {
  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    clients: clients.map((c) => ({ ...c })),
    appointments: appointments.map((a) => ({
      ...a,
      amount: a.amount ?? 0,
    })),
    settings: { ...settings },
  };
}
