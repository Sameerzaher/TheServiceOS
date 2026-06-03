import { NextResponse } from "next/server";

import { getSupabaseBusinessId } from "@/core/config/supabaseEnv";
import { loadAppSettings, persistAppSettings } from "@/core/repositories/supabase/appSettingsRepository";
import { isMissingColumnError } from "@/core/repositories/supabase/postgrestErrors";
import { loadBookingSettings, persistBookingSettings } from "@/core/repositories/supabase/bookingSettingsRepository";
import { normalizeAppSettings, type AppSettings } from "@/core/types/settings";
import { coerceBusinessType, type BusinessType } from "@/core/types/teacher";
import { normalizeAvailabilitySettings } from "@/core/types/availability";
import { resolveTeacherIdFromRequest } from "@/lib/api/resolveTeacherId";
import { getSupabaseAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/adminClient";

export const runtime = "nodejs";

export const dynamic = "force-dynamic";

const HE_ERR_UNAVAILABLE = "טעינת ההגדרות אינה זמינה כרגע. נסו שוב מאוחר יותר.";
const HE_ERR_INVALID = "בקשת ההגדרות לא תקינה.";
const HE_ERR_GENERIC = "אירעה תקלה בשמירת ההגדרות. נסו שוב.";

type SettingsApiResponse = {
  businessName: string;
  teacherName: string;
  phone: string;
  businessType: BusinessType;
  defaultLessonDuration: number;
  bookingEnabled: boolean;
  workingHoursStart: string;
  workingHoursEnd: string;
  bufferBetweenLessons: number;
  brandLogoUrl: string;
  brandPrimaryColor: string;
  brandAccentColor: string;
};

function toApiShape(
  app: AppSettings,
  bookingEnabled: boolean,
  businessType: BusinessType,
): SettingsApiResponse {
  return {
    businessName: app.businessName,
    teacherName: app.teacherName ?? "",
    phone: app.businessPhone,
    businessType,
    defaultLessonDuration: app.defaultLessonDurationMinutes,
    bookingEnabled,
    workingHoursStart: app.workingHoursStart,
    workingHoursEnd: app.workingHoursEnd,
    bufferBetweenLessons: app.lessonBufferMinutes,
    brandLogoUrl: app.brandLogoUrl ?? "",
    brandPrimaryColor: app.brandPrimaryColor,
    brandAccentColor: app.brandAccentColor,
  };
}

type SettingsPutParsed = Omit<SettingsApiResponse, "businessType"> & {
  /** `null` when the client omitted the field — keep existing preset. */
  businessType: BusinessType | null;
};

function parseBody(raw: unknown): SettingsPutParsed | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const businessName = typeof o.businessName === "string" ? o.businessName.trim() : "";
  const teacherName = typeof o.teacherName === "string" ? o.teacherName.trim() : "";
  const phone = typeof o.phone === "string" ? o.phone.trim() : "";
  const businessType =
    "businessType" in o ? coerceBusinessType(o.businessType) : null;
  const workingHoursStart =
    typeof o.workingHoursStart === "string" ? o.workingHoursStart.trim() : "";
  const workingHoursEnd =
    typeof o.workingHoursEnd === "string" ? o.workingHoursEnd.trim() : "";
  const bookingEnabled = typeof o.bookingEnabled === "boolean" ? o.bookingEnabled : null;
  const defaultLessonDuration = Number(o.defaultLessonDuration);
  const bufferBetweenLessons = Number(o.bufferBetweenLessons);
  const brandLogoUrl =
    typeof o.brandLogoUrl === "string" ? o.brandLogoUrl.trim() : "";
  const brandPrimaryColor =
    typeof o.brandPrimaryColor === "string" ? o.brandPrimaryColor.trim() : "";
  const brandAccentColor =
    typeof o.brandAccentColor === "string" ? o.brandAccentColor.trim() : "";

  if (bookingEnabled === null) return null;
  if (!Number.isFinite(defaultLessonDuration)) return null;
  if (!Number.isFinite(bufferBetweenLessons)) return null;

  return {
    businessName,
    teacherName,
    phone,
    businessType,
    defaultLessonDuration,
    bookingEnabled,
    workingHoursStart,
    workingHoursEnd,
    bufferBetweenLessons,
    brandLogoUrl,
    brandPrimaryColor,
    brandAccentColor,
  };
}

