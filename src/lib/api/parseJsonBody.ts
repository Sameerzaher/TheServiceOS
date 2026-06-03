/**
 * Safe JSON body parse for API routes — never throws; does not log raw body (may contain PII).
 */
export async function parseJsonBody(
  req: Request,
): Promise<{ ok: true; data: unknown } | { ok: false }> {
  try {
    const data = await req.json();
    return { ok: true, data };
  } catch {
    return { ok: false };
  }
}
