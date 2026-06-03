import { NextResponse } from "next/server";

import { getServerOpenAiApiKey } from "@/config/env.server";
import { buildFallbackReminderMessage } from "@/lib/aiReminderFallback";
import { parseJsonBody } from "@/lib/api/parseJsonBody";

export const runtime = "nodejs";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

type Body = {
  clientName?: unknown;
  date?: unknown;
  time?: unknown;
  businessName?: unknown;
};

function parseBody(raw: Body): {
  clientName: string;
  date: string;
  time: string;
  businessName: string;
} | null {
  const clientName =
    typeof raw.clientName === "string" ? raw.clientName.trim() : "";
  const date = typeof raw.date === "string" ? raw.date.trim() : "";
  const time = typeof raw.time === "string" ? raw.time.trim() : "";
  const businessName =
    typeof raw.businessName === "string" ? raw.businessName.trim() : "";
  if (!date || !time) return null;
  return { clientName, date, time, businessName };
}

export async function POST(req: Request): Promise<NextResponse> {
  const parsed = await parseJsonBody(req);
  if (!parsed.ok) {
    return NextResponse.json({ error: "בקשה לא תקינה." }, { status: 400 });
  }
  const raw = parsed.data;

  const input = parseBody(raw as Body);
  if (!input) {
    return NextResponse.json(
      { error: "חסרים תאריך או שעה." },
      { status: 400 },
    );
  }

  const fallback = buildFallbackReminderMessage(input);
  const apiKey = getServerOpenAiApiKey();
  if (!apiKey) {
    return NextResponse.json({ message: fallback, fallback: true });
  }

  try {
    const userPayload = JSON.stringify({
      clientName: input.clientName,
      date: input.date,
      time: input.time,
      businessName: input.businessName || undefined,
    });

    const res = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.6,
        max_tokens: 220,
        messages: [
          {
            role: "system",
            content:
              "אתה עוזר לבעל עסק קטן. כתוב הודעת תזכורת קצרה וחמימה בעברית, בסגנון וואטסאפ (לא פורמלית מדי). ללא כותרות או רשימות — רק טקסט אחד רציף. שורה או שתיים לכל היותר. שמור על השם, התאריך, השעה ושם העסק בדיוק כפי שניתנו. אל תוסיף אימוג׳י אלא אם זה משפר את הטון מאלף.",
          },
          {
            role: "user",
            content: `פרטי הפגישה (JSON): ${userPayload}`,
          },
        ],
      }),
    });

    if (!res.ok) {
      console.error("[ai/reminder] OpenAI HTTP", res.status);
      return NextResponse.json({ message: fallback, fallback: true });
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) {
      return NextResponse.json({ message: fallback, fallback: true });
    }

    return NextResponse.json({ message: text, fallback: false });
  } catch (e) {
    console.error("[ai/reminder]", e);
    return NextResponse.json({ message: fallback, fallback: true });
  }
}
