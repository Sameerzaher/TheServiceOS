/** PostgREST / Postgres errors we treat as “column or relation missing”. */

export function isMissingRelationError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const maybeCode =
    "code" in error && typeof error.code === "string" ? error.code : "";
  const maybeMessage =
    "message" in error && typeof error.message === "string"
      ? error.message.toLowerCase()
      : "";
  return maybeCode === "PGRST205" || maybeMessage.includes("could not find the table");
}

export function isMissingColumnError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const maybeCode =
    "code" in error && typeof error.code === "string" ? error.code : "";
  const maybeMessage =
    "message" in error && typeof error.message === "string"
      ? error.message.toLowerCase()
      : "";
  return (
    maybeCode === "42703" ||
    maybeCode === "PGRST204" ||
    maybeMessage.includes("column") ||
    maybeMessage.includes("schema cache")
  );
}
