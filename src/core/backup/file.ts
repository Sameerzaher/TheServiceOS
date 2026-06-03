import type { AppBackupPayload } from "./schema";

function backupFilename(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `serviceos-backup-${y}-${m}-${day}-${h}${min}.json`;
}

/** Triggers a browser download of the backup JSON. */
export function downloadBackupFile(payload: AppBackupPayload): void {
  if (typeof window === "undefined") return;
  const body = JSON.stringify(payload, null, 2);
  const blob = new Blob([body], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = backupFilename();
  a.rel = "noopener";
  a.click();
  URL.revokeObjectURL(url);
}
