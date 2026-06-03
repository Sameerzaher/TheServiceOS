/**
 * Analytics calculation utilities
 * חישובי אנליטיקה וסטטיסטיקות
 */

import type { AppointmentRecord } from '@/core/types/appointment';
import { AppointmentStatus, PaymentStatus } from '@/core/types/appointment';
import type { Client } from '@/core/types/client';

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface AnalyticsStats {
  // Overall metrics
  totalAppointments: number;
  completedAppointments: number;
  canceledAppointments: number;
  upcomingAppointments: number;
  
  // Revenue metrics
  totalRevenue: number;
  paidRevenue: number;
  pendingRevenue: number;
  unpaidRevenue: number;
  
  // Client metrics
  totalClients: number;
  activeClients: number; // Clients with appointments in date range
  newClients: number; // Clients created in date range
  
  // Utilization metrics
  averageAppointmentsPerDay: number;
  utilizationRate: number; // Percentage of working hours filled
  
  // Payment metrics
  paymentRate: number; // Percentage of paid appointments
  averageRevenuePerAppointment: number;
}

export interface DailyStats {
  date: string; // YYYY-MM-DD
  appointments: number;
  revenue: number;
  completed: number;
  canceled: number;
}

export interface ClientStats {
  clientId: string;
  clientName: string;
  totalAppointments: number;
  completedAppointments: number;
  totalSpent: number;
  lastAppointmentDate: string | null;
  isActive: boolean; // Had appointment in last 30 days
}

/**
 * Calculate overall analytics statistics
 */
export function calculateAnalyticsStats(
  appointments: AppointmentRecord[],
  clients: Client[],
  dateRange: DateRange
): AnalyticsStats {
  const { startDate, endDate } = dateRange;
  
  // Filter appointments in date range
  const appointmentsInRange = appointments.filter(apt => {
    const aptDate = new Date(apt.startAt);
    return aptDate >= startDate && aptDate <= endDate;
  });
  
  // Calculate appointment counts
  const totalAppointments = appointmentsInRange.length;
  const completedAppointments = appointmentsInRange.filter(
    apt => apt.status === AppointmentStatus.Completed
  ).length;
  const canceledAppointments = appointmentsInRange.filter(
    apt => apt.status === AppointmentStatus.Cancelled || apt.status === AppointmentStatus.NoShow
  ).length;
  const upcomingAppointments = appointmentsInRange.filter(apt => {
    const aptDate = new Date(apt.startAt);
    return aptDate > new Date() && 
           (apt.status === AppointmentStatus.Confirmed || apt.status === AppointmentStatus.Scheduled);
  }).length;
  
  // Calculate revenue
  const totalRevenue = appointmentsInRange
    .filter(apt => apt.status === AppointmentStatus.Completed)
    .reduce((sum, apt) => sum + (apt.amount || 0), 0);
  
  const paidRevenue = appointmentsInRange
    .filter(apt => apt.paymentStatus === PaymentStatus.Paid)
    .reduce((sum, apt) => sum + (apt.amount || 0), 0);
  
  const pendingRevenue = appointmentsInRange
    .filter(apt => apt.paymentStatus === PaymentStatus.Pending || apt.paymentStatus === PaymentStatus.Partial)
    .reduce((sum, apt) => sum + (apt.amount || 0), 0);
  
  const unpaidRevenue = appointmentsInRange
    .filter(apt => apt.paymentStatus === PaymentStatus.Unpaid && apt.status === AppointmentStatus.Completed)
    .reduce((sum, apt) => sum + (apt.amount || 0), 0);
  
  // Calculate client metrics
  const clientsWithAppointments = new Set(
    appointmentsInRange.map(apt => apt.clientId)
  );
  const activeClients = clientsWithAppointments.size;
  
  const newClients = clients.filter(client => {
    const createdAt = new Date(client.createdAt);
    return createdAt >= startDate && createdAt <= endDate;
  }).length;
  
  // Calculate utilization
  const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const averageAppointmentsPerDay = daysDiff > 0 ? totalAppointments / daysDiff : 0;
  
  // Assume 8 working hours per day, 60 minutes per appointment
  const totalWorkingMinutes = daysDiff * 8 * 60;
  const totalAppointmentMinutes = appointmentsInRange.length * 60; // Assuming 1 hour per appointment
  const utilizationRate = totalWorkingMinutes > 0 
    ? (totalAppointmentMinutes / totalWorkingMinutes) * 100 
    : 0;
  
  // Payment rate
  const paidAppointments = appointmentsInRange.filter(
    apt => apt.paymentStatus === PaymentStatus.Paid
  ).length;
  const paymentRate = completedAppointments > 0 
    ? (paidAppointments / completedAppointments) * 100 
    : 0;
  
  const averageRevenuePerAppointment = completedAppointments > 0
    ? totalRevenue / completedAppointments
    : 0;
  
  return {
    totalAppointments,
    completedAppointments,
    canceledAppointments,
    upcomingAppointments,
    totalRevenue,
    paidRevenue,
    pendingRevenue,
    unpaidRevenue,
    totalClients: clients.length,
    activeClients,
    newClients,
    averageAppointmentsPerDay,
    utilizationRate: Math.min(utilizationRate, 100), // Cap at 100%
    paymentRate,
    averageRevenuePerAppointment,
  };
}

