import { applyWhatsAppTemplate } from "@/core/whatsapp/templates";

export interface ReminderTemplateVars {
  name: string;
  time: string;
  businessName?: string;
  businessPhone?: string;
  /** Optional — supported in templates as `{{date}}` */
  date?: string;
  /** Optional — e.g. formatted ₪ amount for payment reminders */
  amountDue?: string;
}

/**
 * Replaces placeholders in reminder copy (`{{name}}`, `{{time}}`, `{{date}}`,
 * `{{business}}` / `{{businessName}}`, `{{businessPhone}}`, `{{amountDue}}`).
 */
export function applyReminderTemplate(
  template: string,
  vars: ReminderTemplateVars,
): string {
  return applyWhatsAppTemplate(template, {
    name: vars.name,
    time: vars.time,
    date: vars.date,
    businessName: vars.businessName,
    businessPhone: vars.businessPhone,
    amountDue: vars.amountDue,
  });
}
