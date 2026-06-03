import type { ClientId } from "./client";

export enum AppointmentStatus {
  Scheduled = "scheduled",
  Confirmed = "confirmed",
  InProgress = "in_progress",
  Completed = "completed",
  Cancelled = "cancelled",
  NoShow = "no_show",
}

export enum PaymentStatus {
  Unpaid = "unpaid",
  Pending = "pending",
  Partial = "partial",
  Paid = "paid",
  Refunded = "refunded",
  Waived = "waived",
}

/** Stable identifier for a persisted appointment. */
export type AppointmentId = string;

/** Scheduled visit or job tied to a client. */
export interface Appointment {
  /** Owning teacher (multi-tenant scope). */
  teacherId: string;
  clientId: ClientId;
  /** ISO 8601 instant for the start of the appointment. */
  startAt: string;
  status: AppointmentStatus;
  paymentStatus: PaymentStatus;
  /** Charged amount in major currency units (e.g. ILS). */
  amount: number;
  customFields: Record<string, unknown>;
}

/** Appointment row stored locally (id + audit timestamps). */
export interface AppointmentRecord extends Appointment {
  id: AppointmentId;
  createdAt: string;
  updatedAt: string;
}
