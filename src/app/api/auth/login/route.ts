import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import type { PostgrestError } from "@supabase/supabase-js";

import {
  DEFAULT_MVP_BUSINESS_ID,
  getSupabaseBusinessId,
} from "@/core/config/supabaseEnv";
import { upsertBusinessRecord } from "@/core/repositories/supabase/businessRepository";
import {
  getSupabaseAdminClient,
  isSupabaseAdminConfigured,
} from "@/lib/supabase/adminClient";
import { verifyPassword, generateSessionToken } from "@/lib/auth/passwordUtils";
import {
  coerceBusinessType,
  type AuthTeacher,
  type Teacher,
  type UserRole,
} from "@/core/types/teacher";

export const runtime = "nodejs";

const HE_ERR_UNAVAILABLE = "שירות ההתחברות אינו זמין כרגע.";
const HE_ERR_INVALID_CREDENTIALS = "אימייל או סיסמה שגויים.";
const HE_ERR_USER_INACTIVE = "החשבון שלך אינו פעיל. צור קשר עם התמיכה.";
const HE_ERR_GENERIC = "אירעה שגיאה. נסה שוב.";

/**
 * Extra field for failed login JSON (dev / AUTH_LOGIN_DEBUG=1):
 * `no_teacher_row` | `teacher_wrong_business` | `password_hash_missing` | `password_incorrect`.
 */
function devLoginPayload<T extends Record<string, unknown>>(payload: T, code: string): T {
  const allow =
    process.env.NODE_ENV !== "production" ||
    process.env.AUTH_LOGIN_DEBUG === "1";
  if (!allow) return payload;
  return { ...payload, _debug: code };
}

/** ILIKE treats `_` and `%` as wildcards; skip ilike when present to avoid wrong matches. */
function emailIsSafeForIlikeExact(s: string): boolean {
  return !/[%_]/.test(s);
}

type TeacherRow = Record<string, unknown>;

function normalizeUuid(v: string): string {
  return v.trim().toLowerCase();
}

function coerceUuidString(raw: unknown): string {
  if (raw == null) return "";
  if (typeof raw === "string") return raw.trim();
  return String(raw).trim();
}

/**
 * Realign teacher.business_id to env on login when rows are "orphaned" to another UUID.
 * - Production: only MVP default business id from env, or AUTH_LOGIN_REPAIR_BUSINESS_ID=1.
 * - Development (next dev): enabled unless AUTH_LOGIN_REPAIR_BUSINESS_ID=0.
 */
function allowRepairTeacherBusinessIdToEnv(envBusinessId: string): boolean {
  if (process.env.AUTH_LOGIN_REPAIR_BUSINESS_ID === "1") return true;
  if (process.env.AUTH_LOGIN_REPAIR_BUSINESS_ID === "0") {
    return (
      normalizeUuid(envBusinessId) ===
      normalizeUuid(DEFAULT_MVP_BUSINESS_ID)
    );
  }
  if (process.env.NODE_ENV !== "production") return true;
  return (
    normalizeUuid(envBusinessId) ===
    normalizeUuid(DEFAULT_MVP_BUSINESS_ID)
  );
}

async function findGlobalTeacherByEmail(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  emailNorm: string,
  emailTrim: string,
): Promise<TeacherRow | null> {
  const { data: byNorm } = await supabase
    .from("teachers")
    .select("*")
    .eq("email", emailNorm)
    .maybeSingle();
  if (byNorm) return byNorm as TeacherRow;
  if (!emailIsSafeForIlikeExact(emailTrim)) return null;
  const { data: byIlike } = await supabase
    .from("teachers")
    .select("*")
    .ilike("email", emailTrim)
    .limit(1);
  return (byIlike?.[0] as TeacherRow | undefined) ?? null;
}

/**
 * When a teacher row exists but `business_id` ≠ env (common after seeds / manual DB edits),
 * realign to the deployment business if allowed. Ensures `public.businesses` has a row.
 */
