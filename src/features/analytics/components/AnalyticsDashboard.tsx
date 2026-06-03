"use client";

import { useMemo, useState } from 'react';
import type { AppointmentRecord } from '@/core/types/appointment';
import type { Client } from '@/core/types/client';
import { 
  calculateAnalyticsStats, 
  calculateDailyStats,
  calculateClientStats,
  formatCurrency,
  formatPercentage,
  formatNumber,
  type DateRange 
} from '@/lib/analytics/calculateStats';
import {
  exportAppointmentsToCSV,
  exportClientsToCSV,
  exportRevenueSummaryToCSV,
  exportFullAnalyticsReport,
} from '@/lib/analytics/exportToExcel';
import { ui, Button } from '@/components/ui';
import { cn } from '@/lib/cn';

interface AnalyticsDashboardProps {
  appointments: AppointmentRecord[];
  clients: Client[];
}

export function AnalyticsDashboard({ appointments, clients }: AnalyticsDashboardProps) {
  // Date range state - default to last 30 days
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    return { startDate, endDate };
  });

  // Calculate statistics
  const stats = useMemo(
    () => calculateAnalyticsStats(appointments, clients, dateRange),
    [appointments, clients, dateRange]
  );

  const dailyStats = useMemo(
    () => calculateDailyStats(appointments, dateRange),
    [appointments, dateRange]
  );

  const clientStats = useMemo(
    () => calculateClientStats(appointments, clients).slice(0, 10), // Top 10
    [appointments, clients]
  );

  // Quick date range presets
  const setQuickRange = (days: number) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    setDateRange({ startDate, endDate });
  };

  return (
    <div className="space-y-6">
      {/* Header with date range selector and export */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              📊 דוחות ואנליטיקה
            </h2>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              סקירה מקיפה של הביצועים העסקיים שלך
            </p>
          </div>
          
          {/* Quick date range buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setQuickRange(7)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                "hover:bg-emerald-50 hover:text-emerald-700",
                "dark:hover:bg-emerald-900/30 dark:hover:text-emerald-300"
              )}
            >
              7 ימים
            </button>
            <button
              onClick={() => setQuickRange(30)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                "bg-emerald-100 text-emerald-700",
                "dark:bg-emerald-900/30 dark:text-emerald-300"
              )}
            >
              30 ימים
            </button>
            <button
              onClick={() => setQuickRange(90)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                "hover:bg-emerald-50 hover:text-emerald-700",
                "dark:hover:bg-emerald-900/30 dark:hover:text-emerald-300"
              )}
            >
              90 ימים
            </button>
          </div>
        </div>

        {/* Export buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => exportFullAnalyticsReport(appointments, clients, dateRange)}
          >
            📥 ייצוא דוח מלא
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => exportRevenueSummaryToCSV(appointments, dateRange)}
          >
            💰 ייצוא הכנסות
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => exportAppointmentsToCSV(appointments, clients)}
          >
            📅 ייצוא תורים
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => exportClientsToCSV(clients, appointments)}
          >
            👥 ייצוא לקוחות
          </Button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon="💰"
          title="סה״כ הכנסות"
          value={formatCurrency(stats.totalRevenue)}
          subtitle={`${formatCurrency(stats.paidRevenue)} שולם`}
          trend={stats.totalRevenue > 0 ? '+' : ''}
          trendColor="emerald"
        />
        
        <MetricCard
          icon="📅"
          title="סה״כ תורים"
          value={formatNumber(stats.totalAppointments)}
          subtitle={`${stats.completedAppointments} הושלמו`}
          trend={`${formatPercentage((stats.completedAppointments / stats.totalAppointments) * 100)}`}
          trendColor="blue"
        />
        
        <MetricCard
          icon="👥"
          title="לקוחות פעילים"
          value={formatNumber(stats.activeClients)}
          subtitle={`${stats.newClients} חדשים`}
          trend={stats.newClients > 0 ? `+${stats.newClients}` : '0'}
          trendColor="purple"
        />
        
        <MetricCard
          icon="📈"
          title="ניצולת זמן"
          value={formatPercentage(stats.utilizationRate)}
          subtitle={`${formatNumber(stats.averageAppointmentsPerDay)} תורים ליום`}
          trend={stats.utilizationRate > 70 ? 'מעולה' : 'טוב'}
          trendColor="teal"
        />
      </div>

      {/* Revenue Chart */}
      <div className={cn(ui.card, "p-6")}>
        <h3 className="mb-4 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          הכנסות לפי יום
        </h3>
        <SimpleBarChart data={dailyStats} />
      </div>

      {/* Payment Status */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className={cn(ui.card, "p-6")}>
          <h3 className="mb-4 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            סטטוס תשלומים
          </h3>
          <div className="space-y-3">
            <PaymentStatusBar
              label="שולם"
              amount={stats.paidRevenue}
              total={stats.totalRevenue}
              color="emerald"
            />
            <PaymentStatusBar
              label="בהמתנה"
              amount={stats.pendingRevenue}
              total={stats.totalRevenue}
              color="amber"
            />
            <PaymentStatusBar
              label="לא שולם"
              amount={stats.unpaidRevenue}
              total={stats.totalRevenue}
              color="red"
            />
          </div>
          <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
            <div className="flex justify-between text-sm">
              <span className="text-neutral-600 dark:text-neutral-400">אחוז תשלום</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {formatPercentage(stats.paymentRate)}
              </span>
            </div>
          </div>
        </div>

        <div className={cn(ui.card, "p-6")}>
          <h3 className="mb-4 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            ממוצעים
          </h3>
          <div className="space-y-4">
            <div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400">הכנסה ממוצעת לתור</div>
              <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                {formatCurrency(stats.averageRevenuePerAppointment)}
              </div>
            </div>
            <div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400">תורים ליום</div>
              <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                {formatNumber(stats.averageAppointmentsPerDay)}
              </div>
            </div>
            <div>
              <div className="text-sm text-neutral-600 dark:text-neutral-400">תורים עתידיים</div>
              <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                {formatNumber(stats.upcomingAppointments)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Clients */}
      <div className={cn(ui.card, "p-6")}>
        <h3 className="mb-4 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          10 הלקוחות המובילים
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-700">
                <th className="pb-2 text-right font-medium text-neutral-600 dark:text-neutral-400">שם</th>
                <th className="pb-2 text-right font-medium text-neutral-600 dark:text-neutral-400">תורים</th>
                <th className="pb-2 text-right font-medium text-neutral-600 dark:text-neutral-400">סה״כ הוצאה</th>
                <th className="pb-2 text-right font-medium text-neutral-600 dark:text-neutral-400">סטטוס</th>
              </tr>
            </thead>
            <tbody>
              {clientStats.map((client, index) => (
                <tr
                  key={client.clientId}
                  className="border-b border-neutral-100 dark:border-neutral-800"
                >
                  <td className="py-3 text-right">
                    <div className="flex items-center gap-2">
                      <span className="text-neutral-400">#{index + 1}</span>
                      <span className="font-medium">{client.clientName}</span>
                    </div>
                  </td>
                  <td className="py-3 text-right text-neutral-600 dark:text-neutral-400">
                    {client.totalAppointments}
                  </td>
                  <td className="py-3 text-right font-semibold">
                    {formatCurrency(client.totalSpent)}
                  </td>
                  <td className="py-3 text-right">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                        client.isActive
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                          : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
                      )}
                    >
                      {client.isActive ? "פעיל" : "לא פעיל"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Helper Components

interface MetricCardProps {
  icon: string;
  title: string;
  value: string;
  subtitle: string;
  trend?: string;
  trendColor?: 'emerald' | 'blue' | 'purple' | 'teal' | 'red';
}

function MetricCard({ icon, title, value, subtitle, trend, trendColor = 'emerald' }: MetricCardProps) {
  const trendColors = {
    emerald: 'text-emerald-600 dark:text-emerald-400',
    blue: 'text-blue-600 dark:text-blue-400',
    purple: 'text-purple-600 dark:text-purple-400',
    teal: 'text-teal-600 dark:text-teal-400',
    red: 'text-red-600 dark:text-red-400',
  };

  return (
    <div className={cn(ui.card, "p-6")}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
            {title}
          </p>
          <p className="mt-2 text-3xl font-bold text-neutral-900 dark:text-neutral-100">
            {value}
          </p>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            {subtitle}
          </p>
        </div>
        <div className="text-3xl">{icon}</div>
      </div>
      {trend && (
        <div className={cn("mt-2 text-sm font-medium", trendColors[trendColor])}>
          {trend}
        </div>
      )}
    </div>
  );
}

interface PaymentStatusBarProps {
  label: string;
  amount: number;
  total: number;
  color: 'emerald' | 'amber' | 'red';
}

function PaymentStatusBar({ label, amount, total, color }: PaymentStatusBarProps) {
  const percentage = total > 0 ? (amount / total) * 100 : 0;
  
  const colors = {
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    red: 'bg-red-500',
  };

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-neutral-600 dark:text-neutral-400">{label}</span>
        <span className="font-semibold">{formatCurrency(amount)}</span>
      </div>
      <div className="h-2 rounded-full bg-neutral-100 dark:bg-neutral-800">
        <div
          className={cn("h-full rounded-full transition-all", colors[color])}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
}

interface SimpleBarChartProps {
  data: Array<{ date: string; revenue: number; appointments: number }>;
}

function SimpleBarChart({ data }: SimpleBarChartProps) {
  const maxRevenue = Math.max(...data.map(d => d.revenue), 1);
  
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-neutral-500">
        אין נתונים להצגה
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex h-64 items-end justify-between gap-1">
        {data.map((day, index) => {
          const height = maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0;
          return (
            <div key={day.date} className="flex flex-1 flex-col items-center gap-1">
              <div className="relative w-full group">
                <div
                  className={cn(
                    "w-full rounded-t-lg bg-gradient-to-t from-emerald-500 to-emerald-400",
                    "transition-all hover:from-emerald-600 hover:to-emerald-500"
                  )}
                  style={{ height: `${height}%`, minHeight: height > 0 ? '4px' : '0' }}
                />
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block">
                  <div className="rounded-lg bg-neutral-900 px-2 py-1 text-xs text-white shadow-lg">
                    <div>{formatCurrency(day.revenue)}</div>
                    <div className="text-neutral-400">{day.appointments} תורים</div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-xs text-neutral-500">
        <span>{new Date(data[0].date).toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })}</span>
        <span>{new Date(data[data.length - 1].date).toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })}</span>
      </div>
    </div>
  );
}
