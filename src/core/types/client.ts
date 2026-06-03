/** Stable identifier for a client record. */
export type ClientId = string;

/** Client profile for a service business. */
export interface Client {
  id: ClientId;
  /** Owning teacher (multi-tenant scope). */
  teacherId: string;
  fullName: string;
  phone: string;
  notes: string;
  customFields: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}
