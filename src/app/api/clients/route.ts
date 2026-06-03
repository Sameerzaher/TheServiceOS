import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

import { getSupabaseClientsTable } from "@/core/config/supabaseEnv";
import { isMissingColumnError } from "@/core/repositories/supabase/postgrestErrors";
import { clientFromRow, type ClientRow } from "@/core/storage/supabase/mappers";
import type { Client } from "@/core/types/client";
import { resolveTeacherScopeFromSession } from "@/lib/api/resolveTeacherId";
import { validateSession } from "@/lib/auth/session";
import {
  getSupabaseAdminClient,
  isSupabaseAdminConfigured,
} from "@/lib/supabase/adminClient";

export const runtime = "nodejs";

const HE_ERR_UNAVAILABLE = "שמירת לקוחות אינה זמינה כרגע. נסו שוב מאוחר יותר.";
const HE_ERR_INVALID = "בקשה לא תקינה.";
const HE_ERR_GENERIC = "אירעה תקלה בשמירת הלקוח. נסו שוב.";

function parseNewClient(
  raw: unknown,
): Omit<Client, "id" | "createdAt" | "updatedAt" | "teacherId"> & {
  id?: string;
  createdAt?: string;
  updatedAt?: string;
} | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const fullName = typeof o.fullName === "string" ? o.fullName.trim() : "";
  const phone = typeof o.phone === "string" ? o.phone.trim() : "";
  const notes = typeof o.notes === "string" ? o.notes.trim() : "";
  const customFields =
    o.customFields &&
    typeof o.customFields === "object" &&
    !Array.isArray(o.customFields)
      ? (o.customFields as Record<string, unknown>)
      : {};
  if (fullName.length < 2) return null;
  return {
    id: typeof o.id === "string" ? o.id.trim() : undefined,
    createdAt: typeof o.createdAt === "string" ? o.createdAt : undefined,
    updatedAt: typeof o.updatedAt === "string" ? o.updatedAt : undefined,
    fullName,
    phone,
    notes,
    customFields,
  };
}

export async function GET(req: Request): Promise<NextResponse> {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      { ok: false as const, error: HE_ERR_UNAVAILABLE },
      { status: 503 },
    );
  }

  try {
    const supabase = getSupabaseAdminClient();

    const sessionValidation = await validateSession(req);
    if (!sessionValidation.ok || !sessionValidation.businessId || !sessionValidation.teacherId) {
      return NextResponse.json(
        { ok: false as const, error: "לא מאומת" },
        { status: 401 },
      );
    }

    const businessId = sessionValidation.businessId;
    const teacherId = resolveTeacherScopeFromSession(
      req,
      sessionValidation.teacherId,
      sessionValidation.role,
    );

    console.log("[clients/get] Fetching clients for:", { businessId, teacherId });
    
    const table = getSupabaseClientsTable();
    let listRes = await supabase
      .from(table)
      .select("*")
      .eq("business_id", businessId)
      .eq("teacher_id", teacherId)
      .order("full_name", { ascending: true });
    if (listRes.error && isMissingColumnError(listRes.error)) {
      console.log("[clients/get] teacher_id column missing, falling back to business_id only");
      listRes = await supabase
        .from(table)
        .select("*")
        .eq("business_id", businessId)
        .order("full_name", { ascending: true });
    }
    const { data, error } = listRes;

    if (error) {
      console.error("[clients/get] Database error:", error);
      return NextResponse.json(
        { ok: false as const, error: HE_ERR_GENERIC },
        { status: 500 },
      );
    }

    const clients: Client[] = [];
    for (const row of data ?? []) {
      const parsed = clientFromRow(row as unknown as ClientRow);
      if (parsed) clients.push(parsed);
    }
    
    console.log("[clients/get] SUCCESS - Returned", clients.length, "clients for teacher:", teacherId);
    
    return NextResponse.json({ ok: true as const, clients });
  } catch (e) {
    console.error("[clients/get] Unexpected error:", e);
    return NextResponse.json(
      { ok: false as const, error: HE_ERR_GENERIC },
      { status: 500 },
    );
  }
}

export async function POST(req: Request): Promise<NextResponse> {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      { ok: false as const, error: HE_ERR_UNAVAILABLE },
      { status: 503 },
    );
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false as const, error: HE_ERR_INVALID },
      { status: 400 },
    );
  }
  const parsed = parseNewClient(raw);
  if (!parsed) {
    return NextResponse.json(
      { ok: false as const, error: HE_ERR_INVALID },
      { status: 400 },
    );
  }

  const now = new Date().toISOString();
  const id = parsed.id && parsed.id.length > 0 ? parsed.id : randomUUID();
  const createdAt = parsed.createdAt ?? now;
  const updatedAt = parsed.updatedAt ?? now;

  try {
    const supabase = getSupabaseAdminClient();

    const sessionValidation = await validateSession(req);
    if (!sessionValidation.ok || !sessionValidation.businessId || !sessionValidation.teacherId) {
      return NextResponse.json(
        { ok: false as const, error: "לא מאומת" },
        { status: 401 },
      );
    }

    const businessId = sessionValidation.businessId;
    const teacherId = resolveTeacherScopeFromSession(
      req,
      sessionValidation.teacherId,
      sessionValidation.role,
      raw,
    );
    const table = getSupabaseClientsTable();

    const basePayload = {
      id,
      business_id: businessId,
      full_name: parsed.fullName,
      phone: parsed.phone,
      notes: parsed.notes,
      custom_fields: parsed.customFields,
      created_at: createdAt,
      updated_at: updatedAt,
    };
    let insertRes = await supabase.from(table).insert({
      ...basePayload,
      teacher_id: teacherId,
    });
    if (insertRes.error && isMissingColumnError(insertRes.error)) {
      insertRes = await supabase.from(table).insert(basePayload);
    }
    if (insertRes.error) {
      console.error("[clients/post]", insertRes.error);
      return NextResponse.json(
        { ok: false as const, error: HE_ERR_GENERIC },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true as const,
      client: {
        id,
        teacherId,
        fullName: parsed.fullName,
        phone: parsed.phone,
        notes: parsed.notes,
        customFields: parsed.customFields,
        createdAt,
        updatedAt,
      } satisfies Client,
    });
  } catch (e) {
    console.error("[clients/post]", e);
    return NextResponse.json(
      { ok: false as const, error: HE_ERR_GENERIC },
      { status: 500 },
    );
  }
}
