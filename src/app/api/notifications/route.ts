import { NextResponse } from "next/server";

import { getSupabaseBusinessId } from "@/core/config/supabaseEnv";
import { isMissingRelationError } from "@/core/repositories/supabase/postgrestErrors";
import { resolveTeacherScopeFromSession } from "@/lib/api/resolveTeacherId";
import {
  getSupabaseAdminClient,
  isSupabaseAdminConfigured,
} from "@/lib/supabase/adminClient";
import { validateSession } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HE_ERR_UNAVAILABLE = "שירות הנוטיפיקציות אינו זמין כרגע.";
const HE_ERR_GENERIC = "אירעה שגיאה.";
const HE_ERR_DB_NOT_READY =
  "טבלת התראות לא קיימת במסד. הריצו ב-Supabase את הקובץ supabase/CREATE-NOTIFICATIONS-TABLE.sql (או צרו טבלת notifications).";

export type Notification = {
  id: string;
  type: string;
  title: string;
  message?: string;
  entityType?: string;
  entityId?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
};

export async function GET(req: Request): Promise<NextResponse> {
  console.log("[notifications/get] Loading notifications");
  
  if (!isSupabaseAdminConfigured()) {
    console.error("[notifications/get] Supabase not configured");
    return NextResponse.json({ ok: false as const, error: HE_ERR_UNAVAILABLE }, { status: 503 });
  }

  try {
    const supabase = getSupabaseAdminClient();

    const sessionValidation = await validateSession(req);
    if (!sessionValidation.ok) {
      console.error("[notifications/get] Invalid session:", sessionValidation.error);
      return NextResponse.json(
        { ok: false as const, error: "נדרשת התחברות" },
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

    console.log("[notifications/get] Loading for teacher:", teacherId);
    
    // Get notifications for this teacher
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("business_id", businessId)
      .eq("teacher_id", teacherId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("[notifications/get] Database error:", error);
      return NextResponse.json({ ok: false as const, error: HE_ERR_GENERIC }, { status: 500 });
    }

    const notifications: Notification[] = (data ?? []).map((row: any) => ({
      id: row.id,
      type: row.type,
      title: row.title,
      message: row.message,
      entityType: row.entity_type,
      entityId: row.entity_id,
      isRead: row.is_read,
      readAt: row.read_at,
      createdAt: row.created_at,
    }));

    console.log("[notifications/get] SUCCESS - Returned", notifications.length, "notifications");

    return NextResponse.json({ ok: true as const, notifications });
  } catch (e) {
    console.error("[notifications/get] Unexpected error:", e);
    return NextResponse.json({ ok: false as const, error: HE_ERR_GENERIC }, { status: 500 });
  }
}

export async function PUT(req: Request): Promise<NextResponse> {
  console.log("[notifications/put] Mark notifications as read");
  
  if (!isSupabaseAdminConfigured()) {
    console.error("[notifications/put] Supabase not configured");
    return NextResponse.json({ ok: false as const, error: HE_ERR_UNAVAILABLE }, { status: 503 });
  }

  try {
    const supabase = getSupabaseAdminClient();

    const sessionValidation = await validateSession(req);
    if (!sessionValidation.ok) {
      console.error("[notifications/put] Invalid session:", sessionValidation.error);
      return NextResponse.json(
        { ok: false as const, error: "נדרשת התחברות" },
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
    const { notificationIds } = body as { notificationIds?: string[] };
    
    if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
      console.log("[notifications/put] No notification IDs provided, marking all as read");
      
      // Mark all unread notifications as read
      const { error } = await supabase
        .from("notifications")
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq("business_id", businessId)
        .eq("teacher_id", teacherId)
        .eq("is_read", false);

      if (error) {
        console.error("[notifications/put] Database error:", error);
        if (isMissingRelationError(error)) {
          return NextResponse.json(
            { ok: false as const, error: HE_ERR_DB_NOT_READY },
            { status: 503 }
          );
        }
        return NextResponse.json({ ok: false as const, error: HE_ERR_GENERIC }, { status: 500 });
      }

      console.log("[notifications/put] SUCCESS - All marked as read");
      return NextResponse.json({ ok: true as const });
    }
    
    console.log("[notifications/put] Marking notifications as read:", notificationIds);
    
    // Mark specific notifications as read
    const { error } = await supabase
      .from("notifications")
      .update({ 
        is_read: true, 
        read_at: new Date().toISOString() 
      })
      .eq("business_id", businessId)
      .eq("teacher_id", teacherId)
      .in("id", notificationIds);

    if (error) {
      console.error("[notifications/put] Database error:", error);
      if (isMissingRelationError(error)) {
        return NextResponse.json(
          { ok: false as const, error: HE_ERR_DB_NOT_READY },
          { status: 503 }
        );
      }
      return NextResponse.json({ ok: false as const, error: HE_ERR_GENERIC }, { status: 500 });
    }

    console.log("[notifications/put] SUCCESS - Marked", notificationIds.length, "as read");

    return NextResponse.json({ ok: true as const });
  } catch (e) {
    console.error("[notifications/put] Unexpected error:", e);
    return NextResponse.json({ ok: false as const, error: HE_ERR_GENERIC }, { status: 500 });
  }
}
