"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

import { AppShell } from "@/components/AppShell";
import { AppDialogs } from "@/features/app/AppDialogs";
import { DashboardTeacherProvider } from "@/features/app/DashboardTeacherContext";
import { ServiceAppProvider } from "@/features/app/ServiceAppProvider";
import { AuthProvider, useAuth } from "@/features/auth/AuthContext";

function AuthGuard({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    console.log("[AppLayout] Auth check:", { isAuthenticated, isLoading, pathname });
    
    if (!isLoading && !isAuthenticated) {
      console.log("[AppLayout] Not authenticated, redirecting to /login");
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router, pathname]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="text-4xl">📅</div>
          <div className="mt-2 text-sm text-neutral-600">טוען...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <AuthGuard>
        <DashboardTeacherProvider>
          <ServiceAppProvider>
            <AppShell>
              <AppDialogs />
              {children}
            </AppShell>
          </ServiceAppProvider>
        </DashboardTeacherProvider>
      </AuthGuard>
    </AuthProvider>
  );
}
