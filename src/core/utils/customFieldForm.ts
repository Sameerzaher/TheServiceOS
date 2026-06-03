import {
  CustomFieldInputKind,
  type CustomFieldDefinition,
} from "@/core/types/vertical";

/** Hydrates string state for custom field controls from stored `customFields`. */
export function customFieldsToRaw(
  defs: readonly CustomFieldDefinition[],
  fields: Record<string, unknown>,
): Record<string, string> {
  const next: Record<string, string> = {};
  for (const def of defs) {
    const v = fields[def.key];
    if (v === undefined || v === null) {
      next[def.key] = "";
      continue;
    }
    if (def.kind === CustomFieldInputKind.Boolean) {
      next[def.key] = v === true ? "true" : "";
      continue;
    }
    next[def.key] = String(v);
  }
  return next;
}
