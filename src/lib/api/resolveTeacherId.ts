import {
  getSupabaseDefaultTeacherId,
  isUuid,
} from "@/core/config/supabaseEnv";

/**
 * Resolves tenant teacher scope for data APIs.
 *
 * Precedence:
 * 1. Query `?teacherId=` (UUID)
 * 2. Header `x-teacher-id` (UUID)
 * 3. JSON body field `teacherId` when `body` is provided (POST/PUT after parse)
 * 4. Fallback: {@link getSupabaseDefaultTeacherId} (env / MVP default)
 */
export function resolveTeacherIdFromRequest(req: Request, body?: unknown): string {
  let teacherId: string | undefined;
  
  try {
    const q = new URL(req.url).searchParams.get("teacherId")?.trim();
    if (q && isUuid(q)) {
      teacherId = q;
      console.log("[resolveTeacherId] Resolved from query param:", teacherId);
      return teacherId;
    }
  } catch {
    /* ignore invalid URL */
  }

  const headerRaw =
    req.headers.get("x-teacher-id")?.trim() ||
    req.headers.get("X-Teacher-Id")?.trim();
  if (headerRaw && isUuid(headerRaw)) {
    teacherId = headerRaw;
    console.log("[resolveTeacherId] Resolved from header:", teacherId);
    return teacherId;
  }

  if (body !== undefined && body !== null && typeof body === "object") {
    const raw = (body as Record<string, unknown>).teacherId;
    if (typeof raw === "string") {
      const t = raw.trim();
      if (isUuid(t)) {
        teacherId = t;
        console.log("[resolveTeacherId] Resolved from body:", teacherId);
        return teacherId;
      }
    }
  }

  teacherId = getSupabaseDefaultTeacherId();
  console.log("[resolveTeacherId] Using fallback default:", teacherId);
  return teacherId;
}

/**
 * Tenant scope for dashboard APIs: admins may use `x-teacher-id` / query / body; others use the logged-in teacher.
 */
export function resolveTeacherScopeFromSession(
  req: Request,
  sessionTeacherId: string,
  role: string | undefined,
  body?: unknown,
): string {
  if (role === "admin") {
    return resolveTeacherIdFromRequest(req, body);
  }
  return sessionTeacherId;
}
