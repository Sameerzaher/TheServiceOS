"use client";

import { useState } from "react";

import { heUi } from "@/config";
import { Button, useToast } from "@/components/ui";
import type { PaymentStatus } from "@/core/types/appointment";
import { isPaidStatus } from "@/core/utils/insights";
import { useDashboardTeacherId } from "@/features/app/DashboardTeacherContext";
import { mergeTeacherScopeHeaders } from "@/lib/api/teacherScopeHeaders";
import { buildWhatsAppHref } from "@/core/utils/whatsapp";

type SendPaymentLinkButtonProps = {
  appointmentId: string;
  amount: number;
  paymentStatus: PaymentStatus;
  clientName: string;
  clientPhone?: string;
  className?: string;
};

export function SendPaymentLinkButton({
  appointmentId,
  amount,
  paymentStatus,
  clientName,
  clientPhone = "",
  className,
}: SendPaymentLinkButtonProps) {
  const teacherId = useDashboardTeacherId();
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  if (isPaidStatus(paymentStatus) || !Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  const handleClick = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/payments/create-checkout", {
        method: "POST",
        headers: mergeTeacherScopeHeaders(teacherId, {
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({ appointmentId, mode: "link" }),
      });
      const data = await response.json();

      if (!response.ok || !data.ok || !data.url) {
        toast(data.error || heUi.payments.sendLinkError, "error");
        return;
      }

      const paymentUrl = data.url as string;
      const message = heUi.payments.paymentLinkWhatsappText({
        name: clientName.trim() || "לקוח",
        url: paymentUrl,
      });

      const phone = clientPhone.trim();
      const waHref = phone ? buildWhatsAppHref(phone, message) : null;

      if (waHref) {
        window.open(waHref, "_blank", "noopener,noreferrer");
        toast(heUi.payments.sendLinkWhatsappOpened, "success");
        return;
      }

      try {
        await navigator.clipboard.writeText(paymentUrl);
        toast(heUi.payments.sendLinkCopied, "success");
      } catch {
        toast(paymentUrl, "info");
      }
    } catch {
      toast(heUi.payments.sendLinkError, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      className={className}
      onClick={() => void handleClick()}
      disabled={loading}
      aria-label={`${heUi.payments.sendPaymentLink} — ${clientName}`}
    >
      {loading ? heUi.payments.sendLinkLoading : heUi.payments.sendPaymentLink}
    </Button>
  );
}
