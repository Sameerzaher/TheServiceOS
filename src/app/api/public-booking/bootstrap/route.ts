import { NextResponse } from "next/server";

import { getSupabaseBusinessId } from "@/core/config/supabaseEnv";
import { loadAppSettingsOrDefault } from "@/core/repositories/supabase/appSettingsRepository";
import type { AppSettings } from "@/core/types/settings";
import { loadBookingSettingsOrDefault } from "@/core/repositories/supabase/bookingSettingsRepository";
import { teacherFromRow, type TeacherRow } from "@/core/storage/supabase/mappers";
import { coerceBusinessType, type BusinessType } from "@/core/types/teacher";
import type { AvailabilitySettings } from "@/core/types/availability";
import {
  isValidPublicTeacherSlug,
  normalizeTeacherSlug,
} from "@/core/validation/teacher";
import { heUi } from "@/config";
import {
  getSupabaseAdminClient,
  isSupabaseAdminConfigured,
} from "@/lib/supabase/adminClient";

export const runtime = "nodejs";

/** Prevents static analysis from executing the handler without a real Request URL. */
export const dynamic = "force-dynamic";

type BootstrapTeacher = {
  id: string;
  slug: string;
  fullName: string;
  businessName: string;
  phone: string;
  businessType: BusinessType;
};

type BootstrapBranding = {
  logoUrl: string | null;
  primaryColor: string | null;
  accentColor: string | null;
};

/** Active catalog rows for public booking (empty → UI falls back to vertical presets). */
export type BootstrapService = {
  id: string;
  name: string;
  price: number;
  durationMinutes: number;
};

type BootstrapOk = {
  ok: true;
  teacher: BootstrapTeacher;
  availability: AvailabilitySettings;
  /** Resolved tenant for settings queries — always present when ok */
  business: { id: string };
  /** Public booking page theme (from app settings). */
  branding: BootstrapBranding;
  /** From `services` table when present; otherwise []. */
  services: BootstrapService[];
};

function brandingFromAppSettings(app: AppSettings): BootstrapBranding {
  const logo = typeof app.brandLogoUrl === "string" ? app.brandLogoUrl.trim() : "";
  return {
    logoUrl: logo.length > 0 ? logo : null,
    primaryColor: app.brandPrimaryColor?.trim() || null,
    accentColor: app.brandAccentColor?.trim() || null,
  };
}

async function loadPublicServicesCatalog(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  businessId: string,
  teacherId: string,
): Promise<BootstrapService[]> {
  try {
    const { data, error } = await supabase
      .from("services")
      .select("id, name, price, duration_minutes, display_order")
      .eq("business_id", businessId)
      .eq("teacher_id", teacherId)
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (error) {
      console.warn("[public-booking/bootstrap] services:", error.message);
      return [];
    }
    const rows = Array.isArray(data) ? data : [];
    const out: BootstrapService[] = [];
    for (const r of rows) {
      if (!isRecord(r)) continue;
      const id = typeof r.id === "string" ? r.id.trim() : "";
      const name = typeof r.name === "string" ? r.name.trim() : "";
      if (!id || !name) continue;
      const price =
        typeof r.price === "number" && Number.isFinite(r.price) ? r.price : 0;
      const dm =
        typeof r.duration_minutes === "number" &&
        Number.isFinite(r.duration_minutes)
          ? Math.max(1, Math.trunc(r.duration_minutes))
          : 45;
      out.push({ id, name, price, durationMinutes: dm });
    }
    return out;
  } catch (e) {
    console.warn("[public-booking/bootstrap] services catalog", e);
    return [];
  }
}

type BootstrapErr = {
  ok: false;
  error: string;
};

function jsonErr(message: string, status: number): NextResponse<BootstrapErr> {
  try {
    return NextResponse.json({ ok: false as const, error: message }, { status });
  } catch (e) {
    console.error("[public-booking/bootstrap] jsonErr failed", e);
    return NextResponse.json(
      { ok: false as const, error: heUi.publicBooking.errUnavailable },
      { status: 503 },
    );
  }
}

function safeStr(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function isUuidLike(v: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    v.trim(),
  );
}

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

function asNonEmptyString(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length > 0 ? t : null;
}

/**
 * Resolves tenant UUID for booking bootstrap. Invalid non-empty `business_id` on the
 * teacher row yields a controlled failure (503) instead of querying the wrong tenant.
 * Missing/null `business_id` falls back to env / MVP default (legacy single-tenant).
 */
