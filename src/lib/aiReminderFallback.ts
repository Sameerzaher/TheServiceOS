export interface AiReminderInput {
  clientName: string;
  date: string;
  time: string;
  businessName: string;
}

/**
 * Static WhatsApp-style Hebrew reminder when AI is unavailable.
 */
export function buildFallbackReminderMessage(input: AiReminderInput): string {
  const name = input.clientName.trim() || "שלום";
  const date = input.date.trim();
  const time = input.time.trim();
  const biz = input.businessName.trim();
  const lineBiz = biz ? ` אצל ${biz}.` : "";
  return `היי ${name}, תזכורת ידידותית — יש לנו פגישה ב-${date} בשעה ${time}.${lineBiz} נתראה!`;
}
