import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { getSupabaseAdminClient } from "@/lib/supabase/adminClient";

export const runtime = "nodejs";

export async function POST(): Promise<NextResponse> {
  try {
    const sessionToken = cookies().get("session_token")?.value;

    if (sessionToken) {
      // Delete session from database (teacher_id foreign key)
      const supabase = getSupabaseAdminClient();
      await supabase.from("sessions").delete().eq("token", sessionToken);
    }

    // Clear session cookie
    cookies().delete("session_token");

    return NextResponse.json({ ok: true as const });
  } catch (e) {
    console.error("[auth/logout]", e);
    return NextResponse.json(
      { ok: false as const, error: "אירעה שגיאה" },
      { status: 500 }
    );
  }
}