function resolveBootstrapBusinessId(
  teacherRow: unknown,
  envFallback: string,
):
  | { ok: true; businessId: string; usedFallback: boolean }
  | { ok: false } {
  const fallback =
    typeof envFallback === "string" && isUuidLike(envFallback)
      ? envFallback.trim()
      : getSupabaseBusinessId();

  if (!isRecord(teacherRow)) {
    return { ok: true, businessId: fallback, usedFallback: true };
  }

  const raw = teacherRow.business_id;
  if (raw == null || (typeof raw === "string" && raw.trim() === "")) {
    console.warn(
      "[public-booking/bootstrap] teacher.business_id missing; using env/default tenant",
      { fallback },
    );
    return { ok: true, businessId: fallback, usedFallback: true };
  }

  if (typeof raw === "string" && isUuidLike(raw)) {
    return { ok: true, businessId: raw.trim(), usedFallback: false };
  }

  console.error(
    "[public-booking/bootstrap] invalid business_id on teacher row (not a UUID)",
    typeof raw === "string" ? raw.slice(0, 64) : raw,
  );
  return { ok: false };
}

/**
 * Prefer mapper; if it returns null (partial row), rebuild from snake_case — avoids 404/500
 * when UI slug is valid but normalizedTeacher rejects sparse data.
 */
function bootstrapTeacherFromDbRow(
  row: unknown,
  urlSlugNormalized: string,
): BootstrapTeacher | null {
  if (!isRecord(row)) {
    console.warn("[public-booking/bootstrap] bootstrapTeacherFromDbRow: not an object");
    return null;
  }

  try {
    const mapped = teacherFromRow(row as unknown as TeacherRow);
    if (mapped) {
      return {
        id: mapped.id,
        slug: mapped.slug,
        fullName: mapped.fullName,
        businessName: mapped.businessName,
        phone: mapped.phone,
        businessType: mapped.businessType,
      };
    }
  } catch (e) {
    console.error("[public-booking/bootstrap] teacherFromRow threw", e);
  }

  const id = asNonEmptyString(row.id);
  if (!id) {
    console.warn("[public-booking/bootstrap] bootstrapTeacherFromDbRow: missing id on row");
    return null;
  }

  const slug = asNonEmptyString(row.slug) ?? urlSlugNormalized;
  const fullName = safeStr(row.full_name);
  const businessName = safeStr(row.business_name);
  const phone = safeStr(row.phone);

  console.warn(
    "[public-booking/bootstrap] teacherFromRow returned null; using raw row fields",
    { id, slug },
  );

  let bt: BusinessType = "driving_instructor";
  try {
    bt = coerceBusinessType(row.business_type);
  } catch (e) {
    console.warn("[public-booking/bootstrap] coerceBusinessType failed", e);
  }

  return {
    id,
    slug,
    fullName,
    businessName,
    phone,
    businessType: bt,
  };
}

async function loadLegacyBootstrap(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  businessId: string,
  teacherIdForScope: string,
  slugForDisplay: string,
): Promise<{
  teacher: BootstrapTeacher;
  availability: AvailabilitySettings;
  appSettings: AppSettings;
}> {
  console.log("[public-booking/bootstrap] Step=legacy_load_app_settings", {
    businessId,
    teacherId: teacherIdForScope,
  });

  const legacySettings = await loadAppSettingsOrDefault(
    supabase,
    businessId,
    teacherIdForScope,
    "legacy-bootstrap",
  );

  console.log("[public-booking/bootstrap] Step=legacy_app_settings_result", {
    hasBusinessName: safeStr(legacySettings?.businessName).length > 0,
    activePreset: legacySettings?.activePreset,
  });

  const availability = await loadBookingSettingsOrDefault(
    supabase,
    businessId,
    teacherIdForScope,
    "legacy-bootstrap",
  );

  console.log("[public-booking/bootstrap] Step=legacy_booking_settings_result", {
    bookingEnabled: availability?.bookingEnabled,
    daysAhead: availability?.daysAhead,
  });

  let legacyBt: BusinessType = "driving_instructor";
  try {
    legacyBt = coerceBusinessType(legacySettings?.activePreset);
  } catch (e) {
    console.warn("[public-booking/bootstrap] legacy coerceBusinessType failed", e);
  }

  const teacher: BootstrapTeacher = {
    id: teacherIdForScope,
    slug: slugForDisplay,
    fullName: safeStr(legacySettings?.teacherName),
    businessName: safeStr(legacySettings?.businessName),
    phone: safeStr(legacySettings?.businessPhone),
    businessType: legacyBt,
  };

  return { teacher, availability, appSettings: legacySettings };
}

