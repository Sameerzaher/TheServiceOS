import type { SupabaseClient } from "@supabase/supabase-js";

import { isMissingRelationError } from "@/core/repositories/supabase/postgrestErrors";

import type { GoogleCalendarIntegrationRow } from "./integrationTypes";
import { decryptRefreshToken, encryptRefreshToken } from "./tokenCrypto";

const TABLE = "teacher_google_calendar_integrations";

export async function getGoogleCalendarIntegration(
  supabase: SupabaseClient,
  businessId: string,
  teacherId: string,
): Promise<GoogleCalendarIntegrationRow | null> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("business_id", businessId)
    .eq("teacher_id", teacherId)
    .eq("provider", "google")
    .maybeSingle();

  if (error) {
    if (isMissingRelationError(error)) {
      console.warn(
        "[googleCalendar] integrations table missing — run migration 015_google_calendar_integration.sql",
      );
      return null;
    }
    console.error("[googleCalendar] get integration", error);
    return null;
  }
  return data as GoogleCalendarIntegrationRow | null;
}

export async function upsertGoogleCalendarIntegration(params: {
  supabase: SupabaseClient;
  businessId: string;
  teacherId: string;
  googleAccountEmail: string;
  refreshToken: string;
  accessToken?: string | null;
  accessTokenExpiresAt?: Date | null;
}): Promise<boolean> {
  const enc = encryptRefreshToken(params.refreshToken);
  if (!enc) return false;

  const now = new Date().toISOString();
  const row = {
    business_id: params.businessId,
    teacher_id: params.teacherId,
    provider: "google",
    google_account_email: params.googleAccountEmail,
    refresh_token_enc: enc,
    access_token: params.accessToken ?? null,
    access_token_expires_at: params.accessTokenExpiresAt?.toISOString() ?? null,
    calendar_id: "primary",
    sync_enabled: true,
    updated_at: now,
  };

  const { error } = await params.supabase.from(TABLE).upsert(row, {
    onConflict: "business_id,teacher_id,provider",
  });

  if (error) {
    if (isMissingRelationError(error)) {
      console.warn("[googleCalendar] upsert skipped — table missing");
      return false;
    }
    console.error("[googleCalendar] upsert", error);
    return false;
  }
  return true;
}

export async function deleteGoogleCalendarIntegration(
  supabase: SupabaseClient,
  businessId: string,
  teacherId: string,
): Promise<boolean> {
  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq("business_id", businessId)
    .eq("teacher_id", teacherId)
    .eq("provider", "google");

  if (error) {
    if (isMissingRelationError(error)) return false;
    console.error("[googleCalendar] delete", error);
    return false;
  }
  return true;
}

export async function updateIntegrationSyncMeta(
  supabase: SupabaseClient,
  businessId: string,
  teacherId: string,
  fields: {
    last_sync_at?: string;
    last_sync_status?: string | null;
    last_sync_error?: string | null;
    access_token?: string | null;
    access_token_expires_at?: string | null;
    sync_enabled?: boolean;
    description_template?: string | null;
    calendar_id?: string;
  },
): Promise<void> {
  const { error } = await supabase
    .from(TABLE)
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("business_id", businessId)
    .eq("teacher_id", teacherId)
    .eq("provider", "google");

  if (error && !isMissingRelationError(error)) {
    console.error("[googleCalendar] update meta", error);
  }
}

export function getRefreshTokenFromRow(
  row: GoogleCalendarIntegrationRow,
): string | null {
  return decryptRefreshToken(row.refresh_token_enc);
}
