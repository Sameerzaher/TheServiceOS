import type { Service } from "./service";

/** Localized or vertical-specific UI strings (keyed for flexibility). */
export type VerticalLabels = Record<string, string>;

export enum CustomFieldInputKind {
  Text = "text",
  TextArea = "textarea",
  Number = "number",
  Boolean = "boolean",
  Date = "date",
  Select = "select",
}

/** Describes one custom field shown on client or appointment forms. */
export interface CustomFieldDefinition {
  /** Stable key stored in `customFields` maps. */
  key: string;
  /** Display label (or i18n key resolved elsewhere). */
  label: string;
  kind: CustomFieldInputKind;
  required?: boolean;
  /** When `kind` is `Select`, allowed values. */
  options?: readonly string[];
}

/**
 * Configuration bundle for a business vertical (industry / product line).
 * Drives labels, extra fields, and starter services—not domain-specific logic.
 */
export interface VerticalPreset {
  /** Stable id for registry, storage namespacing, and future routing. */
  id: string;
  /** URL-safe slug (e.g. `driving`, `beauty`). */
  slug: string;
  /** Copy and terminology for this vertical (UI pulls from here). */
  labels: VerticalLabels;
  clientFields: readonly CustomFieldDefinition[];
  appointmentFields: readonly CustomFieldDefinition[];
  /**
   * Optional fields on the *public* booking form (plus shared name/phone/notes/slot).
   * Stored on the appointment row under `customFields`.
   */
  publicBookingFields: readonly CustomFieldDefinition[];
  defaultServices: readonly Service[];
}
