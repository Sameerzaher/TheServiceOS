import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

import { getSupabaseBusinessId } from "@/core/config/supabaseEnv";
import { isUsableBusinessId } from "@/core/constants/uuids";
import {
  getSupabaseAdminClient,
  isSupabaseAdminConfigured,
} from "@/lib/supabase/adminClient";
import {
  hashPassword,
  isValidEmail,
  isValidPassword,
} from "@/lib/auth/passwordUtils";
import type { SignupTeacherInput, BusinessType } from "@/core/types/teacher";
import { persistAppSettings } from "@/core/repositories/supabase/appSettingsRepository";
import { persistBookingSettings } from "@/core/repositories/supabase/bookingSettingsRepository";
import { upsertBusinessRecord } from "@/core/repositories/supabase/businessRepository";
import { DEFAULT_APP_SETTINGS } from "@/core/types/settings";
import { buildDefaultBookingSettingsForNewTeacher } from "@/core/types/availability";

export const runtime = "nodejs";

const HE_ERR_UNAVAILABLE = "שירות ההרשמה אינו זמין כרגע.";
const HE_ERR_INVALID = "נתונים לא תקינים.";
const HE_ERR_EMAIL_EXISTS = "האימייל כבר קיים במערכת.";
const HE_ERR_SLUG_EXISTS = "ה-slug כבר קיים במערכת.";
const HE_ERR_GENERIC = "אירעה שגיאה. נסה שוב.";

