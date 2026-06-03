import "server-only";

import { cookies } from "next/headers";
import { getSupabaseAdminClient } from "@/lib/supabase/adminClient";

interface SessionValidationResult {
  ok: boolean;
  teacherId?: string;
  businessId?: string;
  role?: string;
  error?: string;
}

export async function validateSession(req: Request): Promise<SessionValidationResult> {
  try {
    const sessionToken = cookies().get("session_token")?.value;

    if (!sessionToken) {
      return { ok: false, error: "No session token" };
    }

    const supabase = getSupabaseAdminClient();

    // Get session
    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .select("*")
      .eq("token", sessionToken)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (sessionError || !session) {
      return { ok: false, error: "Invalid session" };
    }

    // Get teacher
    const { data: teacher, error: teacherError } = await supabase
      .from("teachers")
      .select("id, business_id, role, is_active")
      .eq("id", session.teacher_id)
      .eq("is_active", true)
      .maybeSingle();

    if (teacherError || !teacher) {
      return { ok: false, error: "Teacher not found" };
    }

    return {
      ok: true,
      teacherId: teacher.id,
      businessId: teacher.business_id,
      role: teacher.role,
    };
  } catch (e) {
    console.error("[validateSession] Error:", e);
    return { ok: false, error: String(e) };
  }
}
