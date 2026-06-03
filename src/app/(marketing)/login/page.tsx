"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { WhatsAppCtaLink } from "@/components/marketing/WhatsAppCtaLink";
import { PRODUCT_BRANDING } from "@/config/branding";
import { Button, ui } from "@/components/ui";
import { AuthProvider, useAuth } from "@/features/auth/AuthContext";

function LoginForm() {
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const formElement = e.target as HTMLFormElement;
    const email = (formElement.elements.namedItem("email") as HTMLInputElement).value;
    const password = (formElement.elements.namedItem("password") as HTMLInputElement).value;

    try {
      await login(email, password);
    } catch (e: unknown) {
      console.error("[Login] error:", e);
      const errorMessage = e instanceof Error ? e.message : "שגיאה בהתחברות";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
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
              התחברות
            </h1>
            <p className="mt-1 text-sm text-emerald-50">
              כנסו למערכת עם המייל והסיסמה שלכם
            </p>
          </div>
          
          <div className="p-8">
            {error && (
              <div className="mb-4 rounded-lg border-2 border-red-200 bg-red-50 p-3 text-center text-sm font-medium text-red-700">
                {error}
              </div>
            )}
            
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label htmlFor="email" className={ui.label + " font-semibold"}>
                  אימייל
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  disabled={isLoading}
                  className={ui.input + " transition-all focus:scale-[1.02]"}
                  placeholder="example@email.com"
                  dir="ltr"
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
                  disabled={isLoading}
                  className={ui.input + " transition-all focus:scale-[1.02]"}
                  placeholder="••••••••"
                  dir="ltr"
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex cursor-pointer items-center gap-2">
                  <input type="checkbox" className="rounded text-emerald-600 focus:ring-emerald-500" />
                  <span className="text-neutral-600">זכור אותי</span>
                </label>
                <Link
                  href="/forgot-password"
                  className="font-medium text-emerald-600 hover:text-emerald-700 hover:underline"
                >
                  שכחתי סיסמה
                </Link>
              </div>

              <Button 
                type="submit" 
                variant="primary" 
                className="w-full py-3 text-lg font-semibold shadow-lg hover:shadow-xl"
                disabled={isLoading}
              >
                {isLoading ? "מתחבר..." : "התחבר 🔐"}
              </Button>
            </form>

            <div className="mt-8 text-center text-sm">
              <span className="text-neutral-600">עדיין אין לכם חשבון?</span>{" "}
              <Link href="/signup" className="font-bold text-emerald-600 hover:text-emerald-700 hover:underline">
                הירשמו בחינם
              </Link>
            </div>
          </div>
        </div>

        {/* Demo link */}
        <div className="mt-8 flex flex-col items-center gap-3 text-center">
          <Link
            href="/demo"
            className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-medium text-neutral-700 shadow-md transition-all hover:shadow-lg hover:text-emerald-600"
          >
            <span>🎮</span>
            <span>רוצים לראות איך זה עובד? נסו את הדמו</span>
          </Link>
          <WhatsAppCtaLink variant="soft" className="text-sm" prefillMessage="היי, לא מצליח להתחבר — אפשר עזרה?">
            צריכים עזרה? ווטסאפ
          </WhatsAppCtaLink>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <AuthProvider>
      <LoginForm />
    </AuthProvider>
  );
}
