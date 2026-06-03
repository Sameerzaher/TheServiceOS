import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import {
  getPublicSupabaseAnonKey,
  getPublicSupabaseUrl,
} from "@/config/env.public";

/**
 * Browser Supabase client (anon key + RLS only). Never import service-role modules from files that use this.
 */
let browserClient: SupabaseClient | null = null;

export function createBrowserSupabaseClient(): SupabaseClient {
  if (browserClient) return browserClient;
  const url = getPublicSupabaseUrl();
  const anonKey = getPublicSupabaseAnonKey();
  if (!url || !anonKey) {
    throw new Error(
      "Supabase public env missing: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }
  browserClient = createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  return browserClient;
}

export const getSupabaseBrowserClient = createBrowserSupabaseClient;
