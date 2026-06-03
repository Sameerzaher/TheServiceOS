import { NextResponse } from "next/server";

import { getSupabaseBusinessId } from "@/core/config/supabaseEnv";
import { isMissingRelationError } from "@/core/repositories/supabase/postgrestErrors";
import { resolveTeacherScopeFromSession } from "@/lib/api/resolveTeacherId";
import {
  getSupabaseAdminClient,
  isSupabaseAdminConfigured,
} from "@/lib/supabase/adminClient";
import { validateSession } from "@/lib/auth/session";

const HE_ERR_DB_NOT_READY =
  "טבלת תאריכים חסומים לא קיימת במסד. הריצו ב-Supabase את הקובץ supabase/CREATE-BLOCKED-DATES-TABLE.sql.";

export const runtime = "nodejs";

/**
 * DELETE /api/blocked-dates/[id]
 * Delete a blocked date
 */
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  console.log("[blocked-dates/delete] Deleting blocked date...");

  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      { ok: false, error: "שירות אינו זמין" },
      { status: 503 }
    );
  }

  const id = params.id?.trim();
  if (!id) {
    return NextResponse.json(
      { ok: false, error: "מזהה חסר" },
      { status: 400 }
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

    const { error } = await supabase
      .from("blocked_dates")
      .delete()
      .eq("id", id)
      .eq("business_id", businessId)
      .eq("teacher_id", teacherId);

    if (error) {
      console.error("[blocked-dates/delete] Error:", error);
      if (isMissingRelationError(error)) {
        return NextResponse.json(
          { ok: false, error: HE_ERR_DB_NOT_READY },
          { status: 503 }
        );
      }
      return NextResponse.json(
        { ok: false, error: "שגיאה במחיקת חסימה" },
        { status: 500 }
      );
    }

    console.log("[blocked-dates/delete] SUCCESS");
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[blocked-dates/delete] Unexpected error:", e);
    return NextResponse.json(
      { ok: false, error: "שגיאה בלתי צפויה" },
      { status: 500 }
    );
  }
}
