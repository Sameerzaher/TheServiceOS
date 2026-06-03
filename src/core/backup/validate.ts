import { normalizeAppSettings, type AppSettings } from "@/core/types/settings";
import {
  parseAppointmentsArray,
  parseClientsArray,
} from "@/core/persistence/entityNormalize";

import { BACKUP_VERSION, type AppBackupPayload } from "./schema";

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

export type BackupValidationResult =
  | { ok: true; data: AppBackupPayload }
  | { ok: false; errorKey: BackupErrorKey };

export type BackupErrorKey = "notObject" | "badVersion" | "parseJson";

/**
 * Validates backup JSON shape; repairs rows via the same normalizers as LocalStorage loads.
 */
export function parseAndValidateBackup(
  raw: unknown,
): BackupValidationResult {
  if (!isRecord(raw)) {
    return { ok: false, errorKey: "notObject" };
  }

  const version = raw.version;
  if (
    typeof version !== "number" ||
    !Number.isFinite(version) ||
    version !== BACKUP_VERSION
  ) {
    return { ok: false, errorKey: "badVersion" };
  }

  const clientsRaw = raw.clients;
  const appointmentsRaw = raw.appointments;
  const clients = parseClientsArray(
    Array.isArray(clientsRaw) ? clientsRaw : [],
  );
  const clientIds = new Set(clients.map((c) => c.id));
  const appointments = parseAppointmentsArray(
    Array.isArray(appointmentsRaw) ? appointmentsRaw : [],
    clientIds,
  );

  const settings: AppSettings = normalizeAppSettings(raw.settings);

  const exportedAt =
    typeof raw.exportedAt === "string"
      ? raw.exportedAt
      : new Date().toISOString();

  const data: AppBackupPayload = {
    version: BACKUP_VERSION,
    exportedAt,
    clients,
    appointments,
    settings,
  };

  return { ok: true, data };
}
