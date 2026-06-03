/** Stable identifier for a teacher profile. */
export type TeacherId = string;

/** Pilot vertical — drives labels, booking fields, and dashboards. */
export type BusinessType = "driving_instructor" | "cosmetic_clinic";

export const DEFAULT_BUSINESS_TYPE: BusinessType = "driving_instructor";

export function coerceBusinessType(raw: unknown): BusinessType {
  if (raw === "driving_instructor" || raw === "cosmetic_clinic") {
    return raw;
  }
  return DEFAULT_BUSINESS_TYPE;
}

/** User role for authentication */
export type UserRole = "admin" | "user";

/**
 * Teacher (instructor) profile — public-facing fields for landing / booking by slug.
 * Teachers ARE users - they login with email/password
 */
export interface Teacher {
  id: TeacherId;
  fullName: string;
  businessName: string;
  phone: string;
  /** URL-safe handle; must be unique in storage (see DB constraint). */
  slug: string;
  /** Industry mode for this profile (DB `business_type`). */
  businessType: BusinessType;
  createdAt: string;
  // Auth fields
  email: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt: string | null;
}

export interface Session {
  id: string;
  teacherId: string;
  token: string;
  expiresAt: string;
  createdAt: string;
  ipAddress: string | null;
  userAgent: string | null;
}

export interface AuthTeacher {
  teacher: Teacher;
  token: string;
}

export type LoginInput = {
  email: string;
  password: string;
};

export type SignupTeacherInput = {
  email: string;
  password: string;
  fullName: string;
  businessName: string;
  phone: string;
  slug: string;
  businessType: BusinessType;
  role?: UserRole;
};

