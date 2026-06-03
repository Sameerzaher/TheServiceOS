import type { AppointmentRecord } from "@/core/types/appointment";
import type { Client } from "@/core/types/client";
import type { AppSettings } from "@/core/types/settings";

/** Bump when on-disk JSON shape changes (import can migrate by version). */
export const BACKUP_VERSION = 1;

/**
 * Full app snapshot for export/import (matches LocalStorage domain, not raw keys).
 */
export interface AppBackupPayload {
  version: number;
  exportedAt: string;
  clients: Client[];
  appointments: AppointmentRecord[];
  settings: AppSettings;
}
