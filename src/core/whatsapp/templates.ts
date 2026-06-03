/**
 * {{variable}} templates for WhatsApp messages (owner → client).
 * Aliases: {{business}} → businessName
 */

export interface WhatsAppTemplateVars {
  name?: string;
  date?: string;
  time?: string;
  businessName?: string;
  business?: string;
  businessPhone?: string;
  amountDue?: string;
}

/** English defaults (product / docs). */
export const DEFAULT_WHATSAPP_TEMPLATES = {
  bookingConfirmation:
    "Hi {{name}}, your appointment is booked for {{date}} at {{time}}",
  appointmentReminder:
    "Reminder: you have an appointment tomorrow at {{time}}",
  paymentReminder:
    "Hi {{name}}, just a reminder that {{amountDue}} is still unpaid",
  followUp:
    "Hi {{name}}, thanks for visiting {{businessName}} — we hope to see you again soon",
} as const;

/** Hebrew defaults for in-app owner actions. */
export const DEFAULT_WHATSAPP_TEMPLATES_HE = {
  bookingConfirmation:
    "היי {{name}}, התור שלך נקבע ל-{{date}} בשעה {{time}}",
  appointmentReminder: "תזכורת: מחר יש לך תור ב-{{time}}",
  paymentReminder:
    "היי {{name}}, תזכורת ידידותית: עדיין יש לנו יתרה של {{amountDue}}",
  followUp:
    "היי {{name}}, תודה שביקרתם אצל {{businessName}} — נשמח לשמוע חווייה",
} as const;

/**
 * Replaces `{{name}}`, `{{date}}`, `{{time}}`, `{{businessName}}`, `{{business}}`,
 * `{{businessPhone}}`, `{{amountDue}}` (case-insensitive, optional spaces).
 */
export function applyWhatsAppTemplate(
  template: string,
  vars: WhatsAppTemplateVars,
): string {
  const name = vars.name ?? "";
  const date = vars.date ?? "";
  const time = vars.time ?? "";
  const businessName = vars.businessName ?? vars.business ?? "";
  const businessPhone = vars.businessPhone ?? "";
  const amountDue = vars.amountDue ?? "";

  return template
    .replace(/\{\{\s*name\s*\}\}/gi, name)
    .replace(/\{\{\s*date\s*\}\}/gi, date)
    .replace(/\{\{\s*time\s*\}\}/gi, time)
    .replace(/\{\{\s*business(Name)?\s*\}\}/gi, businessName)
    .replace(/\{\{\s*businessPhone\s*\}\}/gi, businessPhone)
    .replace(/\{\{\s*amountDue\s*\}\}/gi, amountDue);
}
