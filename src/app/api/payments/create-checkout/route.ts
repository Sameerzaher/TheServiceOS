import { NextRequest, NextResponse } from "next/server";

import { validateSession } from "@/lib/auth/session";
import { resolveTeacherScopeFromSession } from "@/lib/api/resolveTeacherId";
import { getSupabaseAdminClient } from "@/lib/supabase/adminClient";
import { createCheckoutSession, createPaymentLink } from "@/lib/payments/stripeService";
import { isStripeConfigured } from "@/config/env.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/payments/create-checkout
 * Teacher dashboard: create checkout URL or payment link for an appointment.
 * Body: { appointmentId, mode?: "checkout" | "link" }
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const auth = await validateSession(req);
    if (!auth.ok || !auth.teacherId) {
      return NextResponse.json({ ok: false, error: "לא מאומת" }, { status: 401 });
    }

    if (!isStripeConfigured()) {
      return NextResponse.json(
        { ok: false, error: "תשלומים אינם מוגדרים — הוסף STRIPE_SECRET_KEY" },
        { status: 503 },
      );
    }

    const body = await req.json();
    const teacherId = resolveTeacherScopeFromSession(
      req,
      auth.teacherId,
      auth.role,
      body,
    );
    const appointmentId =
      typeof body.appointmentId === "string" ? body.appointmentId.trim() : "";
    const mode = body.mode === "link" ? "link" : "checkout";

    if (!appointmentId) {
      return NextResponse.json({ ok: false, error: "חסר מזהה תור" }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    const { data: appointment, error } = await supabase
      .from("appointments")
      .select(
        `
        id,
        amount,
        payment_status,
        teacher_id,
        clients ( full_name, email )
      `,
      )
      .eq("id", appointmentId)
      .eq("teacher_id", teacherId)
      .maybeSingle();

    if (error || !appointment) {
      return NextResponse.json({ ok: false, error: "תור לא נמצא" }, { status: 404 });
    }

    if (appointment.payment_status === "paid") {
      return NextResponse.json({ ok: false, error: "התור כבר שולם" }, { status: 400 });
    }

    const amount = Number(appointment.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ ok: false, error: "אין סכום לתשלום" }, { status: 400 });
    }

    const client = Array.isArray(appointment.clients)
      ? appointment.clients[0]
      : appointment.clients;

    if (mode === "link") {
      const result = await createPaymentLink({
        appointmentId,
        clientName: client?.full_name || "לקוח",
        amount,
      });
      if (!result.ok || !result.url) {
        return NextResponse.json(
          { ok: false, error: result.error || "שגיאה ביצירת קישור" },
          { status: 500 },
        );
      }
      return NextResponse.json({ ok: true, url: result.url, mode: "link" });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const result = await createCheckoutSession({
      appointmentId,
      clientEmail: client?.email || "",
      clientName: client?.full_name || "לקוח",
      amount,
      successUrl: `${appUrl}/appointments?payment=success`,
      cancelUrl: `${appUrl}/appointments?payment=canceled`,
    });

    if (!result.ok || !result.url) {
      return NextResponse.json(
        { ok: false, error: result.error || "שגיאה ביצירת תשלום" },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, url: result.url, mode: "checkout" });
  } catch (e) {
    console.error("[payments/create-checkout] Error:", e);
    return NextResponse.json({ ok: false, error: "שגיאה לא צפויה" }, { status: 500 });
  }
}
