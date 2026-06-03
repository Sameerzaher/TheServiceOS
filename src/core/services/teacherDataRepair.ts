import { randomUUID } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

import { isUsableBusinessId } from "@/core/constants/uuids";
import { upsertBusinessRecord } from "@/core/repositories/supabase/businessRepository";
import { persistBookingSettings } from "@/core/repositories/supabase/bookingSettingsRepository";
import { buildDefaultBookingSettingsForNewTeacher } from "@/core/types/availability";

const LOG_PREFIX = "[teacherDataRepair]";

export type RepairStep = {
  action: string;
  teacherId?: string;
  businessId?: string;
  detail?: string;
};

export type TeacherDataRepairReport = {
  steps: RepairStep[];
  businessesInserted: number;
  teachersFixedBusinessId: number;
  bookingSettingsInserted: number;
  errors: string[];
};

async function businessRowExists(
  supabase: SupabaseClient,
  businessId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("businesses")
    .select("id")
    .eq("id", businessId)
    .maybeSingle();
  if (error) {
    console.warn(LOG_PREFIX, "businessRowExists query error", error);
    return false;
  }
  return data != null;
}

/**
 * Ensures every valid `teachers.business_id` has a row in `public.businesses`.
 */
async function repairMissingBusinessRows(
  supabase: SupabaseClient,
  report: TeacherDataRepairReport,
  dryRun: boolean,
): Promise<void> {
  const { data: teachers, error } = await supabase
    .from("teachers")
    .select("id, business_id, business_name");
  if (error) {
    report.errors.push(`list teachers: ${error.message}`);
    return;
  }

  const seen = new Set<string>();
  for (const row of teachers ?? []) {
    const bid = row.business_id as string | null;
    if (!bid || !isUsableBusinessId(bid)) continue;
    if (seen.has(bid)) continue;
    seen.add(bid);

    const exists = await businessRowExists(supabase, bid);
    if (exists) continue;

    const name =
      typeof row.business_name === "string" && row.business_name.trim()
        ? row.business_name.trim()
        : "Business";
    report.steps.push({
      action: "insert_business",
      businessId: bid,
      detail: name,
    });
    if (dryRun) continue;

    try {
      await upsertBusinessRecord(supabase, bid, name);
      report.businessesInserted += 1;
    } catch (e) {
      report.errors.push(
        `business ${bid}: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }
}

/**
 * Fixes teachers whose `business_id` is null or nil UUID by assigning a new business
 * and migrating scoped rows (clients, appointments, booking_settings, app_settings).
 */
async function repairInvalidTeacherBusinessIds(
  supabase: SupabaseClient,
  report: TeacherDataRepairReport,
  dryRun: boolean,
): Promise<void> {
  const { data: teachers, error } = await supabase
    .from("teachers")
    .select("id, business_id, business_name");
  if (error) {
    report.errors.push(`list teachers (invalid bid): ${error.message}`);
    return;
  }

  for (const row of teachers ?? []) {
    const tid = row.id as string;
    const bid = row.business_id as string | null;
    if (bid != null && isUsableBusinessId(bid)) continue;

    const newBusinessId = randomUUID();
    const label =
      typeof row.business_name === "string" && row.business_name.trim()
        ? row.business_name.trim()
        : "Business";

    report.steps.push({
      action: "fix_teacher_business_id",
      teacherId: tid,
      businessId: newBusinessId,
      detail: `from ${bid ?? "null"} / nil`,
    });
    if (dryRun) continue;

    try {
      await upsertBusinessRecord(supabase, newBusinessId, label);

      const { error: u1 } = await supabase
        .from("teachers")
        .update({
          business_id: newBusinessId,
        })
        .eq("id", tid);
      if (u1) {
        const errorMsg = u1.message || u1.hint || JSON.stringify(u1);
        throw new Error(`Failed to update teacher business_id: ${errorMsg}`);
      }

      await supabase
        .from("clients")
        .update({ business_id: newBusinessId })
        .eq("teacher_id", tid);

      await supabase
        .from("appointments")
        .update({ business_id: newBusinessId })
        .eq("teacher_id", tid);

      await supabase
        .from("booking_settings")
        .update({ business_id: newBusinessId })
        .eq("teacher_id", tid);

      await supabase
        .from("serviceos_app_settings")
        .update({ business_id: newBusinessId })
        .eq("teacher_id", tid);

      report.teachersFixedBusinessId += 1;
      console.log(LOG_PREFIX, "fixed teacher business_id", { teacherId: tid, newBusinessId });
    } catch (e) {
      const errorMsg = e instanceof Error 
        ? e.message 
        : typeof e === 'object' && e !== null 
          ? JSON.stringify(e) 
          : String(e);
      report.errors.push(`teacher ${tid}: ${errorMsg}`);
      console.error(LOG_PREFIX, "Failed to fix teacher", tid, errorMsg);
    }
  }
}

async function repairMissingBookingSettings(
  supabase: SupabaseClient,
  report: TeacherDataRepairReport,
  dryRun: boolean,
): Promise<void> {
  const { data: teachers, error } = await supabase
    .from("teachers")
    .select("id, business_id");
  if (error) {
    report.errors.push(`list teachers (booking): ${error.message}`);
    return;
  }

  for (const row of teachers ?? []) {
    const tid = row.id as string;
    const bid = row.business_id as string | null;
    if (!bid || !isUsableBusinessId(bid)) continue;

    const { data: direct, error: qErr } = await supabase
      .from("booking_settings")
      .select("teacher_id")
      .eq("business_id", bid)
      .eq("teacher_id", tid)
      .maybeSingle();
    if (qErr) {
      report.errors.push(`booking_settings query ${tid}: ${qErr.message}`);
      continue;
    }
    if (direct) continue;

    report.steps.push({
      action: "insert_booking_settings",
      teacherId: tid,
      businessId: bid,
    });
    if (dryRun) continue;

    try {
      const defaults = buildDefaultBookingSettingsForNewTeacher(tid);
      await persistBookingSettings(supabase, bid, tid, defaults);
      report.bookingSettingsInserted += 1;
      console.log(LOG_PREFIX, "inserted booking_settings", { tid, bid });
    } catch (e) {
      report.errors.push(
        `booking_settings ${tid}: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }
}

/**
 * Detects and fixes broken teacher ↔ business ↔ booking_settings links.
 */
export async function runTeacherDataRepair(
  supabase: SupabaseClient,
  options: { dryRun?: boolean } = {},
): Promise<TeacherDataRepairReport> {
  const dryRun = options.dryRun === true;
  const report: TeacherDataRepairReport = {
    steps: [],
    businessesInserted: 0,
    teachersFixedBusinessId: 0,
    bookingSettingsInserted: 0,
    errors: [],
  };

  console.log(LOG_PREFIX, "runTeacherDataRepair start", { dryRun });

  // Check if businesses table exists
  const { error: tableCheckError } = await supabase
    .from("businesses")
    .select("id")
    .limit(1);
  
  if (tableCheckError) {
    const errorMsg = tableCheckError.message || JSON.stringify(tableCheckError);
    if (errorMsg.includes('relation') && errorMsg.includes('does not exist')) {
      console.error(LOG_PREFIX, "businesses table does not exist - run migration 012_businesses.sql");
      report.errors.push(
        "טבלת businesses לא קיימת במסד הנתונים. יש להריץ את המיגרציה 012_businesses.sql"
      );
      return report;
    }
    console.warn(LOG_PREFIX, "Error checking businesses table:", errorMsg);
  }

  await repairMissingBusinessRows(supabase, report, dryRun);
  await repairInvalidTeacherBusinessIds(supabase, report, dryRun);
  await repairMissingBookingSettings(supabase, report, dryRun);

  console.log(LOG_PREFIX, "runTeacherDataRepair done", {
    businessesInserted: report.businessesInserted,
    teachersFixedBusinessId: report.teachersFixedBusinessId,
    bookingSettingsInserted: report.bookingSettingsInserted,
    errorCount: report.errors.length,
  });

  return report;
}
