import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import {
  getSupabaseAdminClient,
  isSupabaseAdminConfigured,
} from "@/lib/supabase/adminClient";
import type { AuthTeacher, Teacher } from "@/core/types/teacher";

export const runtime = "nodejs";

export async function GET(): Promise<NextResponse> {
  console.log("[auth/me] Checking authentication");
  
  if (!isSupabaseAdminConfigured()) {
    console.error("[auth/me] Supabase admin not configured");
    return NextResponse.json(
      { ok: false as const, error: "Service unavailable" },
      { status: 503 }
    );
  }

  try {
    const sessionToken = cookies().get("session_token")?.value;

    if (!sessionToken) {
      console.log("[auth/me] No session token found");
      return NextResponse.json(
        { ok: false as const, error: "Not authenticated" },
        { status: 401 }
      );
    }

    console.log("[auth/me] Session token found, validating...");
    const supabase = getSupabaseAdminClient();

    // Get session
    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .select("*")
      .eq("token", sessionToken)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (sessionError) {
      console.error("[auth/me] Session query error:", sessionError);
    }

    if (!session) {
      console.log("[auth/me] Session not found or expired");
      cookies().delete("session_token");
      return NextResponse.json(
        { ok: false as const, error: "Session expired" },
        { status: 401 }
      );
    }

    console.log("[auth/me] Session valid, fetching teacher:", session.teacher_id);

    // Get teacher
    const { data: teacher, error: teacherError } = await supabase
      .from("teachers")
      .select("*")
      .eq("id", session.teacher_id)
      .eq("is_active", true)
      .maybeSingle();

    if (teacherError) {
      console.error("[auth/me] Teacher query error:", teacherError);
    }

    if (!teacher) {
      console.error("[auth/me] Teacher not found or inactive:", session.teacher_id);
      cookies().delete("session_token");
      return NextResponse.json(
        { ok: false as const, error: "Teacher not found" },
        { status: 401 }
      );
    }

    console.log("[auth/me] Teacher found:", { id: teacher.id, email: teacher.email, role: teacher.role });

    const mappedTeacher: Teacher = {
      id: teacher.id,
      fullName: teacher.full_name,
      businessName: teacher.business_name,
      phone: teacher.phone || "",
      slug: teacher.slug,
      businessType: teacher.business_type || "driving_instructor",
      createdAt: teacher.created_at,
      email: teacher.email,
      role: teacher.role || "user",
      isActive: teacher.is_active !== false,
      lastLoginAt: teacher.last_login_at,
    };

    const authTeacher: AuthTeacher = {
      teacher: mappedTeacher,
      token: sessionToken,
    };

    console.log("[auth/me] SUCCESS - Auth check passed");

    return NextResponse.json({ ok: true as const, data: authTeacher });
  } catch (e) {
    console.error("[auth/me] Unexpected error:", e);
    return NextResponse.json(
      { ok: false as const, error: "Server error" },
      { status: 500 }
    );
  }
}
