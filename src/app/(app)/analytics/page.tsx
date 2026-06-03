"use client";

import { heUi } from "@/config";
import { ui } from "@/components/ui";
import { useServiceApp } from "@/features/app/ServiceAppProvider";
import { AnalyticsDashboard } from "@/features/analytics/components/AnalyticsDashboard";
import { useAuth } from "@/features/auth/AuthContext";

export default function AnalyticsPage() {
  const { isAdmin } = useAuth();
  const {
    sortedAppointments,
    sortedClients,
    appointmentsReady,
    clientsReady,
  } = useServiceApp();

  const isLoading = !appointmentsReady || !clientsReady;

  return (
    <main className={ui.pageMain}>
      <header className={ui.header}>
        <div className="flex items-center gap-3">
          <span className="text-4xl">📊</span>
          <div>
            <h1 className={ui.pageTitle}>דוחות ואנליטיקה</h1>
            <p className={ui.pageSubtitle}>
              סקירה מקיפה של הביצועים העסקיים שלך
            </p>
          </div>
        </div>
      </header>

      <div className={ui.pageStack}>
        {isLoading ? (
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="text-center">
              <div className="text-4xl">📊</div>
              <div className="mt-2 text-sm text-neutral-600">
                טוען נתונים...
              </div>
            </div>
          </div>
        ) : (
          <AnalyticsDashboard
            appointments={sortedAppointments}
            clients={sortedClients}
          />
        )}
      </div>
    </main>
  );
}
