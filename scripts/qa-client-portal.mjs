/**
 * Smoke QA for client-portal APIs (run while dev server is up).
 * Usage: node scripts/qa-client-portal.mjs
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const BASE = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, key);

async function fetchApi(path, cookie) {
  const res = await fetch(`${BASE}${path}`, {
    headers: cookie ? { Cookie: `client_session=${cookie}` } : {},
  });
  let body;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  return { status: res.status, body };
}

function pass(label) {
  console.log(`  PASS  ${label}`);
}
function fail(label, detail) {
  console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ""}`);
}

async function main() {
  console.log(`\nClient Portal QA @ ${BASE}\n`);

  // Unauthenticated
  for (const path of [
    "/api/client-portal/me",
    "/api/client-portal/appointments",
    "/api/client-portal/payment-history",
  ]) {
    const { status } = await fetchApi(path);
    status === 401 ? pass(`${path} → 401 without session`) : fail(`${path} → expected 401`, `got ${status}`);
  }

  // Active session
  const { data: sessions, error: sessErr } = await supabase
    .from("client_sessions")
    .select("token, client_id, expires_at")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1);

  if (sessErr || !sessions?.length) {
    console.log("\n  SKIP  No active client_session in DB — login manually to test authenticated routes\n");
    return;
  }

  const token = sessions[0].token;
  const clientId = sessions[0].client_id;
  console.log(`\nUsing session for client ${clientId}\n`);

  const me = await fetchApi("/api/client-portal/me", token);
  me.status === 200 && me.body?.ok ? pass("/api/client-portal/me → 200") : fail("/api/client-portal/me", JSON.stringify(me.body));

  const apts = await fetchApi("/api/client-portal/appointments", token);
  if (apts.status === 200 && apts.body?.ok) {
    pass(`/api/client-portal/appointments → 200 (${apts.body.appointments?.length ?? 0} rows)`);
    const bad = (apts.body.appointments ?? []).find((a) => a.teacher_id && !a.teacher);
    if (bad) fail("appointments teacher attach", `missing teacher for ${bad.id}`);
    else pass("appointments teacher attach");
  } else {
    fail("/api/client-portal/appointments", `${apts.status} ${JSON.stringify(apts.body)}`);
  }

  const pay = await fetchApi("/api/client-portal/payment-history", token);
  pay.status === 200 ? pass("/api/client-portal/payment-history → 200") : fail("/api/client-portal/payment-history", `${pay.status} ${JSON.stringify(pay.body)}`);

  const book = await fetchApi("/api/client-portal/book-appointment", token);
  book.status === 200 && Array.isArray(book.body?.teachers)
    ? pass(`/api/client-portal/book-appointment → 200 (${book.body.teachers.length} teachers)`)
    : fail("/api/client-portal/book-appointment", `${book.status} ${JSON.stringify(book.body)}`);

  // Stripe checkout — only if unpaid appointment exists
  const unpaid = (apts.body?.appointments ?? []).find(
    (a) => a.amount > 0 && a.payment_status !== "paid",
  );
  if (unpaid) {
    const checkoutRes = await fetch(`${BASE}/api/client-portal/payments/checkout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `client_session=${token}`,
      },
      body: JSON.stringify({ appointmentId: unpaid.id }),
    });
    const checkoutBody = await checkoutRes.json().catch(() => ({}));
    if (checkoutRes.status === 200 && checkoutBody.url) {
      pass("payments/checkout → Stripe URL created");
    } else if (checkoutRes.status === 503) {
      pass("payments/checkout → 503 (Stripe not configured — expected in dev)");
    } else {
      fail("payments/checkout", `${checkoutRes.status} ${JSON.stringify(checkoutBody)}`);
    }
  } else {
    console.log("  SKIP  payments/checkout — no unpaid appointment");
  }

  // Env checks (no secrets printed)
  const envChecks = [
    ["NEXT_PUBLIC_SUPABASE_URL", !!process.env.NEXT_PUBLIC_SUPABASE_URL],
    ["SUPABASE_SERVICE_ROLE_KEY", !!process.env.SUPABASE_SERVICE_ROLE_KEY],
    ["NEXT_PUBLIC_APP_URL", !!process.env.NEXT_PUBLIC_APP_URL],
    ["STRIPE_SECRET_KEY", !!process.env.STRIPE_SECRET_KEY],
    ["STRIPE_WEBHOOK_SECRET", !!process.env.STRIPE_WEBHOOK_SECRET],
    ["RESEND_API_KEY", !!process.env.RESEND_API_KEY],
  ];
  console.log("\nEnv:");
  for (const [name, ok] of envChecks) {
    console.log(`  ${ok ? "OK" : "MISS"}  ${name}`);
  }
  console.log("");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
