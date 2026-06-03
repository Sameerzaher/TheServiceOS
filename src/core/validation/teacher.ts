/**
 * Validation for teacher create/update payloads (domain rules only).
 * Slug uniqueness is enforced by the database (`UNIQUE (slug)`).
 */

import type { Teacher } from "@/core/types/teacher";

export type TeacherDraftFields = Pick<
  Teacher,
  "fullName" | "businessName" | "phone" | "slug"
>;

/** URL-safe slug: lowercase, digits, single hyphens between segments. */
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const MAX_PUBLIC_SLUG_LEN = 128;

/** True when `raw` is a non-empty normalized public URL segment for `/book/[slug]`. */
export function isValidPublicTeacherSlug(raw: string): boolean {
  const s = normalizeTeacherSlug(raw);
  return (
    s.length > 0 &&
    s.length <= MAX_PUBLIC_SLUG_LEN &&
    SLUG_PATTERN.test(s)
  );
}

export type TeacherFieldKey = keyof TeacherDraftFields;

export type TeacherFieldErrors = Partial<Record<TeacherFieldKey, string>>;

export function normalizeTeacherSlug(raw: string): string {
  return raw.trim().toLowerCase();
}

export function validateTeacherDraft(input: TeacherDraftFields): TeacherFieldErrors {
  const errors: TeacherFieldErrors = {};

  const fullName = input.fullName.trim();
  if (fullName.length === 0) {
    errors.fullName = "Full name is required.";
  }

  const businessName = input.businessName.trim();
  if (businessName.length === 0) {
    errors.businessName = "Business name is required.";
  }

  const phone = input.phone.trim();
  if (phone.length === 0) {
    errors.phone = "Phone is required.";
  }

  const slug = normalizeTeacherSlug(input.slug);
  if (slug.length === 0) {
    errors.slug = "Slug is required.";
  } else if (!SLUG_PATTERN.test(slug)) {
    errors.slug =
      "Use lowercase letters, numbers, and single hyphens only (e.g. dana-cohen).";
  }

  return errors;
}

export function teacherDraftHasErrors(errors: TeacherFieldErrors): boolean {
  return Object.keys(errors).length > 0;
}
