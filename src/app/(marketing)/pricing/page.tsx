"use client";

import Link from "next/link";
import { WhatsAppCtaLink } from "@/components/marketing/WhatsAppCtaLink";
import { PRODUCT_BRANDING } from "@/config/branding";
import { Button, ui } from "@/components/ui";

const PRICING_PLANS = [
  {
    id: "free",
    name: "ניסיון חינם",
    price: 0,
    period: "14 יום",
    description: "התנסו במערכת ללא התחייבות",
    features: [
      { text: "כל התכונות", included: true },
      { text: "תורים בלתי מוגבלים", included: true },
      { text: "לקוחות בלתי מוגבלים", included: true },
      { text: "התראות ווטסאפ", included: true },
      { text: "סנכרון Google Calendar", included: true },
      { text: "תמיכה טכנית", included: true },
      { text: "ללא כרטיס אשראי", included: true },
    ],
    cta: "התחל ניסיון חינם",
    ctaVariant: "secondary" as const,
    popular: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: 99,
    period: "לחודש",
    description: "מושלם לעסקים קטנים ובינוניים",
    features: [
      { text: "תורים בלתי מוגבלים", included: true },
      { text: "לקוחות בלתי מוגבלים", included: true },
      { text: "התראות ווטסאפ בלתי מוגבלות", included: true },
      { text: "סנכרון Google Calendar", included: true },
      { text: "דוחות ותובנות", included: true },
      { text: "דף הזמנה מותאם אישית", included: true },
      { text: "תמיכה טכנית מהירה", included: true },
      { text: "גיבוי אוטומטי יומי", included: true },
    ],
    cta: "התחל עכשיו",
    ctaVariant: "primary" as const,
    popular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: null,
    period: "מותאם אישית",
    description: "לעסקים גדולים ורשתות",
    features: [
      { text: "כל התכונות של Pro", included: true },
      { text: "מספר עסקים בלתי מוגבל", included: true },
      { text: "API מלא", included: true },
      { text: "אינטגרציות מותאמות", included: true },
      { text: "מנהל חשבון ייעודי", included: true },
      { text: "הדרכה אישית", included: true },
      { text: "תמיכה עדיפות 24/7", included: true },
      { text: "SLA מובטח", included: true },
    ],
    cta: "צור קשר",
    ctaVariant: "secondary" as const,
    popular: false,
  },
] as const;

