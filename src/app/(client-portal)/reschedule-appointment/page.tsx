'use client';

/**
 * Reschedule Appointment Page (for clients)
 * דף שינוי מועד תור ללקוחות
 */

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface Appointment {
  id: string;
  start_at: string;
  end_at: string;
  teacher: {
    full_name: string;
    business_name: string;
  } | null;
}

function RescheduleAppointmentPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [duration, setDuration] = useState('60');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const loadAppointment = useCallback(async (appointmentId: string) => {
    try {
      const response = await fetch('/api/client-portal/appointments');
      
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/client-login');
          return;
        }
        throw new Error('שגיאה בטעינת תור');
      }

      const data = await response.json();
      const apt = data.appointments?.find((a: Appointment) => a.id === appointmentId);

      if (!apt) {
        setError('תור לא נמצא');
        setLoading(false);
        return;
      }

      setAppointment(apt);

      const startDate = new Date(apt.start_at);
      const endDate = new Date(apt.end_at);
      const durationMinutes = Math.round((endDate.getTime() - startDate.getTime()) / 60000);

      setDate(startDate.toISOString().split('T')[0]);
      setStartTime(startDate.toTimeString().substring(0, 5));
      setDuration(durationMinutes.toString());
    } catch {
      setError('שגיאה בטעינת תור');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const appointmentId = searchParams.get('id');
    if (!appointmentId) {
      setError('חסר מזהה תור');
      setLoading(false);
      return;
    }

    void loadAppointment(appointmentId);
  }, [searchParams, loadAppointment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!appointment || !date || !startTime) {
      setError('אנא מלא את כל השדות');
      return;
    }

    // Calculate new times
    const newStartDateTime = new Date(`${date}T${startTime}`);
    const newEndDateTime = new Date(newStartDateTime.getTime() + parseInt(duration) * 60000);

    // Check if the new time is different from the current time
    const originalStart = new Date(appointment.start_at);
    if (newStartDateTime.getTime() === originalStart.getTime()) {
      setError('השעה החדשה זהה לשעה הנוכחית');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/client-portal/appointments/reschedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: appointment.id,
          newStartAt: newStartDateTime.toISOString(),
          newEndAt: newEndDateTime.toISOString(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'שגיאה בשינוי התור');
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/client-dashboard');
      }, 2000);
    } catch (err) {
      setError('שגיאת רשת. אנא נסה שוב');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-green-600 mb-4">
            התור שונה בהצלחה!
          </h1>
          <p className="text-gray-600 mb-6">
            מעביר אותך לדשבורד...
          </p>
        </div>
      </div>
    );
  }

  if (error && !appointment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            שגיאה
          </h1>
          <p className="text-gray-700 mb-6">{error}</p>
          <button
            onClick={() => router.push('/client-dashboard')}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all"
          >
            חזור לדשבורד
          </button>
        </div>
      </div>
    );
  }

  if (!appointment) return null;

  const originalStart = new Date(appointment.start_at);
  const formattedOriginalDate = originalStart.toLocaleDateString('he-IL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const formattedOriginalTime = originalStart.toLocaleTimeString('he-IL', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-800">📅 שינוי מועד תור</h1>
          <button
            onClick={() => router.push('/client-dashboard')}
            className="text-blue-600 hover:text-blue-700 font-semibold"
          >
            ← חזור
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Current Appointment Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">תור קיים:</h3>
            <p className="text-blue-800">
              <strong>מורה:</strong> {appointment.teacher?.business_name || appointment.teacher?.full_name || 'שירות'}
            </p>
            <p className="text-blue-800">
              <strong>תאריך:</strong> {formattedOriginalDate}
            </p>
            <p className="text-blue-800">
              <strong>שעה:</strong> {formattedOriginalTime}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                תאריך חדש
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                שעה חדשה
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                משך (דקות)
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="30">30 דקות</option>
                <option value="45">45 דקות</option>
                <option value="60">60 דקות (שעה)</option>
                <option value="90">90 דקות (שעה וחצי)</option>
                <option value="120">120 דקות (שעתיים)</option>
              </select>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <p className="text-sm text-orange-800">
                ⚠️ <strong>שים לב:</strong> שינוי התור כפוף לאישור המורה.
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'משנה תור...' : 'שנה תור'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function RescheduleAppointmentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-neutral-600">טוען...</p>
        </div>
      }
    >
      <RescheduleAppointmentPageContent />
    </Suspense>
  );
}
