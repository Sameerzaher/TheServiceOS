export type { ServiceStorage } from "@/core/types/serviceStorage";
export { businessDataStubStorage } from "./businessDataStubStorage";
export { createServiceStorage } from "./createServiceStorage";
export { isSupabaseConfigured, getSupabaseBusinessId } from "@/core/config/supabaseEnv";
export { localStorageAdapter } from "./localStorageAdapter";
export { StorageBootstrapNotifier } from "./StorageBootstrapNotifier";
export { StorageProvider, useServiceStorage } from "./StorageContext";