async function tryRepairTeacherBusinessForLogin(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  envBusinessId: string,
  emailNorm: string,
  emailTrim: string,
): Promise<boolean> {
  const globalRow = await findGlobalTeacherByEmail(supabase, emailNorm, emailTrim);
  if (!globalRow) {
    console.error("[auth/login] Repair skipped: no global teacher row for email");
    return false;
  }

  const rowId = coerceUuidString(globalRow.id);
  const currentBiz = coerceUuidString(globalRow.business_id);
  if (!rowId || !currentBiz) {
    console.error("[auth/login] Repair skipped: teacher row missing id or business_id", {
      rowId,
      currentBiz,
    });
    return false;
  }

  if (normalizeUuid(currentBiz) === normalizeUuid(envBusinessId)) {
    return false;
  }

  if (!allowRepairTeacherBusinessIdToEnv(envBusinessId)) {
    console.error("[auth/login] Teacher business_id mismatch; set AUTH_LOGIN_REPAIR_BUSINESS_ID=1 to allow login repair.", {
      teacherId: rowId,
      rowBusinessId: currentBiz,
      envBusinessId,
    });
    return false;
  }

  console.warn("[auth/login] Attempting teacher.business_id repair for login:", {
    teacherId: rowId,
    from: currentBiz,
    to: envBusinessId,
  });

  const displayName =
    typeof globalRow.business_name === "string" && globalRow.business_name.trim()
      ? globalRow.business_name.trim()
      : "Business";

  try {
    await upsertBusinessRecord(supabase, envBusinessId, displayName);
  } catch (e) {
    console.error("[auth/login] Repair: businesses upsert failed:", e);
    return false;
  }

  const { error: updErr } = await supabase
    .from("teachers")
    .update({ business_id: envBusinessId })
    .eq("id", rowId);

  if (updErr) {
    console.error("[auth/login] Repair: teacher business_id update failed:", updErr);
    return false;
  }

  console.warn("[auth/login] Repaired teacher.business_id to match env:", {
    teacherId: rowId,
    from: currentBiz,
    to: envBusinessId,
  });
  return true;
}

async function findTeacherForLogin(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  businessId: string,
  rawEmail: string,
): Promise<{ rows: TeacherRow[] | null; error: PostgrestError | null }> {
  const emailNorm = rawEmail.toLowerCase().trim();
  const emailTrim = rawEmail.trim();

  const q1 = await supabase
    .from("teachers")
    .select("*")
    .eq("business_id", businessId)
    .eq("email", emailNorm)
    .limit(1);
  if (q1.error) return { rows: null, error: q1.error };
  if (q1.data?.length) return { rows: q1.data as TeacherRow[], error: null };

  if (emailTrim !== emailNorm) {
    const r2 = await supabase
      .from("teachers")
      .select("*")
      .eq("business_id", businessId)
      .eq("email", emailTrim)
      .limit(1);
    if (r2.error) return { rows: null, error: r2.error };
    if (r2.data?.length) return { rows: r2.data as TeacherRow[], error: null };
  }

  if (emailIsSafeForIlikeExact(emailTrim)) {
    const r3 = await supabase
      .from("teachers")
      .select("*")
      .eq("business_id", businessId)
      .ilike("email", emailTrim)
      .limit(1);
    if (r3.error) return { rows: null, error: r3.error };
    if (r3.data?.length) return { rows: r3.data as TeacherRow[], error: null };
  }

  return { rows: [], error: null };
}

type TeacherLookupFailureDebug = "no_teacher_row" | "teacher_wrong_business";

async function resolveTeacherLookupFailureDebug(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  businessId: string,
  emailNorm: string,
  emailTrim: string,
): Promise<TeacherLookupFailureDebug> {
  const { data: byNorm } = await supabase
    .from("teachers")
    .select("id,business_id,email")
    .eq("email", emailNorm)
    .maybeSingle();

  if (byNorm) {
    if (byNorm.business_id !== businessId) {
      console.error("[auth/login] Teacher exists for this email but business_id mismatch:", {
        email: emailNorm,
        teacherId: byNorm.id,
        rowBusinessId: byNorm.business_id,
        envBusinessId: businessId,
      });
      return "teacher_wrong_business";
    }
    console.error("[auth/login] Unexpected: teacher matches business but scoped lookup failed:", {
      email: emailNorm,
      teacherId: byNorm.id,
    });
    return "no_teacher_row";
  }

  if (emailIsSafeForIlikeExact(emailTrim)) {
    const { data: byIlike } = await supabase
      .from("teachers")
      .select("id,business_id,email")
      .ilike("email", emailTrim)
      .limit(2);
    const hit = byIlike?.[0];
    if (hit) {
      if (hit.business_id !== businessId) {
        console.error("[auth/login] Teacher exists (email case variant) but business_id mismatch:", {
          emailStored: hit.email,
          teacherId: hit.id,
          rowBusinessId: hit.business_id,
          envBusinessId: businessId,
        });
        return "teacher_wrong_business";
      }
    }
  }

  console.error(
    "[auth/login] No public.teachers row for this email. Use /signup or insert into public.teachers with password_hash and business_id:",
    businessId,
  );
  return "no_teacher_row";
}

