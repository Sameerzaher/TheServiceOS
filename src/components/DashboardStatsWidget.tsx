"use client";

import { useEffect, useState } from "react";
import { ui } from "@/components/ui";

interface DashboardStats {
  totalClients: number;
  totalAppointments: number;
  thisMonthAppointments: number;
  thisMonthRevenue: number;
  upcomingAppointments: number;
  pendingPayments: number;
}

export default function DashboardStatsWidget() {
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    totalAppointments: 0,
    thisMonthAppointments: 0,
    thisMonthRevenue: 0,
    upcomingAppointments: 0,
    pendingPayments: 0,
  });

  useEffect(() => {
    // Fetch stats from API
    // For now, using mock data
    setStats({
      totalClients: 45,
      totalAppointments: 234,
      thisMonthAppointments: 28,
      thisMonthRevenue: 8400,
      upcomingAppointments: 12,
      pendingPayments: 3,
    });
  }, []);

  const statCards = [
    {
      label: "לקוחות",
      value: stats.totalClients,
      icon: "👥",
      color: "emerald",
    },
    {
      label: "תורים החודש",
      value: stats.thisMonthAppointments,
      icon: "📅",
      color: "blue",
    },
    {
      label: "הכנסות החודש",
      value: `₪${stats.thisMonthRevenue.toLocaleString()}`,
      icon: "💰",
      color: "green",
    },
    {
      label: "תורים קרובים",
      value: stats.upcomingAppointments,
      icon: "⏰",
      color: "orange",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {statCards.map((card) => (
        <div key={card.label} className={ui.card + " p-6"}>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-2xl">{card.icon}</span>
            <div
              className={`rounded-full bg-${card.color}-100 px-2 py-0.5 text-xs font-semibold text-${card.color}-700`}
            >
              חדש
            </div>
          </div>
          <div className="text-3xl font-bold text-neutral-900">
            {card.value}
          </div>
          <div className="text-sm text-neutral-600">{card.label}</div>
        </div>
      ))}
    </div>
  );
}
