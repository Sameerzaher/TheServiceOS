"use client";

import Link from "next/link";
import { useState } from "react";
import { WhatsAppCtaLink } from "@/components/marketing/WhatsAppCtaLink";
import { PRODUCT_BRANDING } from "@/config/branding";
import { Button, ui } from "@/components/ui";

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState<string>("driving_instructor");

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white">
      {/* Hero Section */}
      <header className="border-b border-emerald-100 bg-white/80 backdrop-blur-sm">
        <nav className="container mx-auto flex items-center justify-between px-4 py-6">
          <div className="flex items-center gap-3">
            <span className="text-5xl">{PRODUCT_BRANDING.icon}</span>
            <div>
              <span className="block text-3xl font-black text-emerald-600">
                {PRODUCT_BRANDING.name}
              </span>
              <span className="text-xs text-neutral-500">{PRODUCT_BRANDING.nameEn}</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
            <WhatsAppCtaLink
              variant="nav"
              prefillMessage="היי, אשמח לשמוע איך תור פה עוזר לעסק שלי 💬"
              className="hidden sm:inline-flex"
            >
              ווטסאפ
            </WhatsAppCtaLink>
            <Link href="/demo">
              <Button variant="secondary" className="shadow-sm">נסה דמו</Button>
            </Link>
            <Link href="/login">
              <Button variant="primary" className="shadow-md">התחבר</Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Content */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="mb-5 flex flex-wrap items-center justify-center gap-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700">
            <span>🎉</span>
            <span>חדש! תמיכה במספר עסקים</span>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-white/90 px-4 py-2 text-xs font-semibold text-emerald-800 shadow-sm sm:text-sm">
            <span aria-hidden>⚡</span>
            <span>
              {PRODUCT_BRANDING.setupTimeLabelHe}
              <span className="mx-1 text-neutral-400">·</span>
              <span className="font-medium text-neutral-600">{PRODUCT_BRANDING.setupTimeLabel}</span>
            </span>
          </div>
        </div>
        <h1 className="mx-auto max-w-4xl bg-gradient-to-br from-neutral-900 via-emerald-800 to-emerald-600 bg-clip-text text-6xl font-black leading-tight text-transparent md:text-7xl">
          {PRODUCT_BRANDING.tagline}
        </h1>
        <p className="mx-auto mt-8 max-w-2xl text-xl leading-relaxed text-neutral-600">
          הפסיקו לאבד זמן על ניהול יומנים ידני. תנו ללקוחות שלכם לקבוע תורים בעצמם
          24/7 ותתמקדו במה שחשוב באמת - <span className="font-semibold text-emerald-600">העסק שלכם</span>.
        </p>
        <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row sm:flex-wrap">
          <Link href="/signup">
            <Button variant="primary" className="px-10 py-5 text-lg font-semibold shadow-xl hover:shadow-2xl">
              התחל בחינם היום 🚀
            </Button>
          </Link>
          <WhatsAppCtaLink
            variant="soft"
            className="px-8 py-4 text-base"
            prefillMessage="היי, רוצה להבין איך זה עוזר לי לקבל יותר לקוחות בלי טלפונים 🔥"
          >
            דברו איתי בווטסאפ
          </WhatsAppCtaLink>
          <Link href="/demo">
            <Button variant="secondary" className="px-10 py-5 text-lg shadow-md">
              צפה בדמו
            </Button>
          </Link>
        </div>
        <p className="mt-6 text-sm text-neutral-500">
          ללא כרטיס אשראי • 14 יום ניסיון בחינם • ביטול בכל עת
        </p>
      </section>

      {/* Social Proof */}
      <section className="border-y border-neutral-200 bg-gradient-to-r from-white via-emerald-50/30 to-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-12 text-center md:gap-20">
            <div className="group cursor-default transition-transform hover:scale-110">
              <div className="mb-2 text-4xl font-black text-emerald-600">
                {PRODUCT_BRANDING.socialProof.activeBusinesses}
              </div>
              <div className="text-sm font-medium text-neutral-600">עסקים פעילים</div>
            </div>
            <div className="group cursor-default transition-transform hover:scale-110">
              <div className="mb-2 text-4xl font-black text-emerald-600">
                {PRODUCT_BRANDING.socialProof.monthlyBookings}
              </div>
              <div className="text-sm font-medium text-neutral-600">תורים חודשיים</div>
            </div>
            <div className="group cursor-default transition-transform hover:scale-110">
              <div className="mb-2 text-4xl font-black text-emerald-600">
                ⭐ {PRODUCT_BRANDING.socialProof.avgRating}
              </div>
              <div className="text-sm font-medium text-neutral-600">דירוג ממוצע</div>
            </div>
          </div>
        </div>
      </section>

      {/* Target Audiences */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="mb-4 text-center text-4xl font-bold text-neutral-900">
          מי מתאים ל-{PRODUCT_BRANDING.name}?
        </h2>
        <p className="mx-auto mb-16 max-w-2xl text-center text-lg text-neutral-600">
          נבנה במיוחד עבור ספקי שירותים שעובדים עם לקוחות באופן אישי
        </p>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {PRODUCT_BRANDING.audiences.map((audience) => (
            <div
              key={audience.id}
              className="group cursor-pointer overflow-hidden rounded-2xl border border-neutral-200 bg-white p-8 text-center shadow-sm transition-all hover:-translate-y-2 hover:border-emerald-300 hover:shadow-xl"
            >
              <div className="mb-4 text-6xl transition-transform group-hover:scale-110">
                {audience.icon}
              </div>
              <h3 className="text-xl font-bold text-neutral-900">
                {audience.label}
              </h3>
            </div>
          ))}
        </div>
      </section>

      {/* Owner benefits — emotional sell */}
      <section className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 py-20">
        <div className="container mx-auto px-4">
          <h2 className="mb-4 text-center text-4xl font-bold text-white">
            למה בעלי עסקים בוחרים ב-{PRODUCT_BRANDING.name}?
          </h2>
          <p className="mx-auto mb-14 max-w-2xl text-center text-lg text-emerald-50">
            לא עוד &quot;מערכת&quot; — פחות ריצות, יותר הכנסה. בלי לחץ, בלי בלבול.
          </p>
          <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
            {PRODUCT_BRANDING.ownerPitchBenefits.map((b) => (
              <div
                key={b.headline}
                className="rounded-2xl bg-white/95 p-8 shadow-xl shadow-emerald-900/10 backdrop-blur-sm transition-all hover:-translate-y-1 hover:bg-white"
              >
                <div className="mb-4 text-4xl" aria-hidden>
                  {b.icon}
                </div>
                <h3 className="text-2xl font-black tracking-tight text-neutral-900">
                  {b.headline}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-neutral-700 sm:text-base">
                  {b.body}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-12 flex justify-center">
            <WhatsAppCtaLink
              variant="primary"
              className="px-8"
              prefillMessage="היי, רוצה לשמוע איך זה יכול לעבוד אצלי בעסק — בלי התחייבות"
            >
              רוצה לשמוע עוד בווטסאפ
            </WhatsAppCtaLink>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="mb-4 text-center text-4xl font-bold text-neutral-900">
          איך זה עובד?
        </h2>
        <p className="mx-auto mb-16 max-w-2xl text-center text-lg text-neutral-600">
          3 שלבים פשוטים ואתם מתחילים לקבל תורים
        </p>
        <div className="mx-auto grid max-w-5xl gap-10 md:grid-cols-3">
          <div className="text-center">
            <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center">
              <div className="absolute inset-0 animate-pulse rounded-full bg-emerald-100"></div>
              <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 text-2xl font-black text-white shadow-lg">
                1
              </div>
            </div>
            <h3 className="mb-3 text-2xl font-bold text-neutral-900">הירשם בחינם</h3>
            <p className="text-neutral-600">
              מילוי פרטים פשוט — בערך שתי דקות — וקבלת קישור אישי לדף ההזמנות שלך
            </p>
          </div>
          <div className="text-center">
            <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center">
              <div className="absolute inset-0 animate-pulse rounded-full bg-emerald-100 animation-delay-200"></div>
              <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 text-2xl font-black text-white shadow-lg">
                2
              </div>
            </div>
            <h3 className="mb-3 text-2xl font-bold text-neutral-900">התאם אישית</h3>
            <p className="text-neutral-600">
              הגדר את הזמינות שלך, מחירים, ושדות מותאמים ללקוחות
            </p>
          </div>
          <div className="text-center">
            <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center">
              <div className="absolute inset-0 animate-pulse rounded-full bg-emerald-100 animation-delay-400"></div>
              <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 text-2xl font-black text-white shadow-lg">
                3
              </div>
            </div>
            <h3 className="mb-3 text-2xl font-bold text-neutral-900">שתף וקבל תורים</h3>
            <p className="text-neutral-600">
              שתף את הקישור בווטסאפ, אינסטגרם או פייסבוק והתחל לקבל תורים
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="bg-gradient-to-b from-emerald-600 to-emerald-700 py-16 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold">תמחור פשוט ושקוף</h2>
          <p className="mx-auto mb-8 max-w-2xl text-emerald-100">
            ללא עמלות נסתרות. ללא התחייבות. בטל בכל עת.
          </p>
          <div className="mx-auto max-w-md rounded-lg bg-white p-8 text-neutral-900 shadow-xl">
            <div className="mb-4 text-5xl font-bold text-emerald-600">₪99</div>
            <div className="mb-6 text-neutral-600">לחודש</div>
            <ul className="mb-8 space-y-3 text-right">
              <li className="flex items-center gap-2">
                <span className="text-emerald-600">✓</span>
                <span>תורים בלתי מוגבלים</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-600">✓</span>
                <span>לקוחות בלתי מוגבלים</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-600">✓</span>
                <span>התראות ווטסאפ</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-600">✓</span>
                <span>סנכרון Google Calendar</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-600">✓</span>
                <span>תמיכה טכנית</span>
              </li>
            </ul>
            <Link href="/signup">
              <Button variant="primary" className="w-full">
                התחל 14 יום בחינם
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h2 className="mb-4 text-3xl font-bold text-neutral-900">
          מוכנים להתחיל?
        </h2>
        <p className="mx-auto mb-8 max-w-2xl text-xl text-neutral-600">
          הצטרפו ל-{PRODUCT_BRANDING.socialProof.activeBusinesses} עסקים שכבר מנהלים
          את התורים שלהם בצורה חכמה
        </p>
        <Link href="/signup">
          <Button variant="primary" className="px-12 py-4 text-lg">
            התחל בחינם עכשיו 🚀
          </Button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-200 bg-neutral-50 py-12">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <div className="mb-4 flex items-center gap-2">
                <span className="text-2xl">{PRODUCT_BRANDING.icon}</span>
                <span className="text-xl font-bold text-emerald-600">
                  {PRODUCT_BRANDING.name}
                </span>
              </div>
              <p className="text-sm text-neutral-600">
                {PRODUCT_BRANDING.tagline}
              </p>
            </div>
            <div>
              <h4 className="mb-4 font-semibold text-neutral-900">מוצר</h4>
              <ul className="space-y-2 text-sm text-neutral-600">
                <li><Link href="/features" className="hover:text-emerald-600">תכונות</Link></li>
                <li><Link href="/pricing" className="hover:text-emerald-600">תמחור</Link></li>
                <li><Link href="/demo" className="hover:text-emerald-600">דמו</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 font-semibold text-neutral-900">חברה</h4>
              <ul className="space-y-2 text-sm text-neutral-600">
                <li><Link href="/about" className="hover:text-emerald-600">אודות</Link></li>
                <li><Link href="/contact" className="hover:text-emerald-600">צור קשר</Link></li>
                <li><Link href="/help" className="hover:text-emerald-600">מרכז עזרה</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 font-semibold text-neutral-900">צור קשר</h4>
              <div className="flex flex-col gap-3">
                <WhatsAppCtaLink variant="soft" className="w-fit justify-start text-sm">
                  ווטסאפ — תגובה מהירה
                </WhatsAppCtaLink>
                <div className="flex gap-4">
                  <a
                    href={PRODUCT_BRANDING.social.facebook}
                    className="text-2xl hover:text-emerald-600"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    📘
                  </a>
                  <a
                    href={PRODUCT_BRANDING.social.instagram}
                    className="text-2xl hover:text-emerald-600"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    📷
                  </a>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-8 border-t border-neutral-200 pt-8 text-center text-sm text-neutral-600">
            <p>© {new Date().getFullYear()} {PRODUCT_BRANDING.name}. כל הזכויות שמורות.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
