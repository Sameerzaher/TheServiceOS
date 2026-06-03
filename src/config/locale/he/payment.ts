import { PaymentStatus } from "@/core/types/appointment";

/** Payment status labels (locale: Hebrew). Swap file or map for other locales later. */
export const PAYMENT_STATUS_LABELS_HE: Record<PaymentStatus, string> = {
  [PaymentStatus.Unpaid]: "טרם שולם",
  [PaymentStatus.Pending]: "ממתין לתשלום",
  [PaymentStatus.Partial]: "שולם חלקית",
  [PaymentStatus.Paid]: "שולם במלואו",
  [PaymentStatus.Refunded]: "בוצע זיכוי",
  [PaymentStatus.Waived]: "לא חויב",
};

export function paymentStatusLabel(status: PaymentStatus): string {
  return PAYMENT_STATUS_LABELS_HE[status];
}
