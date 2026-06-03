/**
 * Export analytics data to Excel/CSV
 * ייצוא נתונים לאקסל
 */

import type { AppointmentRecord } from '@/core/types/appointment';
import type { Client } from '@/core/types/client';
import { AppointmentStatus, PaymentStatus } from '@/core/types/appointment';
import { formatCurrency } from './calculateStats';

/**
 * Convert data to CSV format
 */
function convertToCSV(data: string[][]): string {
  return data
    .map(row =>
      row
        .map(cell => {
          // Escape quotes and wrap in quotes if contains comma, quote, or newline
          const str = String(cell);
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        })
        .join(',')
    )
    .join('\n');
}

/**
 * Download CSV file
 */
function downloadCSV(filename: string, csv: string): void {
  // Add BOM for Hebrew support in Excel
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Export appointments to CSV
 */
export function exportAppointmentsToCSV(
  appointments: AppointmentRecord[],
  clients: Client[]
): void {
  // Create client lookup map
  const clientMap = new Map(clients.map(c => [c.id, c]));
  
  // Prepare data
  const headers = [
    'תאריך',
    'שעה',
    'שם לקוח',
    'טלפון',
    'סטטוס',
    'סטטוס תשלום',
    'סכום',
    'הערות',
  ];
  
  const rows = appointments.map(apt => {
    const client = clientMap.get(apt.clientId);
    const date = new Date(apt.startAt);
    
    // Status translations
    const statusMap: Record<string, string> = {
      [AppointmentStatus.Scheduled]: 'מתוזמן',
      [AppointmentStatus.Confirmed]: 'מאושר',
      [AppointmentStatus.Completed]: 'הושלם',
      [AppointmentStatus.Cancelled]: 'בוטל',
      [AppointmentStatus.NoShow]: 'לא הגיע',
    };
    
    const paymentStatusMap: Record<string, string> = {
      [PaymentStatus.Paid]: 'שולם',
      [PaymentStatus.Unpaid]: 'לא שולם',
      [PaymentStatus.Partial]: 'שולם חלקית',
      [PaymentStatus.Pending]: 'בהמתנה',
      [PaymentStatus.Waived]: 'ויתור',
    };
    
    return [
      date.toLocaleDateString('he-IL'),
      date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
      client?.fullName || 'לא ידוע',
      client?.phone || '',
      statusMap[apt.status] || apt.status,
      paymentStatusMap[apt.paymentStatus] || apt.paymentStatus,
      apt.amount?.toString() || '0',
      typeof apt.customFields?.notes === 'string' ? apt.customFields.notes : '',
    ];
  });
  
  const csv = convertToCSV([headers, ...rows]);
  const filename = `appointments_${new Date().toISOString().split('T')[0]}.csv`;
  
  downloadCSV(filename, csv);
}

/**
 * Export clients to CSV
 */
export function exportClientsToCSV(
  clients: Client[],
  appointments: AppointmentRecord[]
): void {
  // Calculate stats for each client
  const clientStats = clients.map(client => {
    const clientApts = appointments.filter(apt => apt.clientId === client.id);
    const completedApts = clientApts.filter(apt => apt.status === AppointmentStatus.Completed);
    const totalSpent = completedApts.reduce((sum, apt) => sum + (apt.amount || 0), 0);
    
    const lastApt = clientApts
      .filter(apt => apt.startAt)
      .sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime())[0];
    
    return {
      client,
      totalAppointments: clientApts.length,
      completedAppointments: completedApts.length,
      totalSpent,
      lastAppointment: lastApt?.startAt,
    };
  });
  
  // Prepare data
  const headers = [
    'שם',
    'טלפון',
    'סה"כ תורים',
    'תורים שהושלמו',
    'סה"כ הוצאה',
    'תור אחרון',
    'הערות',
  ];
  
  const rows = clientStats.map(stat => [
    stat.client.fullName,
    stat.client.phone,
    stat.totalAppointments.toString(),
    stat.completedAppointments.toString(),
    stat.totalSpent.toString(),
    stat.lastAppointment 
      ? new Date(stat.lastAppointment).toLocaleDateString('he-IL')
      : 'אין',
    stat.client.notes || '',
  ]);
  
  const csv = convertToCSV([headers, ...rows]);
  const filename = `clients_${new Date().toISOString().split('T')[0]}.csv`;
  
  downloadCSV(filename, csv);
}

/**
 * Export revenue summary to CSV
 */
