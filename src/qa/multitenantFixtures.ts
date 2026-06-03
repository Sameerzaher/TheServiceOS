/**
 * Stable QA identifiers for multi-tenant manual / scripted checks.
 * Align `supabase/seed_qa_multitenant.sql` with these UUIDs and slugs.
 *
 * Default MVP teacher (`00000000-...-0002`) usually exists from migrations;
 * these two are **additional** teachers for isolation testing.
 */

import { DEFAULT_MVP_BUSINESS_ID } from "@/core/config/supabaseEnv";

/** QA Teacher A — use for “first” isolation bucket. */
export const QA_TEACHER_ALPHA_ID = "550e8400-e29b-41d4-a716-446655440101";

/** QA Teacher B — use for “second” isolation bucket. */
export const QA_TEACHER_BETA_ID = "550e8400-e29b-41d4-a716-446655440102";

export const QA_TEACHER_ALPHA_SLUG = "qa-alpha";

export const QA_TEACHER_BETA_SLUG = "qa-beta";

export type QaTeacherFixture = {
  id: string;
  slug: string;
  fullName: string;
  businessName: string;
  phone: string;
};

export const QA_TEACHER_FIXTURES: readonly QaTeacherFixture[] = [
  {
    id: QA_TEACHER_ALPHA_ID,
    slug: QA_TEACHER_ALPHA_SLUG,
    fullName: "QA Teacher Alpha",
    businessName: "QA Studio Alpha",
    phone: "050-0000001",
  },
  {
    id: QA_TEACHER_BETA_ID,
    slug: QA_TEACHER_BETA_SLUG,
    fullName: "QA Teacher Beta",
    businessName: "QA Studio Beta",
    phone: "050-0000002",
  },
] as const;

export function getQaFixtureBySlug(slug: string): QaTeacherFixture | undefined {
  const s = slug.trim().toLowerCase();
  return QA_TEACHER_FIXTURES.find((t) => t.slug === s);
}

export function getQaFixtureById(id: string): QaTeacherFixture | undefined {
  const t = id.trim().toLowerCase();
  return QA_TEACHER_FIXTURES.find((x) => x.id.toLowerCase() === t);
}

/** MVP business id (must match env / RLS). */
export const QA_BUSINESS_ID = DEFAULT_MVP_BUSINESS_ID;
