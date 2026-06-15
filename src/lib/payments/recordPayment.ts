import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { PaymentStatus } from "@/core/types/appointment";

export async function markAppointmentPaid(
  supabase: SupabaseClient,
  params: {
    appointmentId: string;
    paymentIntentId?: string | null;
    checkoutSessionId?: string | null;
    paymentMethod?: string;
  },
): Promise<{ ok: boolean; error?: string }> {
  const now = new Date().toISOString();
  const { data: appointment, error: fetchError } = await supabase
    .from("appointments")
    .select("id, payment_status")
    .eq("id", params.appointmentId)
    .maybeSingle();

  if (fetchError || !appointment) {
    return { ok: false, error: "Appointment not found" };
  }

  if (appointment.payment_status === PaymentStatus.Paid) {
    return { ok: true };
  }

  const { error: updateError } = await supabase
    .from("appointments")
    .update({
      payment_status: PaymentStatus.Paid,
      payment_method: params.paymentMethod ?? "stripe",
      stripe_payment_intent_id: params.paymentIntentId ?? null,
      stripe_checkout_session_id: params.checkoutSessionId ?? null,
      updated_at: now,
    })
    .eq("id", params.appointmentId);

  if (updateError) {
    console.error("[payments] markAppointmentPaid error:", updateError);
    return { ok: false, error: updateError.message };
  }

  return { ok: true };
}
