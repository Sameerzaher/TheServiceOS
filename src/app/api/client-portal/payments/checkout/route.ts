import { NextRequest, NextResponse } from "next/server";

import { validateClientSession } from "@/lib/auth/clientSession";
import { getSupabaseAdminClient } from "@/lib/supabase/adminClient";
import { createCheckoutSession } from "@/lib/payments/stripeService";
import { isStripeConfigured } from "@/config/env.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/client-portal/payments/checkout
 * Create Stripe Checkout for a client-owned appointment.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await validateClientSession(request);
    if (!session.ok) {
      return NextResponse.json({ error: session.error }, { status: session.status });
    }

    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: "תשלומים אונליין אינם מוגדרים כרגע" },
        { status: 503 },
      );
    }

    const { appointmentId } = await request.json();
    if (!appointmentId || typeof appointmentId !== "string") {
      return NextResponse.json({ error: "חסר מזהה תור" }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();

    const { data: appointment, error: aptError } = await supabase
      .from("appointments")
      .select(
        `
        id,
        client_id,
        amount,
        payment_status,
        start_at,
        clients ( full_name, email )
      `,
      )
      .eq("id", appointmentId)
      .eq("client_id", session.clientId)
      .maybeSingle();

    if (aptError || !appointment) {
      return NextResponse.json({ error: "תור לא נמצא" }, { status: 404 });
    }

    if (appointment.payment_status === "paid") {
      return NextResponse.json({ error: "התור כבר שולם" }, { status: 400 });
    }

    const amount = Number(appointment.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "אין סכום לתשלום עבור תור זה" }, { status: 400 });
    }

    const client = Array.isArray(appointment.clients)
      ? appointment.clients[0]
      : appointment.clients;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const result = await createCheckoutSession({
      appointmentId,
      clientEmail: client?.email || "",
      clientName: client?.full_name || "לקוח",
      amount,
      currency: "ils",
      successUrl: `${appUrl}/payment-history?paid=1`,
      cancelUrl: `${appUrl}/payment-history?canceled=1`,
    });

    if (!result.ok || !result.url) {
      return NextResponse.json(
        { error: result.error || "שגיאה ביצירת תשלום" },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, url: result.url });
  } catch (error) {
    console.error("[client-portal/payments/checkout] Error:", error);
    return NextResponse.json({ error: "שגיאה לא צפויה" }, { status: 500 });
  }
}
