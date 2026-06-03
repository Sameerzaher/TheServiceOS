export type GoogleCalendarIntegrationRow = {
  id: string;
  business_id: string;
  teacher_id: string;
  provider: string;
  google_account_email: string | null;
  refresh_token_enc: string;
  access_token: string | null;
  access_token_expires_at: string | null;
  calendar_id: string;
  sync_enabled: boolean;
  description_template: string | null;
  last_sync_at: string | null;
  last_sync_status: string | null;
  last_sync_error: string | null;
  created_at: string;
  updated_at: string;
};
