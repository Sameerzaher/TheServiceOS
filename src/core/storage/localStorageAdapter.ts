import type { ServiceStorage } from "@/core/types/serviceStorage";

import { businessDataStubStorage } from "./businessDataStubStorage";

/**
 * Legacy export name. Domain entities (clients, appointments, settings, availability)
 * are **not** stored in `localStorage`; use Supabase via `createServiceStorage()`.
 */
export const localStorageAdapter: ServiceStorage = businessDataStubStorage;
