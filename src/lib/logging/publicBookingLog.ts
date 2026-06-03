type Level = "debug" | "info" | "warn" | "error";

function prefix(level: Level, msg: string, meta?: Record<string, unknown>) {
  const line = `[public-booking] ${msg}`;
  if (meta && Object.keys(meta).length > 0) {
    return { line, meta };
  }
  return { line };
}

/** Structured prefix logs; avoids leaking full payloads (PII) in production. */
export const publicBookingLog = {
  debug(msg: string, meta?: Record<string, unknown>) {
    if (process.env.NODE_ENV === "development") {
      console.debug(prefix("debug", msg, meta).line, meta ?? "");
    }
  },
  info(msg: string, meta?: Record<string, unknown>) {
    if (process.env.NODE_ENV === "development") {
      console.log(prefix("info", msg, meta).line, meta ?? "");
    }
  },
  warn(msg: string, meta?: Record<string, unknown>) {
    console.warn(prefix("warn", msg, meta).line, meta ?? "");
  },
  error(msg: string, meta?: Record<string, unknown>) {
    console.error(prefix("error", msg, meta).line, meta ?? "");
  },
};