export async function GET(req: Request): Promise<NextResponse<BootstrapOk | BootstrapErr>> {
  if (!isSupabaseAdminConfigured()) {
    console.error("[public-booking/bootstrap] Supabase admin not configured (URL / service role)");
    return jsonErr(heUi.publicBooking.errUnavailable, 503);
  }

  let supabase: ReturnType<typeof getSupabaseAdminClient>;
  try {
    supabase = getSupabaseAdminClient();
  } catch (e) {
    console.error("[public-booking/bootstrap] getSupabaseAdminClient failed", e);
    return jsonErr(heUi.publicBooking.errUnavailable, 503);
  }

  let slug: string;
  try {
    slug = new URL(req.url).searchParams.get("slug")?.trim() ?? "";
  } catch (e) {
    console.error("[public-booking/bootstrap] Step=parse_url failed:", e);
    return jsonErr(heUi.publicBooking.invalidSlugMessage, 400);
  }

  console.log("[public-booking/bootstrap] [TEMP] slug_received=", JSON.stringify(slug));

  if (!isValidPublicTeacherSlug(slug)) {
    console.warn("[public-booking/bootstrap] Step=validate_slug invalid format");
    return jsonErr(heUi.publicBooking.invalidSlugMessage, 404);
  }

  const normalizedSlug = normalizeTeacherSlug(slug);
  const envFallbackBusinessId = getSupabaseBusinessId();

  try {
    let teacherRes;
    try {
      teacherRes = await supabase
        .from("teachers")
        .select("*")
        .eq("slug", normalizedSlug)
        .maybeSingle();
    } catch (e) {
      console.error("[public-booking/bootstrap] teachers query threw", e);
      return jsonErr(heUi.publicBooking.errUnavailable, 503);
    }

    if (!teacherRes.data && !teacherRes.error && isUuidLike(normalizedSlug)) {
      console.log("[public-booking/bootstrap] Step=lookup no row by slug; trying id=UUID");
      try {
        teacherRes = await supabase
          .from("teachers")
          .select("*")
          .eq("id", normalizedSlug)
          .maybeSingle();
      } catch (e) {
        console.error("[public-booking/bootstrap] teachers id query threw", e);
        return jsonErr(heUi.publicBooking.errUnavailable, 503);
      }
    }

    const { data: row, error: teacherErr } = teacherRes;

    if (teacherErr) {
      console.error(
        "[public-booking/bootstrap] Step=teacher_query failed (PostgREST):",
        teacherErr,
      );
      return jsonErr(heUi.publicBooking.errUnavailable, 503);
    }

    console.log("[public-booking/bootstrap] [TEMP] business_lookup row_present=", Boolean(row));

    if (!row) {
      if (!isUuidLike(normalizedSlug)) {
        console.warn(
          "[public-booking/bootstrap] Step=teacher_lookup teacher_not_found slug=",
          normalizedSlug,
        );
        return jsonErr(heUi.publicBooking.invalidSlugMessage, 404);
      }

      console.log(
        "[public-booking/bootstrap] Step=legacy_no_teacher_row using env business_id for UUID scope",
        normalizedSlug,
      );
      try {
        const { teacher, availability, appSettings: legacyAppSettings } =
          await loadLegacyBootstrap(
          supabase,
          envFallbackBusinessId,
          normalizedSlug,
          normalizedSlug,
        );
        console.log("[public-booking/bootstrap] [TEMP] legacy availability", {
          bookingEnabled: availability?.bookingEnabled,
          daysAhead: availability?.daysAhead,
        });
        console.log("[public-booking/bootstrap] [TEMP] legacy_entities", {
          teacher: { id: teacher.id, slug: teacher.slug },
          business: { id: envFallbackBusinessId },
          bookingSettings: {
            bookingEnabled: availability?.bookingEnabled,
            daysAhead: availability?.daysAhead,
          },
        });
        return NextResponse.json({
          ok: true as const,
          teacher,
          availability,
          business: { id: envFallbackBusinessId },
          branding: brandingFromAppSettings(legacyAppSettings),
          services: [],
        });
      } catch (e) {
        console.error("[public-booking/bootstrap] loadLegacyBootstrap failed", e);
        return jsonErr(heUi.publicBooking.errUnavailable, 503);
      }
    }

    console.log("[public-booking/bootstrap] Step=teacher_row_present");

    const teacher = bootstrapTeacherFromDbRow(row, normalizedSlug);
    if (!teacher) {
      console.warn(
        "[public-booking/bootstrap] Step=map_teacher unusable row slug=",
        normalizedSlug,
      );
      return jsonErr(heUi.publicBooking.invalidSlugMessage, 404);
    }

    const scope = resolveBootstrapBusinessId(row, envFallbackBusinessId);
    if (!scope.ok) {
      return jsonErr(heUi.publicBooking.businessScopeError, 503);
    }
    const teacherBusinessId = scope.businessId;

    console.log("[public-booking/bootstrap] Step=load_app_settings", {
      teacherId: teacher.id,
      businessId: teacherBusinessId,
    });

    let appSettings;
    try {
      appSettings = await loadAppSettingsOrDefault(
        supabase,
        teacherBusinessId,
        teacher.id,
        "bootstrap",
      );
    } catch (e) {
      console.error("[public-booking/bootstrap] loadAppSettingsOrDefault failed", e);
      return jsonErr(heUi.publicBooking.errUnavailable, 503);
    }

    console.log("[public-booking/bootstrap] [TEMP] app_settings_result", {
      hasBusinessName: safeStr(appSettings?.businessName).length > 0,
      hasTeacherName: safeStr(appSettings?.teacherName).length > 0,
      activePreset: appSettings?.activePreset,
    });

    console.log("[public-booking/bootstrap] Step=load_booking_settings", {
      teacherId: teacher.id,
      businessId: teacherBusinessId,
    });

    let availability;
    try {
      availability = await loadBookingSettingsOrDefault(
        supabase,
        teacherBusinessId,
        teacher.id,
        "bootstrap",
      );
    } catch (e) {
      console.error("[public-booking/bootstrap] loadBookingSettingsOrDefault failed", e);
      return jsonErr(heUi.publicBooking.errUnavailable, 503);
    }

    console.log("[public-booking/bootstrap] [TEMP] booking_settings_result", {
      bookingEnabled: availability?.bookingEnabled,
      daysAhead: availability?.daysAhead,
      slotDurationMinutes: availability?.slotDurationMinutes,
      hasWeekly:
        availability?.weeklyAvailability &&
        typeof availability.weeklyAvailability === "object",
    });

    const businessName =
      safeStr(teacher.businessName) ||
      safeStr(appSettings?.businessName) ||
      "";
    const fullName =
      safeStr(teacher.fullName) ||
      safeStr(appSettings?.teacherName) ||
      "";
    const phone =
      safeStr(teacher.phone) || safeStr(appSettings?.businessPhone) || "";
    let businessType: BusinessType = teacher.businessType;
    try {
      businessType =
        teacher.businessType || coerceBusinessType(appSettings?.activePreset);
    } catch (e) {
      console.warn("[public-booking/bootstrap] businessType merge failed", e);
      businessType = "driving_instructor";
    }

    console.log("[public-booking/bootstrap] [TEMP] entities", {
      teacher: { id: teacher.id, slug: teacher.slug, businessName, fullName },
      business: { id: teacherBusinessId },
      bookingSettings: {
        bookingEnabled: availability?.bookingEnabled,
        daysAhead: availability?.daysAhead,
        slotDurationMinutes: availability?.slotDurationMinutes,
      },
    });

    console.log(
      "[public-booking/bootstrap] Step=done ok teacher_slug=",
      teacher.slug,
      "bookingEnabled=",
      availability?.bookingEnabled,
    );

    const servicesCatalog = await loadPublicServicesCatalog(
      supabase,
      teacherBusinessId,
      teacher.id,
    );

    return NextResponse.json({
      ok: true as const,
      teacher: {
        id: teacher.id,
        slug: teacher.slug,
        fullName,
        businessName,
        phone,
        businessType,
      },
      availability,
      business: { id: teacherBusinessId },
      branding: brandingFromAppSettings(appSettings),
      services: servicesCatalog,
    });
  } catch (e) {
    console.error("[public-booking/bootstrap] Step=unhandled_exception:", e);
    return jsonErr(heUi.publicBooking.errUnavailable, 503);
  }
}
