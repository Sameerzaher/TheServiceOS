import { NextResponse } from "next/server";

import { getSupabaseBusinessId } from "@/core/config/supabaseEnv";
import { isUsableBusinessId } from "@/core/constants/uuids";
import { coerceBusinessType, type BusinessType } from "@/core/types/teacher";
import {
  getSupabaseAdminClient,
  isSupabaseAdminConfigured,
} from "@/lib/supabase/adminClient";
import { createTeacherWithBusiness } from "@/core/services/teacherProvisioning";
import { runTeacherDataRepair } from "@/core/services/teacherDataRepair";

export const runtime = "nodejs";

/** Teacher list uses headers/env; must not be statically prerendered. */
export const dynamic = "force-dynamic";

const HE_ERR_UNAVAILABLE = "רשימת המורים אינה זמינה כרגע.";
const HE_ERR_GENERIC = "אירעה תקלה בטעינת המורים.";
const HE_ERR_INVALID = "נתונים לא תקינים.";

export type TeacherListItem = {
  id: string;
  fullName: string;
  businessName: string;
  slug: string;
  businessType: BusinessType;
  email?: string;
  role?: string;
  isActive?: boolean;
  hasPassword?: boolean;
};

export async function GET(req: Request): Promise<NextResponse> {
  if (!isSupabaseAdminConfigured()) {
    console.error("[teachers/get] Supabase not configured");
    return NextResponse.json({ ok: false as const, error: HE_ERR_UNAVAILABLE }, { status: 503 });
  }

  try {
    const supabase = getSupabaseAdminClient();
    const envBusinessId = getSupabaseBusinessId();

    // Get current authenticated teacher from session
    const { cookies } = await import("next/headers");
    const sessionToken = cookies().get("session_token")?.value;
    
    if (!sessionToken) {
      console.error("[teachers/get] No session token - unauthorized");
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
      console.error("[teachers/get] Invalid or expired session");
      return NextResponse.json(
        { ok: false as const, error: "נדרשת התחברות" },
        { status: 401 }
      );
    }
    
    const { data: currentTeacher } = await supabase
      .from("teachers")
      .select("id, role, email, business_id, business_name")
      .eq("id", session.teacher_id)
      .eq("is_active", true)
      .maybeSingle();

    if (!currentTeacher) {
      console.error("[teachers/get] Teacher not found for session");
      return NextResponse.json(
        { ok: false as const, error: "נדרשת התחברות" },
        { status: 401 }
      );
    }

    const scopeBusinessId = isUsableBusinessId(currentTeacher.business_id)
      ? currentTeacher.business_id
      : envBusinessId;

    // Only admin can see all teachers
    if (currentTeacher.role !== "admin") {
      // Regular users see only themselves (load by id — avoids env/business mismatch)
      const { data: selfData, error: selfError } = await supabase
        .from("teachers")
        .select("*")
        .eq("id", currentTeacher.id)
        .single();
      
      if (selfError || !selfData) {
        console.error("[teachers/get] Failed to load self:", selfError);
        return NextResponse.json({ ok: false as const, error: HE_ERR_GENERIC }, { status: 500 });
      }
      
      const r = selfData as {
        id: string;
        full_name?: string;
        business_name?: string;
        slug?: string;
        business_type?: string | null;
        email?: string;
        role?: string;
        is_active?: boolean;
        password_hash?: string | null;
      };
      
      const teachers: TeacherListItem[] = [{
        id: r.id,
        fullName: typeof r.full_name === "string" ? r.full_name : "",
        businessName: typeof r.business_name === "string" ? r.business_name : "",
        slug: typeof r.slug === "string" ? r.slug : "",
        businessType: coerceBusinessType(r.business_type),
        email: r.email,
        role: r.role,
        isActive: r.is_active,
        hasPassword: r.password_hash != null && r.password_hash.length > 0,
      }];
      
      return NextResponse.json({ ok: true as const, teachers });
    }
    
    // Admin can see all teachers in same business
    const { data, error } = await supabase
      .from("teachers")
      .select("*")
      .eq("business_id", scopeBusinessId)
      .order("full_name", { ascending: true });

    if (error) {
      console.error("[teachers/get] Database error:", error);
      return NextResponse.json({ ok: false as const, error: HE_ERR_GENERIC }, { status: 500 });
    }

    const teachers: TeacherListItem[] = [];
    for (const row of data ?? []) {
      const r = row as {
        id?: string;
        full_name?: string;
        business_name?: string;
        slug?: string;
        business_type?: string | null;
        email?: string;
        role?: string;
        is_active?: boolean;
        password_hash?: string | null;
      };
      if (!r.id) continue;
      teachers.push({
        id: r.id,
        fullName: typeof r.full_name === "string" ? r.full_name : "",
        businessName: typeof r.business_name === "string" ? r.business_name : "",
        slug: typeof r.slug === "string" ? r.slug : "",
        businessType: coerceBusinessType(r.business_type),
        email: r.email,
        role: r.role,
        isActive: r.is_active,
        hasPassword: r.password_hash != null && r.password_hash.length > 0,
      });
    }

    return NextResponse.json({ ok: true as const, teachers });
  } catch (e) {
    console.error("[teachers/get] Unexpected error:", e);
    return NextResponse.json({ ok: false as const, error: HE_ERR_GENERIC }, { status: 500 });
  }
}

