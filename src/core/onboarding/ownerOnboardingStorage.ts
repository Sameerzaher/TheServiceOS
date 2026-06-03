import type { BusinessType } from "@/core/types/teacher";
import type { WeekdayKey } from "@/core/types/availability";
import { loadFromStorage, saveToStorage } from "@/core/utils/storage";
import { DEFAULT_ONBOARDING_WORK_DAYS } from "./weeklyDefaults";

const STORAGE_KEY = "serviceos.ownerOnboarding.v1";

export type OwnerOnboardingStep = 1 | 2 | 3 | 4;

export type OwnerOnboardingDraft = {
  step: OwnerOnboardingStep;
  /** Stable scope — must match logged-in teacher */
  teacherId: string;
  businessName: string;
  businessType: BusinessType;
  phone: string;
  slug: string;
  workStart: string;
  workEnd: string;
  workDays: WeekdayKey[];
  slotDurationMinutes: number;
  bookingEnabled: boolean;
  serviceName: string;
  servicePrice: number;
  clientName: string;
  clientPhone: string;
};

export function defaultOwnerDraft(teacherId: string): OwnerOnboardingDraft {
  return {
    step: 1,
    teacherId,
    businessName: "",
    businessType: "driving_instructor",
    phone: "",
    slug: "",
    workStart: "09:00",
    workEnd: "17:00",
    workDays: [...DEFAULT_ONBOARDING_WORK_DAYS],
    slotDurationMinutes: 45,
    bookingEnabled: true,
    serviceName: "",
    servicePrice: 150,
    clientName: "",
    clientPhone: "",
  };
}

export function loadOwnerOnboardingDraft(
  teacherId: string,
): OwnerOnboardingDraft | null {
  const raw = loadFromStorage<unknown>(STORAGE_KEY);
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Partial<OwnerOnboardingDraft>;
  if (o.teacherId !== teacherId) return null;
  return o as OwnerOnboardingDraft;
}

export function saveOwnerOnboardingDraft(draft: OwnerOnboardingDraft): void {
  saveToStorage(STORAGE_KEY, draft);
}

export function clearOwnerOnboardingDraft(): void {
  try {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    /* ignore */
  }
}
