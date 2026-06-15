"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ui, Button } from '@/components/ui';
import { cn } from '@/lib/cn';

interface Client {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  email_verified: boolean;
}

interface Appointment {
  id: string;
  start_at: string;
  end_at: string;
  status: string;
  payment_status: string;
  amount: number;
  notes: string;
  teacher: {
    full_name: string;
    business_name: string;
    phone: string;
  };
}

export default function ClientDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState<Client | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [canceling, setCanceling] = useState<string | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load client info
      const clientRes = await fetch('/api/client-portal/me');
      const clientData = await clientRes.json();

      if (!clientRes.ok || !clientData.ok) {
        router.push('/client-login');
        return;
      }

      setClient(clientData.client);

      // Load appointments
      const aptRes = await fetch('/api/client-portal/appointments');
      const aptData = await aptRes.json();

      if (aptData.ok) {
        setAppointments(aptData.appointments);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    if (!confirm('בטוח שאתה רוצה לבטל את התור?')) {
      return;
    }

    setCanceling(appointmentId);

    try {
      const response = await fetch('/api/client-portal/appointments', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId }),
      });

      const data = await response.json();

      if (data.ok) {
        alert('התור בוטל בהצלחה');
        loadData(); // Reload
      } else {
        alert(data.error || 'שגיאה בביטול התור');
      }
    } catch (error) {
      alert('שגיאה בביטול התור');
    } finally {
      setCanceling(null);
    }
  };

  const handleLogout = async () => {
    document.cookie = 'client_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    router.push('/client-login');
  };

  const handlePay = async (appointmentId: string) => {
    setPayingId(appointmentId);
    try {
      const response = await fetch('/api/client-portal/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId }),
      });
      const data = await response.json();
      if (!response.ok || !data.url) {
        alert(data.error || 'שגיאה ביצירת תשלום');
        return;
      }
      window.location.href = data.url;
    } catch {
      alert('שגיאה ביצירת תשלום');
    } finally {
      setPayingId(null);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-50">
        <div className="text-center">
          <div className="text-4xl mb-2">⏳</div>
          <div className="text-sm text-neutral-600">טוען...</div>
        </div>
      </main>
    );
  }

  if (!client) {
    return null;
  }

  const upcomingAppointments = appointments.filter(
    (apt) => new Date(apt.start_at) > new Date() && apt.status !== 'canceled'
  );

  const pastAppointments = appointments.filter(
    (apt) => new Date(apt.start_at) <= new Date() || apt.status === 'canceled'
  );

  return (
    <main className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      {/* Header */}
      <header className="border-b border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                שלום, {client.full_name} 👋
              </h1>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {client.email}
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => router.push('/client-profile')}>
                ⚙️ הגדרות
              </Button>
              <Button variant="secondary" onClick={handleLogout}>
                התנתק
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Stats */}
          <div className={cn(ui.card, "p-6")}>
            <div className="text-sm text-neutral-600 dark:text-neutral-400">
              תורים עתידיים
            </div>
            <div className="mt-2 text-3xl font-bold text-blue-600">
              {upcomingAppointments.length}
            </div>
          </div>

          <div className={cn(ui.card, "p-6")}>
            <div className="text-sm text-neutral-600 dark:text-neutral-400">
              {'סה"כ תורים'}
            </div>
            <div className="mt-2 text-3xl font-bold text-neutral-900 dark:text-neutral-100">
              {appointments.length}
            </div>
          </div>

          <div className={cn(ui.card, "p-6")}>
            <div className="text-sm text-neutral-600 dark:text-neutral-400">
              תורים שהושלמו
            </div>
            <div className="mt-2 text-3xl font-bold text-emerald-600">
              {appointments.filter((a) => a.status === 'completed').length}
            </div>
          </div>

          <div className={cn(ui.card, "p-6 cursor-pointer hover:shadow-lg transition-shadow")} onClick={() => router.push('/payment-history')}>
            <div className="text-sm text-neutral-600 dark:text-neutral-400 flex items-center gap-2">
              💰 היסטוריית תשלומים
            </div>
            <div className="mt-2 text-lg font-semibold text-blue-600">
              לחץ לצפייה ←
            </div>
          </div>
        </div>

        {/* Upcoming Appointments */}
        <div className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
              📅 התורים הבאים
            </h2>
            <Button onClick={() => router.push('/book-appointment')}>
              + קבע תור חדש
            </Button>
          </div>

          {upcomingAppointments.length === 0 ? (
            <div className={cn(ui.card, "p-12 text-center")}>
              <div className="text-4xl mb-2">📭</div>
              <p className="text-neutral-600">אין תורים עתידיים</p>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingAppointments.map((apt) => (
                <div key={apt.id} className={cn(ui.card, "p-6")}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">🏢</span>
                        <div>
                          <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
                            {apt.teacher.business_name}
                          </h3>
                          <p className="text-sm text-neutral-600 dark:text-neutral-400">
                            {apt.teacher.full_name}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <span>📅</span>
                          <span>
                            {new Date(apt.start_at).toLocaleDateString('he-IL', {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span>🕐</span>
                          <span>
                            {new Date(apt.start_at).toLocaleTimeString('he-IL', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        {apt.amount > 0 && (
                          <div className="flex items-center gap-2">
                            <span>💰</span>
                            <span>₪{apt.amount}</span>
                            <span
                              className={cn(
                                'rounded-full px-2 py-0.5 text-xs',
                                apt.payment_status === 'paid'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-amber-100 text-amber-700'
                              )}
                            >
                              {apt.payment_status === 'paid' ? 'שולם' : 'לא שולם'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      {apt.amount > 0 && apt.payment_status !== 'paid' && (
                        <Button
                          size="sm"
                          onClick={() => handlePay(apt.id)}
                          disabled={payingId === apt.id}
                        >
                          {payingId === apt.id ? 'מעביר...' : '💳 שלם'}
                        </Button>
                      )}
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => router.push(`/reschedule-appointment?id=${apt.id}`)}
                      >
                        📅 שנה מועד
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleCancelAppointment(apt.id)}
                        disabled={canceling === apt.id}
                      >
                        {canceling === apt.id ? 'מבטל...' : 'בטל תור'}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Past Appointments */}
        {pastAppointments.length > 0 && (
          <div className="mt-8">
            <h2 className="mb-4 text-xl font-semibold text-neutral-900 dark:text-neutral-100">
              📜 תורים קודמים
            </h2>

            <div className="space-y-4">
              {pastAppointments.slice(0, 5).map((apt) => (
                <div
                  key={apt.id}
                  className={cn(ui.card, "p-6 opacity-60")}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {apt.status === 'completed' ? '✅' : '❌'}
                    </span>
                    <div className="flex-1">
                      <h3 className="font-semibold">
                        {apt.teacher.business_name}
                      </h3>
                      <p className="text-sm text-neutral-600">
                        {new Date(apt.start_at).toLocaleDateString('he-IL')} •{' '}
                        {apt.status === 'completed' ? 'הושלם' : 'בוטל'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
