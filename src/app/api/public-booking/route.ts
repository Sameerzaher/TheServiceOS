import { NextResponse } from "next/server";

import { postPublicBooking } from "@/core/booking/postPublicBooking";
import {
  parsePublicBookingBody,
} from "@/features/booking/logic/publicBookingShared";
import { heUi } from "@/config";
import { jsonPublicError, jsonPublicOk } from "@/lib/api/jsonResponse";
import { parseJsonBody } from "@/lib/api/parseJsonBody";
import { resolveTeacherIdFromRequest } from "@/lib/api/resolveTeacherId";
import { publicBookingLog } from "@/lib/logging/publicBookingLog";
import {
  createSupabaseAdminClient,
  isSupabaseAdminConfigured,
} from "@/lib/supabase/adminClient";

export const runtime = "nodejs";

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 5;
/** Avoid unbounded memory on many IPs (serverless / edge churn). */
const RATE_LIMIT_MAP_SWEEP_THRESHOLD = 2000;

function sweepExpiredRateLimitEntries(now: number) {
  const entries = Array.from(rateLimitMap.entries());
  for (const [ip, entry] of entries) {
    if (now > entry.resetAt) {
      rateLimitMap.delete(ip);
    }
  }
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();

  if (rateLimitMap.size > RATE_LIMIT_MAP_SWEEP_THRESHOLD) {
    sweepExpiredRateLimitEntries(now);
  }

  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  entry.count++;
  return true;
}

export async function POST(req: Request): Promise<NextResponse> {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  publicBookingLog.debug("New booking request", { ip });

  if (!checkRateLimit(ip)) {
    publicBookingLog.warn("Rate limit exceeded", { ip });
    return jsonPublicError(
      429,
      "יותר מדי בקשות. נסו שוב בעוד דקה.",
    );
  }

  if (!isSupabaseAdminConfigured()) {
    publicBookingLog.error("Supabase admin env not configured", {});
    return jsonPublicError(503, heUi.publicBooking.errUnavailable);
  }

  const body = await parseJsonBody(req);
  if (!body.ok) {
    publicBookingLog.warn("Invalid JSON body", {});
    return jsonPublicError(400, heUi.publicBooking.errInvalidPayload);
  }
  const raw = body.data;

  const parsed = parsePublicBookingBody(raw);
  if (!parsed.ok) {
    publicBookingLog.warn("Validation failed", {});
    return jsonPublicError(400, parsed.errorHe);
  }

  const teacherId = resolveTeacherIdFromRequest(req, raw);

  try {
    const supabase = createSupabaseAdminClient();
    const result = await postPublicBooking(supabase, {
      ...parsed.data,
      teacherId,
    });

    if (!result.ok) {
      return jsonPublicError(result.status, result.errorHe);
    }

    return jsonPublicOk({
      appointmentId: result.appointmentId,
      clientId: result.clientId,
    });
  } catch (e) {
    publicBookingLog.error("Route error", { err: String(e) });
    return jsonPublicError(500, heUi.publicBooking.errServerGeneric);
  }
}
