import { NextResponse } from "next/server";

export type PublicApiErrorBody = { ok: false; error: string };
export type PublicApiOkBody<T extends Record<string, unknown>> = {
  ok: true;
} & T;

export function jsonPublicError(
  status: number,
  message: string,
): NextResponse<PublicApiErrorBody> {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export function jsonPublicOk<T extends Record<string, unknown>>(
  data: T,
): NextResponse<PublicApiOkBody<T>> {
  return NextResponse.json({ ok: true, ...data } as PublicApiOkBody<T>);
}