export async function GET(req: Request): Promise<NextResponse> {
  if (!isSupabaseAdminConfigured()) {
    console.error("[settings/get] Supabase not configured");
    return NextResponse.json({ ok: false as const, error: HE_ERR_UNAVAILABLE }, { status: 503 });
  }

  try {
    const supabase = getSupabaseAdminClient();
    const businessId = getSupabaseBusinessId();
    const teacherId = resolveTeacherIdFromRequest(req);
    
    console.log("[settings/get] Loading settings for:", { businessId, teacherId });
    
    const [appSettings, bookingSettings, teacherRow] = await Promise.all([
      loadAppSettings(supabase, businessId, teacherId),
      loadBookingSettings(supabase, businessId, teacherId),
      supabase
        .from("teachers")
        .select("*")
        .eq("business_id", businessId)
        .eq("id", teacherId)
        .maybeSingle(),
    ]);

    if (teacherRow.error) {
      console.error("[settings/get] Teacher query error:", teacherRow.error);
    }
    const tdata = teacherRow.data as
      | { slug?: string; business_type?: string | null }
      | null;
    const teacherSlug =
      !teacherRow.error && tdata && typeof tdata.slug === "string"
        ? tdata.slug.trim()
        : null;
    const teacherBusinessType =
      !teacherRow.error && tdata
        ? coerceBusinessType(tdata.business_type)
        : appSettings.activePreset;

    console.log("[settings/get] SUCCESS - Settings loaded:", { teacherId, teacherSlug, teacherBusinessType });

    return NextResponse.json({
      ok: true as const,
      settings: toApiShape(
        appSettings,
        bookingSettings.bookingEnabled,
        teacherBusinessType,
      ),
      teacherSlug: teacherSlug && teacherSlug.length > 0 ? teacherSlug : null,
    });
  } catch (e) {
    console.error("[settings/get] Unexpected error:", e);
    return NextResponse.json({ ok: false as const, error: HE_ERR_GENERIC }, { status: 500 });
  }
}

export async function PUT(req: Request): Promise<NextResponse> {
  console.log("[settings/put] Updating settings");
  
  if (!isSupabaseAdminConfigured()) {
    console.error("[settings/put] Supabase not configured");
    return NextResponse.json({ ok: false as const, error: HE_ERR_UNAVAILABLE }, { status: 503 });
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch (e) {
    console.error("[settings/put] Invalid JSON:", e);
    return NextResponse.json({ ok: false as const, error: HE_ERR_INVALID }, { status: 400 });
  }
  const parsed = parseBody(raw);
  if (!parsed) {
    console.error("[settings/put] Validation failed");
    return NextResponse.json({ ok: false as const, error: HE_ERR_INVALID }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdminClient();
    const businessId = getSupabaseBusinessId();
    const teacherId = resolveTeacherIdFromRequest(req, raw);
    
    console.log("[settings/put] Saving settings for:", { businessId, teacherId });
    
    const currentApp = await loadAppSettings(supabase, businessId, teacherId);
    const currentAvailability = await loadBookingSettings(
      supabase,
      businessId,
      teacherId,
    );

    const resolvedBusinessType =
      parsed.businessType ?? currentApp.activePreset;

    console.log("[settings/put] Business type:", { current: currentApp.activePreset, new: resolvedBusinessType });

    const nextApp = normalizeAppSettings({
      ...currentApp,
      teacherId,
      activePreset: resolvedBusinessType,
      businessName: parsed.businessName,
      teacherName: parsed.teacherName,
      businessPhone: parsed.phone,
      defaultLessonDurationMinutes: parsed.defaultLessonDuration,
      lessonBufferMinutes: parsed.bufferBetweenLessons,
      workingHoursStart: parsed.workingHoursStart,
      workingHoursEnd: parsed.workingHoursEnd,
      brandLogoUrl: parsed.brandLogoUrl,
      brandPrimaryColor: parsed.brandPrimaryColor,
      brandAccentColor: parsed.brandAccentColor,
    });
    const nextAvailability = normalizeAvailabilitySettings({
      ...currentAvailability,
      teacherId,
      bookingEnabled: parsed.bookingEnabled,
    });

    await Promise.all([
      persistAppSettings(supabase, businessId, teacherId, nextApp),
      persistBookingSettings(supabase, businessId, teacherId, nextAvailability),
    ]);

    console.log("[settings/put] Settings persisted, updating teacher business_type");

    const teacherUpdate = await supabase
      .from("teachers")
      .update({ business_type: resolvedBusinessType })
      .eq("business_id", businessId)
      .eq("id", teacherId);
    if (teacherUpdate.error && !isMissingColumnError(teacherUpdate.error)) {
      console.error("[settings/put] Teacher update error:", teacherUpdate.error);
      throw teacherUpdate.error;
    }
    
    if (teacherUpdate.error && isMissingColumnError(teacherUpdate.error)) {
      console.log("[settings/put] business_type column missing on teachers, skipping");
    }

    const { data: slugRow } = await supabase
      .from("teachers")
      .select("slug")
      .eq("business_id", businessId)
      .eq("id", teacherId)
      .maybeSingle();
    const slugRaw =
      slugRow && typeof slugRow === "object" && "slug" in slugRow
        ? String((slugRow as { slug: unknown }).slug ?? "").trim()
        : "";
    const teacherSlugAfter = slugRaw.length > 0 ? slugRaw : null;

    console.log("[settings/put] SUCCESS - Settings saved:", { teacherId, businessType: resolvedBusinessType });

    return NextResponse.json({
      ok: true as const,
      settings: toApiShape(
        nextApp,
        nextAvailability.bookingEnabled,
        resolvedBusinessType,
      ),
      teacherSlug: teacherSlugAfter,
    });
  } catch (e) {
    console.error("[settings/put] Unexpected error:", e);
    return NextResponse.json({ ok: false as const, error: HE_ERR_GENERIC }, { status: 500 });
  }
}
