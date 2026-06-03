import { NextResponse } from "next/server";

import { getSupabaseBusinessId } from "@/core/config/supabaseEnv";
import { coerceBusinessType, type BusinessType } from "@/core/types/teacher";
import {
  getSupabaseAdminClient,
  isSupabaseAdminConfigured,
} from "@/lib/supabase/adminClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HE_ERR_UNAVAILABLE = "הפעולה אינה זמינה כרגע.";
const HE_ERR_GENERIC = "אירעה תקלה. נסו שוב.";
const HE_ERR_INVALID = "נתונים לא תקינים.";
const HE_ERR_NOT_FOUND = "המורה לא נמצא.";
const HE_ERR_SLUG_EXISTS = "ה-slug כבר קיים במערכת.";
const HE_ERR_SLUG_INVALID = "הכתובת לדף ההזמנה לא תקינה — אותיות באנגלית, מספרים ומקף בלבד.";

type UpdateTeacherBody = {
  fullName?: string;
  businessName?: string;
  phone?: string;
  businessType?: BusinessType;
  /** Public booking path segment; Latin slug, unique globally. */
  slug?: string;
};

function normalizeBookingSlug(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function parseUpdateBody(raw: unknown): UpdateTeacherBody | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  
  const result: UpdateTeacherBody = {};
  
  if ("fullName" in o && typeof o.fullName === "string") {
    result.fullName = o.fullName.trim();
  }
  if ("businessName" in o && typeof o.businessName === "string") {
    result.businessName = o.businessName.trim();
  }
  if ("phone" in o && typeof o.phone === "string") {
    result.phone = o.phone.trim();
  }
  if ("businessType" in o) {
    result.businessType = coerceBusinessType(o.businessType);
  }
  if ("slug" in o && typeof o.slug === "string") {
    result.slug = o.slug.trim();
  }
  
  return result;
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  if (!isSupabaseAdminConfigured()) {
    console.error("[teachers/put] Supabase not configured");
    return NextResponse.json({ ok: false as const, error: HE_ERR_UNAVAILABLE }, { status: 503 });
  }

  const teacherId = params.id;
  if (!teacherId) {
    return NextResponse.json({ ok: false as const, error: HE_ERR_INVALID }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdminClient();

    const { cookies } = await import("next/headers");
    const sessionToken = cookies().get("session_token")?.value;
    
    if (!sessionToken) {
      console.error("[teachers/put] No session token - unauthorized");
      return NextResponse.json(
        { ok: false as const, error: "נדרשת התחברות" },
        { status: 401 }
      );
    }
    
    // Validate session and get teacher
    const { data: session } = await supabase
      .from("sessions")
      .select("teacher_id")
      .eq("token", sessionToken)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();
    
    if (!session) {
      console.error("[teachers/put] Invalid or expired session");
      return NextResponse.json(
        { ok: false as const, error: "נדרשת התחברות" },
        { status: 401 }
      );
    }
    
    const { data: currentTeacher } = await supabase
      .from("teachers")
      .select("id, role, email, business_id")
      .eq("id", session.teacher_id)
      .eq("is_active", true)
      .maybeSingle();
    
    if (!currentTeacher) {
      console.error("[teachers/put] Teacher not found for session");
      return NextResponse.json(
        { ok: false as const, error: "נדרשת התחברות" },
        { status: 401 }
      );
    }

    const isSelf = session.teacher_id === teacherId;
    if (!isSelf && currentTeacher.role !== "admin") {
      console.error("[teachers/put] Forbidden — not self and not admin:", currentTeacher.email);
      return NextResponse.json(
        { ok: false as const, error: "אין הרשאה לעדכן פרופיל זה" },
        { status: 403 }
      );
    }

    let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ ok: false as const, error: HE_ERR_INVALID }, { status: 400 });
  }

  const parsed = parseUpdateBody(raw);
  if (!parsed || Object.keys(parsed).length === 0) {
    return NextResponse.json({ ok: false as const, error: HE_ERR_INVALID }, { status: 400 });
  }

    const { data: existing } = await supabase
      .from("teachers")
      .select("id, business_id")
      .eq("id", teacherId)
      .maybeSingle();

    if (!existing) {
      console.error("[teachers/put] Teacher not found:", teacherId);
      return NextResponse.json({ ok: false as const, error: HE_ERR_NOT_FOUND }, { status: 404 });
    }

    if (existing.business_id !== currentTeacher.business_id) {
      console.error("[teachers/put] Target teacher wrong business:", {
        teacherId,
        actorBusiness: currentTeacher.business_id,
        targetBusiness: existing.business_id,
      });
      return NextResponse.json(
        { ok: false as const, error: "אין הרשאה לעדכן פרופיל זה" },
        { status: 403 },
      );
    }

    const updateData: Record<string, unknown> = {};
    if (parsed.fullName !== undefined) updateData.full_name = parsed.fullName;
    if (parsed.businessName !== undefined) updateData.business_name = parsed.businessName;
    if (parsed.phone !== undefined) updateData.phone = parsed.phone;
    if (parsed.businessType !== undefined) updateData.business_type = parsed.businessType;

    if (parsed.slug !== undefined) {
      const normalizedSlug = normalizeBookingSlug(parsed.slug);
      if (normalizedSlug.length < 2 || normalizedSlug.length > 80) {
        return NextResponse.json(
          { ok: false as const, error: HE_ERR_SLUG_INVALID },
          { status: 400 },
        );
      }
      const { data: slugRow } = await supabase
        .from("teachers")
        .select("id")
        .eq("slug", normalizedSlug)
        .neq("id", teacherId)
        .maybeSingle();
      if (slugRow) {
        return NextResponse.json(
          { ok: false as const, error: HE_ERR_SLUG_EXISTS },
          { status: 400 },
        );
      }
      updateData.slug = normalizedSlug;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ ok: false as const, error: HE_ERR_INVALID }, { status: 400 });
    }

    const { error } = await supabase
      .from("teachers")
      .update(updateData)
      .eq("business_id", existing.business_id)
      .eq("id", teacherId);
    
    if (error) {
      console.error("[teachers/put] Database error:", error);
      return NextResponse.json({ ok: false as const, error: HE_ERR_GENERIC }, { status: 500 });
    }
    
    return NextResponse.json({ ok: true as const });
  } catch (e) {
    console.error("[teachers/put] Unexpected error:", e);
    return NextResponse.json({ ok: false as const, error: HE_ERR_GENERIC }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  if (!isSupabaseAdminConfigured()) {
    console.error("[teachers/delete] Supabase not configured");
    return NextResponse.json({ ok: false as const, error: HE_ERR_UNAVAILABLE }, { status: 503 });
  }

  const teacherId = params.id;
  if (!teacherId) {
    return NextResponse.json({ ok: false as const, error: HE_ERR_INVALID }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdminClient();
    const businessId = getSupabaseBusinessId();
    
    // Get current authenticated teacher from session
    const { cookies } = await import("next/headers");
    const sessionToken = cookies().get("session_token")?.value;
    
    if (!sessionToken) {
      console.error("[teachers/delete] No session token - unauthorized");
      return NextResponse.json(
        { ok: false as const, error: "נדרשת התחברות" },
        { status: 401 }
      );
    }
    
    // Validate session and get teacher
    const { data: session } = await supabase
      .from("sessions")
      .select("teacher_id")
      .eq("token", sessionToken)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();
    
    if (!session) {
      console.error("[teachers/delete] Invalid or expired session");
      return NextResponse.json(
        { ok: false as const, error: "נדרשת התחברות" },
        { status: 401 }
      );
    }
    
    // Get the authenticated teacher's role
    const { data: currentTeacher } = await supabase
      .from("teachers")
      .select("id, role, email")
      .eq("id", session.teacher_id)
      .eq("is_active", true)
      .maybeSingle();
    
    if (!currentTeacher) {
      console.error("[teachers/delete] Teacher not found for session");
      return NextResponse.json(
        { ok: false as const, error: "נדרשת התחברות" },
        { status: 401 }
      );
    }
    
    // Only admin can delete teachers
    if (currentTeacher.role !== "admin") {
      console.error("[teachers/delete] Non-admin attempted to delete teacher:", currentTeacher.email);
      return NextResponse.json(
        { ok: false as const, error: "רק מנהל יכול למחוק מורים" },
        { status: 403 }
      );
    }
    
    // Check if teacher exists
    const { data: existing } = await supabase
      .from("teachers")
      .select("id")
      .eq("business_id", businessId)
      .eq("id", teacherId)
      .maybeSingle();
    
    if (!existing) {
      console.error("[teachers/delete] Teacher not found:", teacherId);
      return NextResponse.json({ ok: false as const, error: HE_ERR_NOT_FOUND }, { status: 404 });
    }
    
    // Delete all related data (cascade)
    await Promise.all([
      supabase.from("clients").delete().eq("business_id", businessId).eq("teacher_id", teacherId),
      supabase.from("appointments").delete().eq("business_id", businessId).eq("teacher_id", teacherId),
      supabase.from("app_settings").delete().eq("business_id", businessId).eq("teacher_id", teacherId),
      supabase.from("booking_settings").delete().eq("business_id", businessId).eq("teacher_id", teacherId),
      supabase.from("sessions").delete().eq("teacher_id", teacherId),
    ]);
    
    // Delete the teacher
    const { error } = await supabase
      .from("teachers")
      .delete()
      .eq("business_id", businessId)
      .eq("id", teacherId);
    
    if (error) {
      console.error("[teachers/delete] Database error:", error);
      return NextResponse.json({ ok: false as const, error: HE_ERR_GENERIC }, { status: 500 });
    }
    
    return NextResponse.json({ ok: true as const });
  } catch (e) {
    console.error("[teachers/delete] Unexpected error:", e);
    return NextResponse.json({ ok: false as const, error: HE_ERR_GENERIC }, { status: 500 });
  }
}
