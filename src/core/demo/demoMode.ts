import { loadFromStorage, saveToStorage } from "@/core/utils/storage";

const DEMO_MODE_KEY = "serviceos.demoMode";

export function isDemoModeActive(): boolean {
  return loadFromStorage<boolean>(DEMO_MODE_KEY) === true;
}

export function setDemoModeActive(active: boolean): void {
  saveToStorage(DEMO_MODE_KEY, active);
}