export async function POST(req: Request): Promise<NextResponse> {
  if (!isSupabaseAdminConfigured()) {
    console.error("[auth/login] Supabase admin not configured");
    return NextResponse.json(
      { ok: false as const, error: HE_ERR_UNAVAILABLE },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch (e) {
    console.error("[auth/login] Invalid JSON:", e);
    return NextResponse.json(
      { ok: false as const, error: "נתונים לא תקינים" },
      { status: 400 }
    );
  }

  const { email, password } = body as Record<string, unknown>;

  if (typeof email !== "string" || typeof password !== "string") {
    console.error("[auth/login] Invalid input types");
    return NextResponse.json(
      { ok: false as const, error: "נתונים לא תקינים" },
      { status: 400 }
    );
  }

  try {
    const supabase = getSupabaseAdminClient();
    const businessId = getSupabaseBusinessId();

    const emailNorm = email.toLowerCase().trim();
    const emailTrim = email.trim();
    let { rows: teachers, error: teacherError } = await findTeacherForLogin(
      supabase,
      businessId,
      email,
    );

    if (teacherError) {
      console.error("[auth/login] Database query error:", teacherError);
      return NextResponse.json(
        { ok: false as const, error: HE_ERR_GENERIC },
        { status: 500 }
      );
    }

    if (!teachers || teachers.length === 0) {
      console.error("[auth/login] Teacher not found for login:", emailNorm);
      const repaired = await tryRepairTeacherBusinessForLogin(
        supabase,
        businessId,
        emailNorm,
        emailTrim,
      );
      if (repaired) {
        const retry = await findTeacherForLogin(supabase, businessId, email);
        if (retry.error) {
          console.error("[auth/login] After business_id repair, lookup failed:", retry.error);
          return NextResponse.json(
            { ok: false as const, error: HE_ERR_GENERIC },
            { status: 500 },
          );
        }
        if (retry.rows?.length) {
          teachers = retry.rows;
        }
      }
    }

    if (!teachers || teachers.length === 0) {
      const lookupDebug = await resolveTeacherLookupFailureDebug(
        supabase,
        businessId,
        emailNorm,
        emailTrim,
      );
      return NextResponse.json(
        devLoginPayload(
          { ok: false as const, error: HE_ERR_INVALID_CREDENTIALS },
          lookupDebug,
        ),
        { status: 401 },
      );
    }

    const teacher = teachers[0] as {
      id: string;
      full_name: string;
      business_name: string;
      phone: string | null;
      slug: string;
      business_type: string | null;
      created_at: string;
      email: string;
      role: string | null;
      is_active: boolean | null;
      last_login_at: string | null;
      password_hash: string | null;
    };

    // Check if password is set
    if (!teacher.password_hash) {
      console.error("[auth/login] Teacher has no password hash:", teacher.id);
      return NextResponse.json(
        devLoginPayload(
          {
            ok: false as const,
            error: "יש להגדיר סיסמה למורה זה תחילה.",
          },
          "password_hash_missing",
        ),
        { status: 401 },
      );
    }

    // Verify password
    const isValid = verifyPassword(password, teacher.password_hash);
    if (!isValid) {
      console.error("[auth/login] Password verification failed for:", email);
      return NextResponse.json(
        devLoginPayload(
          { ok: false as const, error: HE_ERR_INVALID_CREDENTIALS },
          "password_incorrect",
        ),
        { status: 401 },
      );
    }

    // Check if teacher is active
    if (!teacher.is_active) {
      console.error("[auth/login] Teacher is inactive:", teacher.id);
      return NextResponse.json(
        { ok: false as const, error: HE_ERR_USER_INACTIVE },
        { status: 403 }
      );
    }

    // Create session
    const token = generateSessionToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

    const { error: sessionError } = await supabase.from("sessions").insert({
      teacher_id: teacher.id,
      token,
      expires_at: expiresAt.toISOString(),
      ip_address: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip"),
      user_agent: req.headers.get("user-agent"),
    });

    if (sessionError) {
      console.error("[auth/login] Session creation error:", sessionError);
    }

    // Update last login
    await supabase
      .from("teachers")
      .update({ last_login_at: new Date().toISOString() })
      .eq("id", teacher.id);

    // Set session cookie
    cookies().set("session_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
    });

    const role: UserRole = teacher.role === "admin" ? "admin" : "user";
    const mappedTeacher: Teacher = {
      id: teacher.id,
      fullName: teacher.full_name,
      businessName: teacher.business_name,
      phone: teacher.phone || "",
      slug: teacher.slug,
      businessType: coerceBusinessType(teacher.business_type),
      createdAt: teacher.created_at,
      email: teacher.email,
      role,
      isActive: true,
      lastLoginAt: teacher.last_login_at,
    };

    const authTeacher: AuthTeacher = {
      teacher: mappedTeacher,
      token,
    };

    return NextResponse.json({ ok: true as const, data: authTeacher });
  } catch (e) {
    console.error("[auth/login] Unexpected error:", e);
    return NextResponse.json(
      { ok: false as const, error: HE_ERR_GENERIC },
      { status: 500 }
    );
  }
}