export function exportRevenueSummaryToCSV(
  appointments: AppointmentRecord[],
  dateRange: { startDate: Date; endDate: Date }
): void {
  const { startDate, endDate } = dateRange;
  
  // Group by date
  const dailyRevenue = new Map<string, { revenue: number; appointments: number }>();
  
  appointments.forEach(apt => {
    const aptDate = new Date(apt.startAt);
    if (aptDate >= startDate && aptDate <= endDate && apt.status === AppointmentStatus.Completed) {
      const dateKey = aptDate.toISOString().split('T')[0];
      const existing = dailyRevenue.get(dateKey) || { revenue: 0, appointments: 0 };
      dailyRevenue.set(dateKey, {
        revenue: existing.revenue + (apt.amount || 0),
        appointments: existing.appointments + 1,
      });
    }
  });
  
  // Prepare data
  const headers = ['תאריך', 'הכנסות (₪)', 'מספר תורים', 'ממוצע לתור (₪)'];
  
  const rows = Array.from(dailyRevenue.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, data]) => [
      new Date(date).toLocaleDateString('he-IL'),
      data.revenue.toString(),
      data.appointments.toString(),
      (data.revenue / data.appointments).toFixed(2),
    ]);
  
  // Add totals row
  const totalRevenue = Array.from(dailyRevenue.values()).reduce((sum, d) => sum + d.revenue, 0);
  const totalApts = Array.from(dailyRevenue.values()).reduce((sum, d) => sum + d.appointments, 0);
  rows.push([
    'סה"כ',
    totalRevenue.toString(),
    totalApts.toString(),
    totalApts > 0 ? (totalRevenue / totalApts).toFixed(2) : '0',
  ]);
  
  const csv = convertToCSV([headers, ...rows]);
  const filename = `revenue_summary_${new Date().toISOString().split('T')[0]}.csv`;
  
  downloadCSV(filename, csv);
}

/**
 * Export full analytics report to CSV
 */
export function exportFullAnalyticsReport(
  appointments: AppointmentRecord[],
  clients: Client[],
  dateRange: { startDate: Date; endDate: Date }
): void {
  const { startDate, endDate } = dateRange;
  
  // Filter appointments in range
  const appointmentsInRange = appointments.filter(apt => {
    const aptDate = new Date(apt.startAt);
    return aptDate >= startDate && aptDate <= endDate;
  });
  
  // Calculate summary stats
  const completed = appointmentsInRange.filter(apt => apt.status === AppointmentStatus.Completed);
  const totalRevenue = completed.reduce((sum, apt) => sum + (apt.amount || 0), 0);
  const paidRevenue = appointmentsInRange
    .filter(apt => apt.paymentStatus === PaymentStatus.Paid)
    .reduce((sum, apt) => sum + (apt.amount || 0), 0);
  const unpaidRevenue = appointmentsInRange
    .filter(apt => apt.paymentStatus === PaymentStatus.Unpaid && apt.status === AppointmentStatus.Completed)
    .reduce((sum, apt) => sum + (apt.amount || 0), 0);
  
  // Prepare report
  const data = [
    ['דוח אנליטיקה מקיף'],
    [''],
    ['תאריך יצירה', new Date().toLocaleString('he-IL')],
    ['טווח תאריכים', `${startDate.toLocaleDateString('he-IL')} - ${endDate.toLocaleDateString('he-IL')}`],
    [''],
    ['סיכום תורים'],
    ['סה"כ תורים', appointmentsInRange.length.toString()],
    ['תורים שהושלמו', completed.length.toString()],
    ['תורים שבוטלו', appointmentsInRange.filter(apt => apt.status === AppointmentStatus.Cancelled).length.toString()],
    [''],
    ['סיכום הכנסות'],
    ['סה"כ הכנסות', `₪${totalRevenue}`],
    ['הכנסות ששולמו', `₪${paidRevenue}`],
    ['הכנסות שלא שולמו', `₪${unpaidRevenue}`],
    ['ממוצע לתור', completed.length > 0 ? `₪${(totalRevenue / completed.length).toFixed(2)}` : '₪0'],
    [''],
    ['לקוחות'],
    ['סה"כ לקוחות', clients.length.toString()],
    ['לקוחות פעילים', new Set(appointmentsInRange.map(apt => apt.clientId)).size.toString()],
  ];
  
  const csv = convertToCSV(data);
  const filename = `full_report_${new Date().toISOString().split('T')[0]}.csv`;
  
  downloadCSV(filename, csv);
}
