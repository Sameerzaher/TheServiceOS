import { NextResponse } from "next/server";

import { getSupabaseBusinessId } from "@/core/config/supabaseEnv";
import { isMissingRelationError } from "@/core/repositories/supabase/postgrestErrors";
import {
  resolveTeacherScopeFromSession,
} from "@/lib/api/resolveTeacherId";
import {
  getSupabaseAdminClient,
  isSupabaseAdminConfigured,
} from "@/lib/supabase/adminClient";
import { validateSession } from "@/lib/auth/session";

const HE_ERR_DB_NOT_READY =
  "טבלת תאריכים חסומים לא קיימת במסד. הריצו ב-Supabase את הקובץ supabase/CREATE-BLOCKED-DATES-TABLE.sql (או צרו טבלת blocked_dates).";

export const runtime = "nodejs";

/**
 * GET /api/blocked-dates
 * Fetch all blocked dates for current teacher
 */
export async function GET(req: Request): Promise<NextResponse> {
  console.log("[blocked-dates/get] Fetching blocked dates...");

  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      { ok: false, error: "שירות אינו זמין" },
      { status: 503 }
    );
  }

  try {
    const supabase = getSupabaseAdminClient();

    const sessionValidation = await validateSession(req);
    if (!sessionValidation.ok) {
      return NextResponse.json(
        { ok: false, error: "לא מאומת" },
        { status: 401 }
      );
    }

    const businessId =
      sessionValidation.businessId?.trim() || getSupabaseBusinessId();
    const teacherId = resolveTeacherScopeFromSession(
      req,
      sessionValidation.teacherId!,
      sessionValidation.role,
    );

    const { data, error } = await supabase
      .from("blocked_dates")
      .select("*")
      .eq("business_id", businessId)
      .eq("teacher_id", teacherId)
      .order("blocked_date", { ascending: true });

    if (error) {
      console.error("[blocked-dates/get] Error:", error);
      if (isMissingRelationError(error)) {
        return NextResponse.json(
          { ok: false, error: HE_ERR_DB_NOT_READY },
          { status: 503 }
        );
      }
      return NextResponse.json(
        { ok: false, error: "שגיאה בטעינת תאריכים חסומים" },
        { status: 500 }
      );
    }

    console.log(`[blocked-dates/get] SUCCESS - Returned ${data?.length || 0} blocked dates`);

    return NextResponse.json({
      ok: true,
      blockedDates: data?.map((row) => ({
        id: row.id,
        date: row.blocked_date,
        reason: row.reason || "",
        isRecurring: row.is_recurring || false,
      })) || [],
    });
  } catch (e) {
    console.error("[blocked-dates/get] Unexpected error:", e);
    return NextResponse.json(
      { ok: false, error: "שגיאה בלתי צפויה" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/blocked-dates
 * Create a new blocked date
 */
export async function POST(req: Request): Promise<NextResponse> {
  console.log("[blocked-dates/post] Creating blocked date...");

  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      { ok: false, error: "שירות אינו זמין" },
      { status: 503 }
    );
  }

  try {
    const supabase = getSupabaseAdminClient();

    const sessionValidation = await validateSession(req);
    if (!sessionValidation.ok) {
      return NextResponse.json(
        { ok: false, error: "לא מאומת" },
        { status: 401 }
      );
    }

    const businessId =
      sessionValidation.businessId?.trim() || getSupabaseBusinessId();
    const teacherId = resolveTeacherScopeFromSession(
      req,
      sessionValidation.teacherId!,
      sessionValidation.role,
    );

    const body = await req.json();
    const { date, reason, isRecurring } = body;

    if (!date) {
      return NextResponse.json(
        { ok: false, error: "תאריך חסר" },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("blocked_dates")
      .insert({
        business_id: businessId,
        teacher_id: teacherId,
        blocked_date: date,
        reason: reason || null,
        is_recurring: isRecurring || false,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) {
      console.error("[blocked-dates/post] Error:", error);
      if (isMissingRelationError(error)) {
        return NextResponse.json(
          { ok: false, error: HE_ERR_DB_NOT_READY },
          { status: 503 }
        );
      }
      if (error.code === "23505") {
        return NextResponse.json(
          { ok: false, error: "תאריך זה כבר חסום" },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { ok: false, error: "שגיאה ביצירת חסימה" },
        { status: 500 }
      );
    }

    console.log("[blocked-dates/post] SUCCESS - Created blocked date:", data.id);

    return NextResponse.json({
      ok: true,
      blockedDate: {
        id: data.id,
        date: data.blocked_date,
        reason: data.reason || "",
        isRecurring: data.is_recurring || false,
      },
    });
  } catch (e) {
    console.error("[blocked-dates/post] Unexpected error:", e);
    return NextResponse.json(
      { ok: false, error: "שגיאה בלתי צפויה" },
      { status: 500 }
    );
  }
}
