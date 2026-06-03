"use client";

import Link from 'next/link';
import { useMemo } from 'react';
import type { AppointmentRecord } from '@/core/types/appointment';
import type { Client } from '@/core/types/client';
import { calculateAnalyticsStats, formatCurrency, formatNumber, formatPercentage } from '@/lib/analytics/calculateStats';
import { ui } from '@/components/ui';
import { cn } from '@/lib/cn';

interface AnalyticsSummaryWidgetProps {
  appointments: AppointmentRecord[];
  clients: Client[];
}

export function AnalyticsSummaryWidget({ appointments, clients }: AnalyticsSummaryWidgetProps) {
  // Calculate stats for last 30 days
  const stats = useMemo(() => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    return calculateAnalyticsStats(appointments, clients, { startDate, endDate });
  }, [appointments, clients]);

  return (
    <div className={cn(ui.card, "p-6")}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">📊</span>
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            סיכום 30 יום אחרונים
          </h3>
        </div>
        <Link
          href="/analytics"
          className="text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
        >
          צפה בדוח מלא ←
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">הכנסות</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {formatCurrency(stats.totalRevenue)}
          </p>
          <p className="text-xs text-neutral-500">
            {formatPercentage(stats.paymentRate)} שולם
          </p>
        </div>

        <div className="space-y-1">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">תורים</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {formatNumber(stats.totalAppointments)}
          </p>
          <p className="text-xs text-neutral-500">
            {stats.completedAppointments} הושלמו
          </p>
        </div>

        <div className="space-y-1">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">לקוחות פעילים</p>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {formatNumber(stats.activeClients)}
          </p>
          <p className="text-xs text-neutral-500">
            {stats.newClients > 0 ? `+${stats.newClients} חדשים` : 'אין חדשים'}
          </p>
        </div>

        <div className="space-y-1">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">ניצולת</p>
          <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">
            {formatPercentage(stats.utilizationRate)}
          </p>
          <p className="text-xs text-neutral-500">
            {formatNumber(stats.averageAppointmentsPerDay)} תורים/יום
          </p>
        </div>
      </div>
    </div>
  );
}
