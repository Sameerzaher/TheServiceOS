import { paymentStatusLabel } from "@/config";
import type { AppointmentRecord } from "@/core/types/appointment";
import type { Client } from "@/core/types/client";
import { downloadCsv } from "@/core/utils/csv";

function stamp(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatLessonDateTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat("he-IL", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function exportStudentsCsv(clients: Client[], prefix = "תלמידים"): void {
  const headers = ["מזהה", "שם מלא", "טלפון", "הערות", "נוצר"];
  const rows = clients.map((c) => [
    c.id,
    c.fullName,
    c.phone,
    c.notes.replace(/\r?\n/g, " "),
    c.createdAt,
  ]);
  downloadCsv(`${prefix}-${stamp()}`, headers, rows);
}

/**
 * Filtered lesson export: client name, phone, lesson datetime, amount, payment status.
 * Filename: `serviceos-export-YYYY-MM-DD.csv` (export date).
 */
export function exportServiceosLessonsCsv(
  appointments: AppointmentRecord[],
  clients: Client[],
): void {
  const byId = new Map(clients.map((c) => [c.id, c]));
  const headers = [
    "שם תלמיד",
    "טלפון",
    "תאריך ושעה",
    "סכום (₪)",
    "סטטוס תשלום",
  ];
  const rows = appointments.map((a) => {
    const c = byId.get(a.clientId);
    return [
      c?.fullName ?? "",
      (c?.phone ?? "").trim(),
      formatLessonDateTime(a.startAt),
      String(a.amount ?? 0),
      paymentStatusLabel(a.paymentStatus),
    ];
  });
  downloadCsv(`serviceos-export-${stamp()}`, headers, rows);
}
