import { buildFallbackReminderMessage } from "@/lib/aiReminderFallback";

export interface GenerateReminderMessageInput {
  clientName: string;
  date: string;
  time: string;
  businessName: string;
}

export type GenerateReminderMessageResult = {
  message: string;
  usedFallback: boolean;
};

export async function generateReminderMessage(
  input: GenerateReminderMessageInput,
): Promise<GenerateReminderMessageResult> {
  const fallbackMessage = buildFallbackReminderMessage(input);

  try {
    const res = await fetch("/api/ai/reminder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientName: input.clientName,
        date: input.date,
        time: input.time,
        businessName: input.businessName,
      }),
    });

    if (!res.ok) {
      return { message: fallbackMessage, usedFallback: true };
    }

    const data = (await res.json()) as {
      message?: string;
      fallback?: boolean;
    };
    const message =
      typeof data.message === "string" && data.message.trim().length > 0
        ? data.message.trim()
        : fallbackMessage;

    return {
      message,
      usedFallback: data.fallback === true,
    };
  } catch {
    return { message: fallbackMessage, usedFallback: true };
  }
}
