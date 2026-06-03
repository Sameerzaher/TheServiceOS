"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PRODUCT_BRANDING } from "@/config/branding";
import { Button } from "@/components/ui";

export default function DemoPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startDemo() {
    setIsLoading(true);
    setError(null);
    
    console.log("[Demo] Starting demo mode...");
    
    try {
      // Step 1: Create or login as demo user
      console.log("[Demo] Creating demo user...");
      
      const signupRes = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "demo@demo.local",
          password: "Demo123!Demo",
          fullName: "Demo User",
          businessName: "Demo Business",
          phone: "0501111111",
          slug: `demo-${Date.now()}`,
          businessType: "driving_instructor",
          role: "user"
        })
      });
      
      const signupData = await signupRes.json();
      
      // If signup failed (user exists), try to login
      if (!signupData.ok && signupData.error?.includes('כבר קיים')) {
        console.log("[Demo] Demo user exists, logging in...");
        
        const loginRes = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "demo@demo.local",
            password: "Demo123!Demo"
          })
        });
        
        const loginData = await loginRes.json();
        
        if (!loginData.ok) {
          console.error("[Demo] Login failed:", loginData);
          setError("לא ניתן להתחבר למצב דמו. נסו שוב או הירשמו.");
          setIsLoading(false);
          return;
        }
        
        console.log("[Demo] Logged in successfully");
      } else if (!signupData.ok) {
        console.error("[Demo] Signup failed:", signupData);
        setError("לא ניתן ליצור משתמש דמו. נסו שוב.");
        setIsLoading(false);
        return;
      } else {
        console.log("[Demo] Demo user created successfully");
      }
      
      console.log("[Demo] Demo user ready, loading demo data...");
      
      // Step 2: Load demo data
      const demoRes = await fetch("/api/demo/load", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      
      if (!demoRes.ok) {
        const demoData = await demoRes.json();
        console.error("[Demo] Demo load failed:", demoData);
        setError(demoData.error || "שגיאה בטעינת נתוני הדמו");
        setIsLoading(false);
        return;
      }
      
      console.log("[Demo] Demo loaded successfully, redirecting...");
      
      // Set demo flag
      if (typeof window !== "undefined") {
        window.localStorage.setItem("serviceos.demoMode", "true");
      }
      
      // Small delay to ensure session is set
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Redirect to dashboard - router will trigger auth check
      window.location.href = "/dashboard";
    } catch (e) {
      console.error("[Demo] Unexpected error:", e);
      setError("שגיאה בטעינת הדמו. נסו שוב.");
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-blue-50 p-4">
      <div className="w-full max-w-lg rounded-lg bg-white p-8 text-center shadow-xl">
        <div className="mb-6 text-6xl">{PRODUCT_BRANDING.icon}</div>
        <h1 className="mb-4 text-3xl font-bold text-neutral-900">
          דמו אינטראקטיבי
        </h1>
        <p className="mb-8 text-lg text-neutral-600">
          חקרו את {PRODUCT_BRANDING.name} עם נתוני דמו. כל מה שתשנו לא יישמר.
        </p>
        
        <div className="mb-8 space-y-3 rounded-lg bg-emerald-50 p-6 text-right text-sm">
          <p className="flex items-start gap-2">
            <span className="text-emerald-600">✓</span>
            <span>נסו להוסיף לקוחות חדשים</span>
          </p>
          <p className="flex items-start gap-2">
            <span className="text-emerald-600">✓</span>
            <span>קבעו תורים</span>
          </p>
          <p className="flex items-start gap-2">
            <span className="text-emerald-600">✓</span>
            <span>התאימו הגדרות</span>
          </p>
          <p className="flex items-start gap-2">
            <span className="text-emerald-600">✓</span>
            <span>צפו בדף הזמנה ציבורי</span>
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <Button 
          variant="primary" 
          onClick={startDemo} 
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? "טוען דמו..." : "התחל דמו 🎮"}
        </Button>
        
        <p className="mt-6 text-sm text-neutral-500">
          רוצים את המערכת האמיתית?{" "}
          <a href="/signup" className="font-medium text-emerald-600 hover:underline">
            הירשמו בחינם
          </a>
        </p>
      </div>
    </div>
  );
}
