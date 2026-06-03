/** Minimal shapes for Calendar API JSON (no `googleapis` dependency). */
export namespace calendar_v3 {
  export interface Schema$EventDateTime {
    dateTime?: string | null;
    timeZone?: string | null;
  }

  export interface Schema$Event {
    summary?: string | null;
    description?: string | null;
    start?: Schema$EventDateTime | null;
    end?: Schema$EventDateTime | null;
  }
}
