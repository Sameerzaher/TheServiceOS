import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

export type TeacherSummary = {
  id: string;
  full_name: string;
  business_name: string | null;
  phone: string | null;
};

/** Loads teacher rows by id (no PostgREST embed — works without FK). */
export async function fetchTeachersByIds(
  supabase: SupabaseClient,
  teacherIds: string[],
): Promise<Map<string, TeacherSummary>> {
  const unique = Array.from(new Set(teacherIds.filter(Boolean)));
  const map = new Map<string, TeacherSummary>();
  if (unique.length === 0) return map;

  const { data: teachers } = await supabase
    .from("teachers")
    .select("id, full_name, business_name, phone")
    .in("id", unique);

  for (const teacher of teachers ?? []) {
    map.set(teacher.id, teacher as TeacherSummary);
  }

  return map;
}

export async function attachTeachers<T extends { teacher_id?: string | null }>(
  supabase: SupabaseClient,
  rows: T[],
): Promise<Array<T & { teacher: TeacherSummary | null }>> {
  const teachers = await fetchTeachersByIds(
    supabase,
    rows.map((row) => row.teacher_id ?? ""),
  );

  return rows.map((row) => ({
    ...row,
    teacher: row.teacher_id ? teachers.get(row.teacher_id) ?? null : null,
  }));
}
