import {
  getSupabaseBusinessId,
  getSupabaseDefaultTeacherId,
} from "@/core/config/supabaseEnv";
import * as appSettingsRepo from "@/core/repositories/supabase/appSettingsRepository";
import * as appointmentsRepo from "@/core/repositories/supabase/appointmentsRepository";
import * as clientsRepo from "@/core/repositories/supabase/clientsRepository";
import type { ServiceStorage } from "@/core/types/serviceStorage";
import {
  normalizeAvailabilitySettings,
  type AvailabilitySettings,
} from "@/core/types/availability";
import { getSupabaseBrowserClient } from "@/lib/supabase/browserClient";
import { mergeTeacherScopeHeaders } from "@/lib/api/teacherScopeHeaders";

import { createWriteQueue } from "./writeQueue";

const writeQueue = createWriteQueue();

export function createSupabaseStorageAdapter(
  teacherId: string = getSupabaseDefaultTeacherId(),
): ServiceStorage {
  const supabase = getSupabaseBrowserClient();
  const businessId = getSupabaseBusinessId();

  return {
    loadClients: () => clientsRepo.loadClients(supabase, businessId, teacherId),

    persistClients: (clients) =>
      writeQueue.run(() =>
        clientsRepo.persistClients(supabase, businessId, teacherId, clients),
      ),

    loadAppointments: () =>
      appointmentsRepo.loadAppointments(supabase, businessId, teacherId),

    persistAppointments: (appointments) =>
      writeQueue.run(() =>
        appointmentsRepo.persistAppointments(
          supabase,
          businessId,
          teacherId,
          appointments,
        ),
      ),

    loadSettings: () =>
      appSettingsRepo.loadAppSettings(supabase, businessId, teacherId),

    persistSettings: (settings) =>
      writeQueue.run(() =>
        appSettingsRepo.persistAppSettings(
          supabase,
          businessId,
          teacherId,
          settings,
        ),
      ),

    /**
     * Availability uses `/api/availability-settings` + service role so writes are not
     * blocked by RLS on `booking_settings` (browser only has the anon key).
     */
    loadAvailabilitySettings: async () => {
      const res = await fetch("/api/availability-settings", {
        headers: mergeTeacherScopeHeaders(teacherId),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        settings?: unknown;
      };
      if (!res.ok || data.ok !== true) {
        throw new Error(
          typeof data.error === "string" && data.error.length > 0
            ? data.error
            : `Availability load failed (${res.status})`,
        );
      }
      return normalizeAvailabilitySettings({
        ...(typeof data.settings === "object" &&
        data.settings !== null &&
        !Array.isArray(data.settings)
          ? (data.settings as Record<string, unknown>)
          : {}),
        teacherId,
      });
    },

    persistAvailabilitySettings: (settings: AvailabilitySettings) =>
      writeQueue.run(async () => {
        const res = await fetch("/api/availability-settings", {
          method: "PUT",
          headers: mergeTeacherScopeHeaders(teacherId, {
            "Content-Type": "application/json",
          }),
          body: JSON.stringify(settings),
        });
        const data = (await res.json()) as { ok?: boolean; error?: string };
        if (!res.ok || data.ok !== true) {
          throw new Error(
            typeof data.error === "string" && data.error.length > 0
              ? data.error
              : `Availability persist failed (${res.status})`,
          );
        }
      }),
  };
}
