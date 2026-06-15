import { NextResponse } from "next/server";
import Stripe from "stripe";

import {
  getServerStripeSecretKey,
  getServerStripeWebhookSecret,
} from "@/config/env.server";
import { getSupabaseAdminClient } from "@/lib/supabase/adminClient";
import { markAppointmentPaid } from "@/lib/payments/recordPayment";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/webhooks/stripe
 * Stripe webhook — marks appointments paid on successful checkout.
 */
export async function POST(req: Request): Promise<NextResponse> {
  const secret = getServerStripeSecretKey();
  const webhookSecret = getServerStripeWebhookSecret();

  if (!secret || !webhookSecret) {
    console.error("[webhooks/stripe] Missing Stripe configuration");
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const stripe = new Stripe(secret, {
    apiVersion: "2026-03-25.dahlia",
    typescript: true,
  });

  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("[webhooks/stripe] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const appointmentId = session.metadata?.appointment_id;

    if (appointmentId) {
      const supabase = getSupabaseAdminClient();
      const paymentIntentId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id ?? null;

      const result = await markAppointmentPaid(supabase, {
        appointmentId,
        paymentIntentId,
        checkoutSessionId: session.id,
        paymentMethod: "stripe",
      });

      if (!result.ok) {
        console.error("[webhooks/stripe] Failed to mark paid:", appointmentId, result.error);
        return NextResponse.json({ error: "Update failed" }, { status: 500 });
      }

      console.log("[webhooks/stripe] Appointment marked paid:", appointmentId);
    }
  }

  return NextResponse.json({ received: true });
}
