import type { AppointmentRecord } from "@/core/types/appointment";
import type { AvailabilitySettings } from "@/core/types/availability";
import type { Client } from "@/core/types/client";
import type { AppSettings } from "@/core/types/settings";

/**
 * Persistence boundary for business domain data.
 * Production: Supabase (`createServiceStorage` when env is set). No localStorage for these entities.
 */
export interface ServiceStorage {
  loadClients(): Promise<Client[]>;
  persistClients(clients: Client[]): Promise<void>;
  loadAppointments(): Promise<AppointmentRecord[]>;
  persistAppointments(appointments: AppointmentRecord[]): Promise<void>;
  loadSettings(): Promise<AppSettings>;
  persistSettings(settings: AppSettings): Promise<void>;
  loadAvailabilitySettings(): Promise<AvailabilitySettings>;
  persistAvailabilitySettings(settings: AvailabilitySettings): Promise<void>;
}
