import { getSupabaseDefaultTeacherId } from "@/core/config/supabaseEnv";

export const TEACHER_SCOPE_HEADER = "x-teacher-id";

/** Merges `x-teacher-id` for dashboard API routes that use {@link resolveTeacherIdFromRequest}. */
export function mergeTeacherScopeHeaders(
  teacherId: string | undefined,
  headers?: HeadersInit,
): HeadersInit {
  const tid = (teacherId?.trim() || getSupabaseDefaultTeacherId()).trim();
  const next = new Headers(headers ?? undefined);
  next.set(TEACHER_SCOPE_HEADER, tid);
  return next;
}
