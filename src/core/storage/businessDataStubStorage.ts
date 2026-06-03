import type { ServiceStorage } from "@/core/types/serviceStorage";
import {
  normalizeAvailabilitySettings,
  type AvailabilitySettings,
} from "@/core/types/availability";
import {
  DEFAULT_APP_SETTINGS,
  normalizeAppSettings,
  type AppSettings,
} from "@/core/types/settings";

/**
 * In-memory defaults when Supabase env is missing. Business entities are not persisted locally.
 */
export const businessDataStubStorage: ServiceStorage = {
  async loadClients() {
    return [];
  },
  async persistClients() {
    /* no-op: configure Supabase for persistence */
  },
  async loadAppointments() {
    return [];
  },
  async persistAppointments() {
    /* no-op */
  },
  async loadSettings(): Promise<AppSettings> {
    return normalizeAppSettings({ ...DEFAULT_APP_SETTINGS });
  },
  async persistSettings() {
    /* no-op */
  },
  async loadAvailabilitySettings(): Promise<AvailabilitySettings> {
    return normalizeAvailabilitySettings({ bookingEnabled: false });
  },
  async persistAvailabilitySettings() {
    /* no-op */
  },
};