export async function POST(req: Request): Promise<NextResponse> {
  console.log("[auth/signup] Starting signup process");
  
  if (!isSupabaseAdminConfigured()) {
    console.error("[auth/signup] Supabase admin not configured");
    return NextResponse.json(
      { ok: false as const, error: HE_ERR_UNAVAILABLE },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch (e) {
    console.error("[auth/signup] Invalid JSON:", e);
    return NextResponse.json(
      { ok: false as const, error: HE_ERR_INVALID },
      { status: 400 }
    );
  }

  const { email, password, fullName, businessName, phone, slug, businessType, role } =
    body as Partial<SignupTeacherInput>;

  console.log("[auth/signup] Request data:", { email, fullName, businessName, slug, businessType, role, hasPassword: !!password });

  // Validation
  if (!email || !isValidEmail(email)) {
    console.error("[auth/signup] Invalid email:", email);
    return NextResponse.json(
      { ok: false as const, error: "אימייל לא תקין" },
      { status: 400 }
    );
  }

  if (!password) {
    console.error("[auth/signup] Password missing");
    return NextResponse.json(
      { ok: false as const, error: "סיסמה חסרה" },
      { status: 400 }
    );
  }

  const passwordValidation = isValidPassword(password);
  if (!passwordValidation.valid) {
    console.error("[auth/signup] Password validation failed:", passwordValidation.error);
    return NextResponse.json(
      { ok: false as const, error: passwordValidation.error },
      { status: 400 }
    );
  }

  if (!fullName || fullName.trim().length < 2) {
    console.error("[auth/signup] Invalid fullName:", fullName);
    return NextResponse.json(
      { ok: false as const, error: "שם מלא לא תקין" },
      { status: 400 }
    );
  }

  if (!businessName || businessName.trim().length < 2) {
    console.error("[auth/signup] Invalid businessName:", businessName);
    return NextResponse.json(
      { ok: false as const, error: "שם עסק לא תקין" },
      { status: 400 }
    );
  }

  if (!slug || slug.trim().length < 2) {
    console.error("[auth/signup] Invalid slug:", slug);
    return NextResponse.json(
      { ok: false as const, error: "slug לא תקין" },
      { status: 400 }
    );
  }

  try {
    const supabase = getSupabaseAdminClient();
    const businessId = getSupabaseBusinessId();

    console.log("[auth/signup] Business ID:", businessId);

    if (!isUsableBusinessId(businessId)) {
      console.error("[auth/signup] Invalid NEXT_PUBLIC_BUSINESS_ID (nil or malformed)");
      return NextResponse.json(
        { ok: false as const, error: HE_ERR_GENERIC },
        { status: 500 },
      );
    }

    // Check if email already exists (unique on teachers.email — global)
    const { data: existingEmail, error: emailCheckError } = await supabase
      .from("teachers")
      .select("id")
      .eq("email", email.toLowerCase().trim())
      .maybeSingle();

    if (emailCheckError) {
      console.error("[auth/signup] Email check error:", emailCheckError);
    }

    if (existingEmail) {
      console.error("[auth/signup] Email already exists:", email);
      return NextResponse.json(
        { ok: false as const, error: HE_ERR_EMAIL_EXISTS },
        { status: 400 }
      );
    }

    // Check if slug already exists (global check, not per business)
    const { data: existingSlug, error: slugCheckError } = await supabase
      .from("teachers")
      .select("id")
      .eq("slug", slug.trim())
      .maybeSingle();

    if (slugCheckError) {
      console.error("[auth/signup] Slug check error:", slugCheckError);
    }

    if (existingSlug) {
      console.error("[auth/signup] Slug already exists:", slug);
      return NextResponse.json(
        { ok: false as const, error: HE_ERR_SLUG_EXISTS },
        { status: 400 }
      );
    }

    // Hash password
    console.log("[auth/signup] Hashing password...");
    const passwordHash = hashPassword(password);
    console.log("[auth/signup] Password hash length:", passwordHash.length);

    // Determine role: first user in the business = admin, others = user
    const { data: existingTeachers, error: countError } = await supabase
      .from("teachers")
      .select("id")
      .eq("business_id", businessId)
      .limit(1);
    
    const isFirstUser = !existingTeachers || existingTeachers.length === 0;
    const autoRole = role || (isFirstUser ? "admin" : "user");
    
    console.log("[auth/signup] Role determination:", { 
      isFirstUser, 
      providedRole: role, 
      finalRole: autoRole 
    });

    const now = new Date().toISOString();
    const id = randomUUID();

    try {
      await upsertBusinessRecord(supabase, businessId, businessName.trim());
      console.log("[auth/signup] Business record ensured");
    } catch (e) {
      console.error("[auth/signup] businesses upsert failed:", e);
      return NextResponse.json(
        { ok: false as const, error: HE_ERR_GENERIC },
        { status: 500 },
      );
    }

    // Create teacher with auth fields
    console.log("[auth/signup] Creating teacher with id:", id, "role:", autoRole);
    const { error: insertError } = await supabase.from("teachers").insert({
      id,
      business_id: businessId,
      full_name: fullName.trim(),
      business_name: businessName.trim(),
      phone: phone?.trim() || "",
      slug: slug.trim(),
      business_type: businessType || "driving_instructor",
      email: email.toLowerCase().trim(),
      password_hash: passwordHash,
      role: autoRole,
      is_active: true,
      created_at: now,
    });

    if (insertError) {
      console.error("[auth/signup] Teacher creation error:", insertError);
      return NextResponse.json(
        { ok: false as const, error: HE_ERR_GENERIC },
        { status: 500 }
      );
    }

    console.log("[auth/signup] Teacher created, initializing settings...");

    try {
      await persistAppSettings(supabase, businessId, id, {
        ...DEFAULT_APP_SETTINGS,
        businessName: businessName.trim(),
        teacherName: fullName.trim(),
        businessPhone: phone?.trim() || "",
        activePreset: (businessType as BusinessType) || "driving_instructor",
      });

      const bookingDefaults = buildDefaultBookingSettingsForNewTeacher(id);
      await persistBookingSettings(supabase, businessId, id, bookingDefaults);

      console.log("[auth/signup] Initial settings created");
    } catch (settingsError) {
      console.error("[auth/signup] Failed to create settings — rolling back teacher:", settingsError);
      await supabase.from("teachers").delete().eq("id", id);
      return NextResponse.json(
        {
          ok: false as const,
          error:
            "החשבון נוצר חלקית. נסה שוב או פנה לתמיכה (הגדרות הזמנה לא נשמרו).",
        },
        { status: 500 },
      );
    }

    console.log("[auth/signup] SUCCESS - Teacher created:", { id, email, slug, role: autoRole });

    return NextResponse.json({
      ok: true as const,
      teacher: {
        id,
        email: email.toLowerCase().trim(),
        fullName: fullName.trim(),
        businessName: businessName.trim(),
        slug: slug.trim(),
        role: autoRole,
      },
    });
  } catch (e) {
    console.error("[auth/signup] Unexpected error:", e);
    return NextResponse.json(
      { ok: false as const, error: HE_ERR_GENERIC },
      { status: 500 }
    );
  }
}
