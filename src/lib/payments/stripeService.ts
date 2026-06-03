import "server-only";

import { getServerStripeSecretKey } from "@/config/env.server";

/**
 * Payment Integration Guide (Stripe)
 * 
 * ServiceOS now supports online payments via Stripe.
 * 
 * SETUP:
 * 
 * 1. Sign up at https://stripe.com
 * 2. Get your API keys (test mode for development)
 * 3. Add to .env:
 *    STRIPE_SECRET_KEY=sk_test_xxxxx
 *    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
 *    STRIPE_WEBHOOK_SECRET=whsec_xxxxx
 * 
 * 4. Install Stripe:
 *    npm install stripe @stripe/stripe-js
 * 
 * 5. Set up webhook endpoint at https://yourdomain.com/api/webhooks/stripe
 * 
 * FEATURES:
 * - One-time payments for appointments
 * - Payment links sent via WhatsApp
 * - Automatic payment status tracking
 * - Refund support
 * - Multiple currencies (ILS, USD, EUR)
 * - Mobile-optimized checkout
 * 
 * USAGE:
 * 
 * When client books online, they can:
 * 1. Book now, pay later (current flow)
 * 2. Pay immediately via Stripe checkout
 * 
 * Teacher can also:
 * - Send payment link to existing appointment
 * - Process refunds from dashboard
 * - View payment history
 * 
 * API ENDPOINTS:
 * - POST /api/payments/create-checkout - Create Stripe checkout session
 * - POST /api/payments/create-link - Generate payment link
 * - POST /api/payments/refund - Process refund
 * - POST /api/webhooks/stripe - Handle Stripe webhooks
 * 
 * PRICING:
 * Stripe fees: 2.9% + ₪1.20 per transaction (Israel)
 * No monthly fees
 * 
 * SECURITY:
 * - PCI compliant (Stripe handles card data)
 * - Webhook signature verification
 * - Idempotency keys for safety
 */

import Stripe from "stripe";

let stripe: Stripe | null = null;

function safeStripeUserMessage(e: unknown): string {
  return process.env.NODE_ENV === "development" ? String(e) : "Payment request failed";
}

function getStripeClient(): Stripe | null {
  const secret = getServerStripeSecretKey();
  if (!secret) {
    console.warn("[payment] STRIPE_SECRET_KEY not configured");
    return null;
  }

  if (!stripe) {
    stripe = new Stripe(secret, {
      apiVersion: "2026-03-25.dahlia",
      typescript: true,
    });
  }

  return stripe;
}

export interface CreateCheckoutParams {
  appointmentId: string;
  clientEmail: string;
  clientName: string;
  amount: number;
  currency?: string;
  successUrl: string;
  cancelUrl: string;
}

export async function createCheckoutSession(
  params: CreateCheckoutParams
): Promise<{ ok: boolean; url?: string; error?: string }> {
  const client = getStripeClient();

  if (!client) {
    return { ok: false, error: "Payment service not configured" };
  }

  try {
    const session = await client.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: params.currency || "ils",
            product_data: {
              name: `שיעור - ${params.clientName}`,
              description: `תשלום עבור שיעור`,
            },
            unit_amount: Math.round(params.amount * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      customer_email: params.clientEmail,
      metadata: {
        appointment_id: params.appointmentId,
      },
    });

    console.log("[payment] Checkout session created:", session.id);
    return { ok: true, url: session.url || undefined };
  } catch (e) {
    console.error("[payment] Create checkout error:", e);
    return { ok: false, error: safeStripeUserMessage(e) };
  }
}

export async function createPaymentLink(params: {
  appointmentId: string;
  clientName: string;
  amount: number;
  currency?: string;
}): Promise<{ ok: boolean; url?: string; error?: string }> {
  const client = getStripeClient();

  if (!client) {
    return { ok: false, error: "Payment service not configured" };
  }

  try {
    const product = await client.products.create({
      name: `שיעור - ${params.clientName}`,
      metadata: {
        appointment_id: params.appointmentId,
      },
    });

    const price = await client.prices.create({
      product: product.id,
      unit_amount: Math.round(params.amount * 100),
      currency: params.currency || "ils",
    });

    const paymentLink = await client.paymentLinks.create({
      line_items: [{ price: price.id, quantity: 1 }],
      metadata: {
        appointment_id: params.appointmentId,
      },
    });

    console.log("[payment] Payment link created:", paymentLink.id);
    return { ok: true, url: paymentLink.url };
  } catch (e) {
    console.error("[payment] Create link error:", e);
    return { ok: false, error: safeStripeUserMessage(e) };
  }
}

export async function processRefund(params: {
  paymentIntentId: string;
  amount?: number;
  reason?: string;
}): Promise<{ ok: boolean; refundId?: string; error?: string }> {
  const client = getStripeClient();

  if (!client) {
    return { ok: false, error: "Payment service not configured" };
  }

  try {
    const refund = await client.refunds.create({
      payment_intent: params.paymentIntentId,
      amount: params.amount ? Math.round(params.amount * 100) : undefined,
      reason: params.reason as any,
    });

    console.log("[payment] Refund processed:", refund.id);
    return { ok: true, refundId: refund.id };
  } catch (e) {
    console.error("[payment] Refund error:", e);
    return { ok: false, error: safeStripeUserMessage(e) };
  }
}
