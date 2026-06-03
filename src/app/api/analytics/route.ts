import { NextResponse } from "next/server";

import { getSupabaseAppointmentsTable, getSupabaseBusinessId } from "@/core/config/supabaseEnv";
import { AppointmentStatus, PaymentStatus } from "@/core/types/appointment";
import { resolveTeacherIdFromRequest } from "@/lib/api/resolveTeacherId";
import {
  getSupabaseAdminClient,
  isSupabaseAdminConfigured,
} from "@/lib/supabase/adminClient";
import { validateSession } from "@/lib/auth/session";

export const runtime = "nodejs";

interface AnalyticsResponse {
  ok: true;
  stats: {
    totalRevenue: number;
    completedLessons: number;
    cancelledLessons: number;
    activeClients: number;
    cancellationRate: number;
    averageLessonPrice: number;
    unpaidAmount: number;
    thisMonthRevenue: number;
    thisMonthLessons: number;
  };
}

export async function GET(req: Request): Promise<NextResponse> {
  console.log("[analytics/get] Fetching analytics...");

  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      { ok: false, error: "שירות אינו זמין" },
      { status: 503 }
    );
  }

  try {
    const supabase = getSupabaseAdminClient();
    const businessId = getSupabaseBusinessId();
    const teacherId = resolveTeacherIdFromRequest(req);

    // Validate session
    const sessionValidation = await validateSession(req);
    if (!sessionValidation.ok) {
      console.error("[analytics/get] Session validation failed");
      return NextResponse.json(
        { ok: false, error: "לא מאומת" },
        { status: 401 }
      );
    }

    console.log("[analytics/get] Loading data for teacher:", teacherId);

    const table = getSupabaseAppointmentsTable();

    // Fetch all appointments for this teacher
    const { data: appointments, error: apptError } = await supabase
      .from(table)
      .select("*")
      .eq("business_id", businessId)
      .eq("teacher_id", teacherId);

    if (apptError) {
      console.error("[analytics/get] Appointments fetch error:", apptError);
      return NextResponse.json(
        { ok: false, error: "שגיאה בטעינת נתונים" },
        { status: 500 }
      );
    }

    // Fetch unique clients count
    const { data: clientsData, error: clientsError } = await supabase
      .from("clients")
      .select("id")
      .eq("business_id", businessId)
      .eq("teacher_id", teacherId);

    if (clientsError) {
      console.error("[analytics/get] Clients fetch error:", clientsError);
      return NextResponse.json(
        { ok: false, error: "שגיאה בטעינת נתונים" },
        { status: 500 }
      );
    }

    const activeClients = clientsData?.length || 0;

    // Calculate stats
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let totalRevenue = 0;
    let completedLessons = 0;
    let cancelledLessons = 0;
    let unpaidAmount = 0;
    let thisMonthRevenue = 0;
    let thisMonthLessons = 0;
    let totalLessonsWithPrice = 0;
    let sumPrices = 0;

    appointments?.forEach((appt) => {
      const amount = appt.amount || 0;
      const isPaid = appt.payment_status === PaymentStatus.Paid;
      const isCompleted = appt.status === AppointmentStatus.Completed;
      const isCancelled = appt.status === AppointmentStatus.Cancelled;
      const apptDate = new Date(appt.start_at);

      if (isCompleted) {
        completedLessons++;
        if (isPaid) {
          totalRevenue += amount;
        }
      }

      if (isCancelled) {
        cancelledLessons++;
      }

      if (!isPaid && !isCancelled && amount > 0) {
        unpaidAmount += amount;
      }

      if (apptDate >= startOfMonth && isCompleted && isPaid) {
        thisMonthRevenue += amount;
        thisMonthLessons++;
      }

      if (amount > 0) {
        totalLessonsWithPrice++;
        sumPrices += amount;
      }
    });

    const totalLessons = completedLessons + cancelledLessons;
    const cancellationRate =
      totalLessons > 0 ? (cancelledLessons / totalLessons) * 100 : 0;
    const averageLessonPrice =
      totalLessonsWithPrice > 0 ? sumPrices / totalLessonsWithPrice : 0;

    const stats = {
      totalRevenue,
      completedLessons,
      cancelledLessons,
      activeClients,
      cancellationRate: Math.round(cancellationRate * 10) / 10,
      averageLessonPrice: Math.round(averageLessonPrice * 100) / 100,
      unpaidAmount,
      thisMonthRevenue,
      thisMonthLessons,
    };

    console.log("[analytics/get] SUCCESS:", stats);

    return NextResponse.json({ ok: true, stats } as AnalyticsResponse);
  } catch (e) {
    console.error("[analytics/get] Unexpected error:", e);
    return NextResponse.json(
      { ok: false, error: "שגיאה בלתי צפויה" },
      { status: 500 }
    );
  }
}
