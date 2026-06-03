import { loadFromStorage, saveToStorage } from "@/core/utils/storage";

const FIRST_RUN_KEY = "serviceos.firstRunOnboarding";

export interface FirstRunOnboardingState {
  dismissed: boolean;
  remindersReviewed: boolean;
}

const DEFAULT_STATE: FirstRunOnboardingState = {
  dismissed: false,
  remindersReviewed: false,
};

export function loadFirstRunOnboardingState(): FirstRunOnboardingState {
  const raw = loadFromStorage<unknown>(FIRST_RUN_KEY);
  if (!raw || typeof raw !== "object") return DEFAULT_STATE;
  const next = raw as Partial<FirstRunOnboardingState>;
  return {
    dismissed: next.dismissed === true,
    remindersReviewed: next.remindersReviewed === true,
  };
}

export function saveFirstRunOnboardingState(
  next: FirstRunOnboardingState,
): void {
  saveToStorage(FIRST_RUN_KEY, next);
}

