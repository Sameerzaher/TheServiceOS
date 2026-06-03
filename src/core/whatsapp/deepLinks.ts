import { buildWhatsAppHref } from "@/core/utils/whatsapp";
import {
  applyWhatsAppTemplate,
  DEFAULT_WHATSAPP_TEMPLATES_HE,
} from "./templates";

export type BookingConfirmationVars = {
  name: string;
  date: string;
  time: string;
  businessName?: string;
};

export type AppointmentReminderVars = {
  name: string;
  time: string;
  date?: string;
  businessName?: string;
  businessPhone?: string;
};

export type PaymentReminderVars = {
  name: string;
  amountDue: string;
  businessName?: string;
};

export type FollowUpVars = {
  name: string;
  businessName?: string;
};

/** New booking confirmation — uses Hebrew default unless `template` is passed. */
export function whatsappBookingConfirmationHref(
  phone: string,
  vars: BookingConfirmationVars,
  template: string = DEFAULT_WHATSAPP_TEMPLATES_HE.bookingConfirmation,
): string | null {
  const msg = applyWhatsAppTemplate(template, vars);
  return buildWhatsAppHref(phone, msg);
}

/** Appointment reminder (e.g. tomorrow / upcoming). */
export function whatsappAppointmentReminderHref(
  phone: string,
  vars: AppointmentReminderVars,
  template: string = DEFAULT_WHATSAPP_TEMPLATES_HE.appointmentReminder,
): string | null {
  const msg = applyWhatsAppTemplate(template, vars);
  return buildWhatsAppHref(phone, msg);
}

/** Unpaid balance / payment nudge. */
export function whatsappPaymentReminderHref(
  phone: string,
  vars: PaymentReminderVars,
  template: string = DEFAULT_WHATSAPP_TEMPLATES_HE.paymentReminder,
): string | null {
  const msg = applyWhatsAppTemplate(template, vars);
  return buildWhatsAppHref(phone, msg);
}

/** After visit — light follow-up. */
export function whatsappFollowUpAfterAppointmentHref(
  phone: string,
  vars: FollowUpVars,
  template: string = DEFAULT_WHATSAPP_TEMPLATES_HE.followUp,
): string | null {
  const msg = applyWhatsAppTemplate(template, vars);
  return buildWhatsAppHref(phone, msg);
}
