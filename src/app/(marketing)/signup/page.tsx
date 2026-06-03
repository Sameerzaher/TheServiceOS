"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { WhatsAppCtaLink } from "@/components/marketing/WhatsAppCtaLink";
import { PRODUCT_BRANDING } from "@/config/branding";
import { Button, ui } from "@/components/ui";

export default function SignupPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const fullName = formData.get("fullName") as string;
    const phone = formData.get("phone") as string;
    
    // Generate business name and slug from full name and email
    const businessName = fullName.trim();
    const slug = `${email.split("@")[0]}-${Date.now()}`.toLowerCase().replace(/[^a-z0-9-]/g, "-");

    try {
      // API will automatically determine role:
      // - First user in system = admin
      // - All others = user
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          fullName,
          businessName,
          phone,
          slug,
          businessType: "driving_instructor",
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        console.error("[Signup] Signup failed:", data.error);
        setError(data.error || "ההרשמה נכשלה. נסה שוב.");
        setIsSubmitting(false);
        return;
      }

      // Now login
      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const loginData = await loginRes.json();

      if (!loginRes.ok || !loginData.ok) {
        console.error("[Signup] Auto-login failed:", loginData.error);
        setError("ההרשמה הצליחה, אבל ההתחברות נכשלה. נסה להתחבר ידנית.");
        setIsSubmitting(false);
        return;
      }

      // Onboarding then dashboard — feels like a finished product
      await new Promise((resolve) => setTimeout(resolve, 400));
      window.location.href = "/onboarding";
    } catch (e) {
      console.error("[Signup] Unexpected error:", e);
      setError("אירעה שגיאה. נסה שוב.");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-blue-50 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-10 text-center">
          <Link href="/" className="inline-flex flex-col items-center gap-1">
            <span className="text-6xl">{PRODUCT_BRANDING.icon}</span>
            <span className="text-3xl font-black text-emerald-600">
              {PRODUCT_BRANDING.name}
            </span>
            <span className="text-xs text-neutral-500">{PRODUCT_BRANDING.nameEn}</span>
          </Link>
        </div>

        {/* Card */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-2xl">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-6 text-center">
            <h1 className="text-2xl font-bold text-white">
              הרשמה
            </h1>
            <p className="mt-1 text-sm text-emerald-50">
              התחילו בחינם - ללא כרטיס אשראי
            </p>
          </div>
          
          <div className="p-8">
            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSignup} className="space-y-5">
              <div>
                <label htmlFor="fullName" className={ui.label + " font-semibold"}>
                  שם מלא
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  className={ui.input + " transition-all focus:scale-[1.02]"}
                  placeholder="ישראל ישראלי"
                />
              </div>

              <div>
                <label htmlFor="email" className={ui.label + " font-semibold"}>
                  אימייל
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className={ui.input + " transition-all focus:scale-[1.02]"}
                  placeholder="example@email.com"
                  dir="ltr"
                />
              </div>

              <div>
                <label htmlFor="phone" className={ui.label + " font-semibold"}>
                  טלפון
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  className={ui.input + " transition-all focus:scale-[1.02]"}
                  placeholder="050-0000000"
                />
              </div>

              <div>
                <label htmlFor="password" className={ui.label + " font-semibold"}>
                  סיסמה
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  className={ui.input + " transition-all focus:scale-[1.02]"}
                  placeholder="לפחות 8 תווים, אות גדולה ומספר"
                  dir="ltr"
                />
                <p className="mt-1 text-xs text-neutral-500">
                  הסיסמה חייבת לכלול לפחות 8 תווים, אות גדולה אחת ומספר אחד
                </p>
              </div>

              <div className="flex items-start gap-2 text-sm">
                <input type="checkbox" required className="mt-1 rounded text-emerald-600 focus:ring-emerald-500" />
                <span className="text-neutral-600">
                  {"אני מסכים/ה ל"}
                  <Link href="/terms" className="font-medium text-emerald-600 hover:underline">
                    תנאי השימוש
                  </Link>
                  {" ול"}
                  <Link href="/privacy" className="font-medium text-emerald-600 hover:underline">
                    מדיניות הפרטיות
                  </Link>
                </span>
              </div>

              <Button 
                type="submit" 
                variant="primary" 
                className="w-full py-3 text-lg font-semibold shadow-lg hover:shadow-xl"
                disabled={isSubmitting}
              >
                {isSubmitting ? "נרשם..." : "התחל 14 יום בחינם 🚀"}
              </Button>
            </form>

            <div className="mt-8 text-center text-sm">
              <span className="text-neutral-600">כבר יש לכם חשבון?</span>{" "}
              <Link href="/login" className="font-bold text-emerald-600 hover:text-emerald-700 hover:underline">
                התחברו
              </Link>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="mt-6 grid grid-cols-3 gap-4 text-center text-xs font-medium text-neutral-600">
          <div className="rounded-lg bg-white p-3 shadow-sm">
            ✓ ללא כרטיס אשראי
          </div>
          <div className="rounded-lg bg-white p-3 shadow-sm">
            ✓ ביטול בכל עת
          </div>
          <div className="rounded-lg bg-white p-3 shadow-sm">
            ✓ תמיכה מהירה
          </div>
        </div>
        <div className="mt-5 flex justify-center">
          <WhatsAppCtaLink
            variant="soft"
            className="text-sm"
            prefillMessage="היי, חושבים להירשם לתור פה — אפשר שאלה קטנה לפני?"
          >
            רוצים עזרה לפני הרשמה? ווטסאפ
          </WhatsAppCtaLink>
        </div>
      </div>
    </div>
  );
}
