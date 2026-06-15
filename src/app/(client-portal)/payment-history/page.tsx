'use client';

/**
 * Payment History Page (for clients)
 * דף היסטוריית תשלומים ללקוחות
 */

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface Appointment {
  id: string;
  start_at: string;
  end_at: string;
  amount: number;
  payment_status: string;
  payment_method: string;
  created_at: string;
  teacher: {
    full_name: string;
    business_name: string;
    phone: string;
  } | null;
}

interface Statistics {
  totalPaid: number;
  totalPending: number;
  totalPayments: number;
}

function PaymentHistoryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [statistics, setStatistics] = useState<Statistics>({
    totalPaid: 0,
    totalPending: 0,
    totalPayments: 0,
  });
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadPaymentHistory = useCallback(async () => {
    try {
      const response = await fetch('/api/client-portal/payment-history');

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/client-login');
          return;
        }
        throw new Error('שגיאה בטעינת היסטוריית תשלומים');
      }

      const data = await response.json();
      setAppointments(data.appointments || []);
      setStatistics(data.statistics || { totalPaid: 0, totalPending: 0, totalPayments: 0 });
    } catch {
      setError('שגיאה בטעינת היסטוריית תשלומים');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadPaymentHistory();
  }, [loadPaymentHistory]);

  useEffect(() => {
    if (searchParams.get('paid') === '1') {
      setNotice('התשלום התקבל בהצלחה! ✅');
    } else if (searchParams.get('canceled') === '1') {
      setNotice('התשלום בוטל. אפשר לנסות שוב בכל עת.');
    }
  }, [searchParams]);

  const handleDownloadInvoice = (appointmentId: string) => {
    window.open(`/api/client-portal/invoice?appointmentId=${appointmentId}`, '_blank');
  };

  const handlePay = async (appointmentId: string) => {
    setPayingId(appointmentId);
    setError('');
    try {
      const response = await fetch('/api/client-portal/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId }),
      });
      const data = await response.json();
      if (!response.ok || !data.url) {
        setError(data.error || 'שגיאה ביצירת תשלום');
        return;
      }
      window.location.href = data.url;
    } catch {
      setError('שגיאה ביצירת תשלום');
    } finally {
      setPayingId(null);
    }
  };

  const isUnpaid = (status: string) => status !== 'paid';

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-800">💰 היסטוריית תשלומים</h1>
          <button
            onClick={() => router.push('/client-dashboard')}
            className="text-blue-600 hover:text-blue-700 font-semibold"
          >
            ← חזור לדשבורד
          </button>
        </div>

        {notice && (
          <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {notice}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-sm text-gray-600 mb-1">{'סה"כ שולם'}</div>
            <div className="text-3xl font-bold text-green-600">
              ₪{statistics.totalPaid.toFixed(2)}
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-sm text-gray-600 mb-1">ממתין לתשלום</div>
            <div className="text-3xl font-bold text-orange-600">
              ₪{statistics.totalPending.toFixed(2)}
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-sm text-gray-600 mb-1">{'סה"כ תשלומים'}</div>
            <div className="text-3xl font-bold text-blue-600">
              {statistics.totalPayments}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {appointments.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📭</div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">אין היסטוריית תשלומים</h2>
              <p className="text-gray-600">התשלומים שלך יופיעו כאן לאחר שתבצע תורים</p>
            </div>
          ) : (
            <div className="space-y-4">
              {appointments.map((apt) => {
                const appointmentDate = new Date(apt.start_at).toLocaleDateString('he-IL', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                });
                const appointmentTime = new Date(apt.start_at).toLocaleTimeString('he-IL', {
                  hour: '2-digit',
                  minute: '2-digit',
                });
                const unpaid = isUnpaid(apt.payment_status) && apt.amount > 0;

                return (
                  <div
                    key={apt.id}
                    className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex-1 min-w-[200px]">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl">🏢</span>
                          <div>
                            <h3 className="font-semibold text-gray-800">
                              {apt.teacher?.business_name || apt.teacher?.full_name || 'שירות'}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {appointmentDate} • {appointmentTime}
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center gap-4 flex-wrap">
                          <div className="text-2xl font-bold text-gray-800">₪{apt.amount}</div>
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-semibold ${
                              apt.payment_status === 'paid'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-orange-100 text-orange-700'
                            }`}
                          >
                            {apt.payment_status === 'paid' ? '✓ שולם' : '⏳ ממתין'}
                          </span>
                          {apt.payment_method && (
                            <span className="text-sm text-gray-600">{apt.payment_method}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        {unpaid && (
                          <button
                            onClick={() => handlePay(apt.id)}
                            disabled={payingId === apt.id}
                            className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                          >
                            {payingId === apt.id ? 'מעביר לתשלום...' : '💳 שלם עכשיו'}
                          </button>
                        )}
                        <button
                          onClick={() => handleDownloadInvoice(apt.id)}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                        >
                          <span>📄</span>
                          <span>הורד חשבונית</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PaymentHistoryPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-neutral-600">טוען...</p>
        </div>
      }
    >
      <PaymentHistoryContent />
    </Suspense>
  );
}