const FAQ = [
  {
    q: "האם יש תקופת ניסיון?",
    a: "כן! אנחנו מציעים 14 יום ניסיון חינם ללא צורך בכרטיס אשראי. תוכלו לנסות את כל התכונות בחינם.",
  },
  {
    q: "איך משלמים?",
    a: "אנחנו מקבלים תשלום בכרטיס אשראי (ויזה/מאסטרקארד), PayPal, והעברה בנקאית. החיוב חודשי ואוטומטי.",
  },
  {
    q: "האם אפשר לבטל בכל עת?",
    a: "בהחלט! אין התחייבות. תוכלו לבטל את המנוי בכל רגע מההגדרות. לא נחייב אתכם יותר מרגע הביטול.",
  },
  {
    q: "מה כולל התמחור?",
    a: "המחיר כולל את כל התכונות: תורים בלתי מוגבלים, לקוחות בלתי מוגבלים, התראות ווטסאפ, סנכרון יומן, ותמיכה טכנית.",
  },
  {
    q: "האם יש הגבלה על מספר התורים?",
    a: "לא! אין כל הגבלה. תוכלו לקבוע כמה תורים שתרצו, עם כמה לקוחות שתרצו.",
  },
  {
    q: "מה ההבדל בין Pro ל-Enterprise?",
    a: "Enterprise מיועד לעסקים גדולים עם צרכים מיוחדים: מספר עסקים, API, אינטגרציות מותאמות, ותמיכה ייעודית.",
  },
  {
    q: "האם הנתונים שלי מאובטחים?",
    a: "כן! אנחנו משתמשים בהצפנת SSL, גיבויים יומיים, ומאחסנים את הנתונים בשרתים מאובטחים בישראל.",
  },
  {
    q: "האם יש מחיר מיוחד למורי נהיגה?",
    a: "כן! אנחנו מציעים הנחה של 20% למורי נהיגה שמירשמים עד 31/12/2024. צרו קשר לפרטים.",
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      {/* Header */}
      <header className="border-b border-neutral-200 bg-white">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-3xl">{PRODUCT_BRANDING.icon}</span>
            <span className="text-xl font-bold text-emerald-600">
              {PRODUCT_BRANDING.name}
            </span>
          </Link>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <WhatsAppCtaLink
              variant="nav"
              prefillMessage="היי, יש לי שאלה על התמחור של תור פה 💬"
              className="hidden sm:inline-flex"
            >
              ווטסאפ
            </WhatsAppCtaLink>
            <Link href="/demo">
              <Button variant="secondary">דמו</Button>
            </Link>
            <Link href="/login">
              <Button variant="primary">התחבר</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h1 className="mb-4 text-5xl font-bold text-neutral-900">
          תמחור פשוט ושקוף
        </h1>
        <p className="mx-auto max-w-2xl text-xl text-neutral-600">
          בחרו את התוכנית שמתאימה לכם. התחילו בחינם וללא התחייבות.
        </p>
      </section>

      {/* Pricing Cards */}
      <section className="container mx-auto px-4 pb-16">
        <div className="grid gap-8 lg:grid-cols-3">
          {PRICING_PLANS.map((plan) => (
            <div
              key={plan.id}
              className={
                ui.card +
                " relative p-8 transition-all " +
                (plan.popular
                  ? "border-2 border-emerald-600 shadow-xl"
                  : "border border-neutral-200")
              }
            >
              {plan.popular && (
                <div className="absolute right-4 top-0 -translate-y-1/2 rounded-full bg-emerald-600 px-4 py-1 text-sm font-semibold text-white">
                  המומלץ ביותר ⭐
                </div>
              )}

              <div className="mb-6">
                <h3 className="mb-2 text-2xl font-bold text-neutral-900">
                  {plan.name}
                </h3>
                <p className="text-sm text-neutral-600">{plan.description}</p>
              </div>

              <div className="mb-6">
                {plan.price !== null ? (
                  <>
                    <div className="flex items-baseline gap-1">
                      <span className="text-5xl font-bold text-neutral-900">
                        ₪{plan.price}
                      </span>
                      <span className="text-neutral-600">/ {plan.period}</span>
                    </div>
                  </>
                ) : (
                  <div className="text-3xl font-bold text-neutral-900">
                    מחיר מותאם אישית
                  </div>
                )}
              </div>

              <ul className="mb-8 space-y-3">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span
                      className={
                        feature.included
                          ? "text-emerald-600"
                          : "text-neutral-400"
                      }
                    >
                      {feature.included ? "✓" : "✗"}
                    </span>
                    <span
                      className={
                        feature.included
                          ? "text-neutral-800"
                          : "text-neutral-400 line-through"
                      }
                    >
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                href={
                  plan.id === "enterprise"
                    ? "/contact"
                    : plan.id === "free"
                      ? "/demo"
                      : "/signup"
                }
              >
                <Button variant={plan.ctaVariant} className="w-full">
                  {plan.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-emerald-50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center text-3xl font-bold text-neutral-900">
            שאלות נפוצות
          </h2>
          <div className="mx-auto max-w-3xl space-y-6">
            {FAQ.map((item, idx) => (
              <div key={idx} className={ui.card + " p-6"}>
                <h3 className="mb-2 text-lg font-semibold text-neutral-900">
                  {item.q}
                </h3>
                <p className="text-neutral-600">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h2 className="mb-4 text-3xl font-bold text-neutral-900">
          מוכנים להתחיל?
        </h2>
        <p className="mx-auto mb-8 max-w-2xl text-xl text-neutral-600">
          הצטרפו ל-{PRODUCT_BRANDING.socialProof.activeBusinesses} עסקים שכבר מנהלים תורים בצורה חכמה
        </p>
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link href="/signup">
            <Button variant="primary" className="px-12 py-4 text-lg">
              התחל 14 יום בחינם 🚀
            </Button>
          </Link>
          <WhatsAppCtaLink
            variant="soft"
            className="px-10 py-3.5 text-base"
            prefillMessage="היי, אשמח לייעוץ קצר לפני שאני נרשם — מה כלול ב-Pro?"
          >
            שאלו אותנו בווטסאפ
          </WhatsAppCtaLink>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-200 bg-neutral-50 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-neutral-600">
          <p>© {new Date().getFullYear()} {PRODUCT_BRANDING.name}. כל הזכויות שמורות.</p>
          <div className="mt-2 flex justify-center gap-4">
            <Link href="/help" className="hover:text-emerald-600">עזרה</Link>
            <Link href="/contact" className="hover:text-emerald-600">צור קשר</Link>
            <Link href="/terms" className="hover:text-emerald-600">תנאי שימוש</Link>
            <Link href="/privacy" className="hover:text-emerald-600">מדיניות פרטיות</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