/**
 * Calculate daily statistics for charts
 */
export function calculateDailyStats(
  appointments: AppointmentRecord[],
  dateRange: DateRange
): DailyStats[] {
  const { startDate, endDate } = dateRange;
  const dailyMap = new Map<string, DailyStats>();
  
  // Initialize all dates in range
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const dateKey = currentDate.toISOString().split('T')[0];
    dailyMap.set(dateKey, {
      date: dateKey,
      appointments: 0,
      revenue: 0,
      completed: 0,
      canceled: 0,
    });
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  // Populate with appointment data
  appointments.forEach(apt => {
    const aptDate = new Date(apt.startAt);
    if (aptDate >= startDate && aptDate <= endDate) {
      const dateKey = aptDate.toISOString().split('T')[0];
      const stats = dailyMap.get(dateKey);
      if (stats) {
        stats.appointments++;
        if (apt.status === AppointmentStatus.Completed) {
          stats.completed++;
          stats.revenue += apt.amount || 0;
        }
        if (apt.status === AppointmentStatus.Cancelled || apt.status === AppointmentStatus.NoShow) {
          stats.canceled++;
        }
      }
    }
  });
  
  return Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Calculate per-client statistics
 */
export function calculateClientStats(
  appointments: AppointmentRecord[],
  clients: Client[]
): ClientStats[] {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  return clients.map(client => {
    const clientAppointments = appointments.filter(apt => apt.clientId === client.id);
    const completedAppointments = clientAppointments.filter(
      apt => apt.status === AppointmentStatus.Completed
    );
    
    const totalSpent = completedAppointments.reduce(
      (sum, apt) => sum + (apt.amount || 0),
      0
    );
    
    const sortedAppointments = clientAppointments
      .filter(apt => apt.startAt)
      .sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime());
    
    const lastAppointmentDate = sortedAppointments.length > 0
      ? sortedAppointments[0].startAt
      : null;
    
    const isActive = sortedAppointments.some(apt => {
      const aptDate = new Date(apt.startAt);
      return aptDate >= thirtyDaysAgo;
    });
    
    return {
      clientId: client.id,
      clientName: client.fullName,
      totalAppointments: clientAppointments.length,
      completedAppointments: completedAppointments.length,
      totalSpent,
      lastAppointmentDate,
      isActive,
    };
  }).sort((a, b) => b.totalSpent - a.totalSpent); // Sort by revenue
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format percentage for display
 */
export function formatPercentage(value: number): string {
  return `${Math.round(value)}%`;
}

/**
 * Format number with commas
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('he-IL').format(Math.round(value));
}
