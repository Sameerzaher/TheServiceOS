'use client';

/**
 * Book Appointment Page (for clients)
 * דף קביעת תור ללקוחות
 */

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface Teacher {
  id: string;
  full_name: string;
  business_name: string;
  phone: string;
  business_type: string;
}

export default function BookAppointmentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [duration, setDuration] = useState('60');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const loadTeachers = useCallback(async () => {
    try {
      const response = await fetch('/api/client-portal/book-appointment');
      
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/client-login');
          return;
        }
        throw new Error('שגיאה בטעינת מורים');
      }

      const data = await response.json();
      setTeachers(data.teachers || []);
      
      if (data.teachers && data.teachers.length > 0) {
        setSelectedTeacher(data.teachers[0].id);
      }
    } catch {
      setError('שגיאה בטעינת מורים');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadTeachers();

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setDate(tomorrow.toISOString().split('T')[0]);
  }, [loadTeachers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedTeacher || !date || !startTime) {
      setError('אנא מלא את כל השדות');
      return;
    }

    // Calculate end time
    const startDateTime = new Date(`${date}T${startTime}`);
    const endDateTime = new Date(startDateTime.getTime() + parseInt(duration) * 60000);

    setSubmitting(true);

    try {
      const response = await fetch('/api/client-portal/book-appointment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherId: selectedTeacher,
          startAt: startDateTime.toISOString(),
          endAt: endDateTime.toISOString(),
          notes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'שגיאה בקביעת תור');
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
            התור נקבע בהצלחה!
          </h1>
          <p className="text-gray-600 mb-6">
            מעביר אותך לדשבורד...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-800">📅 קביעת תור חדש</h1>
          <button
            onClick={() => router.push('/client-dashboard')}
            className="text-blue-600 hover:text-blue-700 font-semibold"
          >
            ← חזור
          </button>
        </div>

        {teachers.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-2xl p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              אין מורים זמינים
            </h2>
            <p className="text-gray-600 mb-6">
              אנא פנה למנהל המערכת
            </p>
            <button
              onClick={() => router.push('/client-dashboard')}
              className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors"
            >
              חזור לדשבורד
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  בחר מורה / עסק
                </label>
                <select
                  value={selectedTeacher}
                  onChange={(e) => setSelectedTeacher(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.business_name || teacher.full_name} - {teacher.phone}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  תאריך
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
                  שעה
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

              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  הערות (אופציונלי)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="הערות נוספות או בקשות מיוחדות..."
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  💡 <strong>שים לב:</strong> התור יאושר על ידי המורה. תקבל עדכון לאחר האישור.
                </p>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'קובע תור...' : 'קבע תור'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
