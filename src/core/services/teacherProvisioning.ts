import { randomUUID } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

import { isUsableBusinessId } from "@/core/constants/uuids";
import { upsertBusinessRecord } from "@/core/repositories/supabase/businessRepository";
import { persistAppSettings } from "@/core/repositories/supabase/appSettingsRepository";
import { persistBookingSettings } from "@/core/repositories/supabase/bookingSettingsRepository";
import { DEFAULT_APP_SETTINGS } from "@/core/types/settings";
import {
  buildDefaultBookingSettingsForNewTeacher,
} from "@/core/types/availability";
import type { BusinessType, UserRole } from "@/core/types/teacher";
import { coerceBusinessType } from "@/core/types/teacher";
import { normalizeTeacherSlug } from "@/core/validation/teacher";
import {
  hashPassword,
  isValidEmail,
  isValidPassword,
} from "@/lib/auth/passwordUtils";

const LOG_PREFIX = "[teacherProvisioning]";

export type CreateTeacherWithBusinessInput = {
  fullName: string;
  businessName: string;
  phone: string;
  slug: string;
  businessType: BusinessType;
  email: string;
  password: string;
  role: UserRole;
};

export type ProvisionTeacherErrorCode =
  | "INVALID_INPUT"
  | "INVALID_BUSINESS_SCOPE"
  | "SLUG_TAKEN"
  | "EMAIL_TAKEN"
  | "BUSINESS_UPSERT"
  | "DB_TEACHER"
  | "DB_SETTINGS";

export type CreateTeacherWithBusinessResult =
  | { ok: true; teacherId: string; businessId: string }
  | {
      ok: false;
      error: string;
      code: ProvisionTeacherErrorCode;
      details?: string;
    };

function validateInput(
  input: CreateTeacherWithBusinessInput,
): { ok: true } | { ok: false; error: string } {
  const fullName = input.fullName.trim();
  const businessName = input.businessName.trim();
  const email = input.email.trim().toLowerCase();
  const password = input.password;
  const slug = normalizeTeacherSlug(input.slug);

  if (fullName.length < 2) {
    return { ok: false, error: "שם מלא לא תקין" };
  }
  if (businessName.length < 2) {
    return { ok: false, error: "שם עסק לא תקין" };
  }
  if (!email || !isValidEmail(email)) {
    return { ok: false, error: "אימייל לא תקין" };
  }
  const pw = isValidPassword(password);
  if (!pw.valid) {
    return { ok: false, error: pw.error ?? "סיסמה לא תקינה" };
  }
  if (!slug || slug.length < 2) {
    return { ok: false, error: "slug לא תקין" };
  }
  return { ok: true };
}

async function rollbackTeacherScope(
  supabase: SupabaseClient,
  businessId: string,
  teacherId: string,
): Promise<void> {
  await supabase
    .from("booking_settings")
    .delete()
    .eq("business_id", businessId)
    .eq("teacher_id", teacherId);
  await supabase
    .from("serviceos_app_settings")
    .delete()
    .eq("business_id", businessId)
    .eq("teacher_id", teacherId);
  const { error } = await supabase.from("teachers").delete().eq("id", teacherId);
  if (error) {
    console.error(LOG_PREFIX, "rollback: teacher delete failed", error);
  }
}

/**
 * Creates a teacher under an existing business scope: ensures `businesses` row,
 * inserts `teachers`, then app + booking settings. Rolls back on failure.
 */
export async function createTeacherWithBusiness(
  supabase: SupabaseClient,
  businessId: string,
  /** Display name stored on `businesses` (org label — usually admin org name). */
  organizationBusinessName: string,
  input: CreateTeacherWithBusinessInput,
): Promise<CreateTeacherWithBusinessResult> {
  const v = validateInput(input);
  if (!v.ok) {
    return { ok: false, code: "INVALID_INPUT", error: v.error };
  }

  if (!isUsableBusinessId(businessId)) {
    console.error(LOG_PREFIX, "createTeacherWithBusiness: invalid business_id scope");
    return {
      ok: false,
      code: "INVALID_BUSINESS_SCOPE",
      error:
        "מזהה עסק לא תקין. יש להריץ תיקון נתונים או לפנות לתמיכה.",
    };
  }

  const fullName = input.fullName.trim();
  const businessName = input.businessName.trim();
  const phone = input.phone.trim();
  const slug = normalizeTeacherSlug(input.slug);
  const email = input.email.trim().toLowerCase();
  const businessType = coerceBusinessType(input.businessType);
  const role: UserRole = input.role === "admin" ? "admin" : "user";

  console.log(LOG_PREFIX, "teacher creation started", { email, slug, businessId });

  const { data: slugRow } = await supabase
    .from("teachers")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (slugRow) {
    console.warn(LOG_PREFIX, "duplicate slug", slug);
    return { ok: false, code: "SLUG_TAKEN", error: "ה-slug כבר קיים במערכת." };
  }

  const { data: emailRow } = await supabase
    .from("teachers")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (emailRow) {
    console.warn(LOG_PREFIX, "duplicate email", email);
    return { ok: false, code: "EMAIL_TAKEN", error: "האימייל כבר קיים במערכת." };
  }

  try {
    await upsertBusinessRecord(supabase, businessId, organizationBusinessName);
    console.log(LOG_PREFIX, "business record ensured", { businessId });
  } catch (e) {
    console.error(LOG_PREFIX, "business upsert failed", e);
    return {
      ok: false,
      code: "BUSINESS_UPSERT",
      error: "אירעה תקלה ביצירת רשומת העסק.",
      details: e instanceof Error ? e.message : String(e),
    };
  }

  const teacherId = randomUUID();
  const now = new Date().toISOString();
  const passwordHash = hashPassword(input.password);

  const { error: insertError } = await supabase.from("teachers").insert({
    id: teacherId,
    business_id: businessId,
    full_name: fullName,
    business_name: businessName,
    phone: phone || "",
    slug,
    business_type: businessType,
    email,
    password_hash: passwordHash,
    role,
    is_active: true,
    created_at: now,
  });

  if (insertError) {
    console.error(LOG_PREFIX, "teacher insert failed", insertError);
    return {
      ok: false,
      code: "DB_TEACHER",
      error: "אירעה תקלה ביצירת המורה.",
      details: insertError.message,
    };
  }

  console.log(LOG_PREFIX, "teacher created", { teacherId, businessId });

  try {
    await persistAppSettings(supabase, businessId, teacherId, {
      ...DEFAULT_APP_SETTINGS,
      businessName,
      teacherName: fullName,
      businessPhone: phone || "",
      activePreset: businessType,
    });

    const bookingDefaults = buildDefaultBookingSettingsForNewTeacher(teacherId);
    await persistBookingSettings(supabase, businessId, teacherId, bookingDefaults);

    console.log(LOG_PREFIX, "booking_settings created", {
      teacherId,
      businessId,
      bookingEnabled: bookingDefaults.bookingEnabled,
    });
  } catch (settingsErr) {
    console.error(LOG_PREFIX, "settings failed; rolling back teacher", settingsErr);
    await rollbackTeacherScope(supabase, businessId, teacherId);
    return {
      ok: false,
      code: "DB_SETTINGS",
      error: "המורה נוצר אך הגדרות ההזמנה נכשלו. הניסיון בוטל.",
      details: settingsErr instanceof Error ? settingsErr.message : String(settingsErr),
    };
  }

  console.log(LOG_PREFIX, "complete", { teacherId, businessId });
  return { ok: true, teacherId, businessId };
}