export async function POST(req: Request): Promise<NextResponse> {
  if (!isSupabaseAdminConfigured()) {
    console.error("[teachers/post] Supabase not configured");
    return NextResponse.json({ ok: false as const, error: HE_ERR_UNAVAILABLE }, { status: 503 });
  }

  try {
    const supabase = getSupabaseAdminClient();
    const envBusinessId = getSupabaseBusinessId();

    const { cookies } = await import("next/headers");
    const sessionToken = cookies().get("session_token")?.value;

    if (!sessionToken) {
      console.error("[teachers/post] No session token - unauthorized");
      return NextResponse.json(
        { ok: false as const, error: "נדרשת התחברות" },
        { status: 401 },
      );
    }

    const { data: session } = await supabase
      .from("sessions")
      .select("teacher_id")
      .eq("token", sessionToken)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (!session) {
      console.error("[teachers/post] Invalid or expired session");
      return NextResponse.json(
        { ok: false as const, error: "נדרשת התחברות" },
        { status: 401 },
      );
    }

    const { data: currentTeacher } = await supabase
      .from("teachers")
      .select("id, role, email, business_id, business_name")
      .eq("id", session.teacher_id)
      .eq("is_active", true)
      .maybeSingle();

    if (!currentTeacher) {
      console.error("[teachers/post] Teacher not found for session");
      return NextResponse.json(
        { ok: false as const, error: "נדרשת התחברות" },
        { status: 401 },
      );
    }

    if (currentTeacher.role !== "admin") {
      console.error("[teachers/post] Non-admin attempted to create teacher:", currentTeacher.email);
      return NextResponse.json(
        { ok: false as const, error: "רק מנהל יכול ליצור מורים חדשים" },
        { status: 403 },
      );
    }

    let scopeBusinessId = isUsableBusinessId(currentTeacher.business_id)
      ? currentTeacher.business_id
      : envBusinessId;

    // Auto-repair invalid business_id if detected
    if (!isUsableBusinessId(scopeBusinessId)) {
      console.log("[teachers/post] Invalid business scope detected - attempting auto-repair");
      
      try {
        const repairReport = await runTeacherDataRepair(supabase, { dryRun: false });
        
        if (repairReport.errors.length > 0) {
          console.error("[teachers/post] Auto-repair completed with errors:", repairReport.errors);
          
          // Check if the error is about missing businesses table
          const missingTableError = repairReport.errors.find(err => 
            err.includes('businesses') && (err.includes('לא קיימת') || err.includes('does not exist'))
          );
          
          if (missingTableError) {
            return NextResponse.json(
              {
                ok: false as const,
                error: "טבלת businesses לא קיימת במסד הנתונים. יש להריץ את המיגרציה 012_businesses.sql. פנה לתמיכה.",
              },
              { status: 500 },
            );
          }
        }
        
        if (repairReport.teachersFixedBusinessId > 0 || repairReport.businessesInserted > 0) {
          console.log("[teachers/post] Auto-repair successful, reloading teacher data");
          
          // Reload the teacher's business_id after repair
          const { data: reloadedTeacher } = await supabase
            .from("teachers")
            .select("business_id")
            .eq("id", currentTeacher.id)
            .single();
          
          if (reloadedTeacher && isUsableBusinessId(reloadedTeacher.business_id)) {
            scopeBusinessId = reloadedTeacher.business_id;
          }
        }
      } catch (repairError) {
        console.error("[teachers/post] Auto-repair failed:", repairError);
      }
      
      // If still invalid after repair attempt, return error
      if (!isUsableBusinessId(scopeBusinessId)) {
        console.error("[teachers/post] Business scope still invalid after repair attempt");
        return NextResponse.json(
          {
            ok: false as const,
            error:
              "מזהה עסק לא תקין. נסה שוב או פנה לתמיכה.",
          },
          { status: 400 },
        );
      }
    }

    const organizationLabel =
      typeof currentTeacher.business_name === "string" && currentTeacher.business_name.trim()
        ? currentTeacher.business_name.trim()
        : "Business";

    const body = await req.json();
    const { fullName, businessName, phone, slug, businessType, email, password, role } = body;

    if (!fullName || !businessName || !slug || !email || !password) {
      console.error("[teachers/post] Missing required fields");
      return NextResponse.json({ ok: false as const, error: HE_ERR_INVALID }, { status: 400 });
    }

    const result = await createTeacherWithBusiness(
      supabase,
      scopeBusinessId,
      organizationLabel,
      {
        fullName: String(fullName),
        businessName: String(businessName),
        phone: phone != null ? String(phone) : "",
        slug: String(slug),
        businessType: coerceBusinessType(businessType),
        email: String(email),
        password: String(password),
        role: role === "admin" ? "admin" : "user",
      },
    );

    if (!result.ok) {
      const status =
        result.code === "INVALID_INPUT" ||
        result.code === "INVALID_BUSINESS_SCOPE" ||
        result.code === "SLUG_TAKEN" ||
        result.code === "EMAIL_TAKEN"
          ? 400
          : 500;
      console.error("[teachers/post] Provision failed", result.code, result.details);
      return NextResponse.json(
        { ok: false as const, error: result.error, code: result.code },
        { status },
      );
    }

    return NextResponse.json({
      ok: true as const,
      teacher: {
        id: result.teacherId,
        email: String(email).trim().toLowerCase(),
        slug: String(slug).trim(),
        role: role === "admin" ? "admin" : "user",
      },
    });
  } catch (e) {
    console.error("[teachers/post] Unexpected error:", e);
    return NextResponse.json({ ok: false as const, error: HE_ERR_GENERIC }, { status: 500 });
  }
}
