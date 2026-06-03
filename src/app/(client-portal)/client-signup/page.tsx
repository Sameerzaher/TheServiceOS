'use client';

/**
 * Client Signup Page
 * דף הרשמה ללקוחות בפורטל
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ClientSignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('הסיסמאות אינן תואמות');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/client-portal/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'שגיאה בהרשמה');
        return;
      }

      setSuccess(true);
    } catch (err) {
      setError('שגיאת רשת. אנא נסה שוב');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">✉️</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            ההרשמה הושלמה בהצלחה!
          </h1>
          <p className="text-gray-600 mb-6">
            נשלח אליך אימייל לאימות הכתובת. אנא בדוק את תיבת הדואר שלך ולחץ על הקישור לאימות.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              💡 לא קיבלת את האימייל? בדוק גם בתיקיית הספאם
            </p>
          </div>
          <button
            onClick={() => router.push('/client-login')}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all"
          >
            חזור לדף התחברות
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          הרשמה לפורטל לקוחות
        </h1>
        <p className="text-center text-gray-600 mb-8">
          צור חשבון חדש כדי לנהל את התורים שלך
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              שם מלא *
            </label>
            <input
              type="text"
              required
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="הכנס את שמך המלא"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              אימייל *
            </label>
            <input
              type="email"
              required
              dir="ltr"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="example@email.com"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              טלפון *
            </label>
            <input
              type="tel"
              required
              dir="ltr"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="05X-XXX-XXXX"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              סיסמה *
            </label>
            <input
              type="password"
              required
              dir="ltr"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="לפחות 8 תווים"
            />
            <p className="text-xs text-gray-500 mt-1">
              הסיסמה חייבת להכיל: אות גדולה, אות קטנה, ספרה (באנגלית)
            </p>
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              אימות סיסמה *
            </label>
            <input
              type="password"
              required
              dir="ltr"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="הזן את הסיסמה שוב"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'מבצע הרשמה...' : 'הירשם'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            כבר יש לך חשבון?{' '}
            <button
              onClick={() => router.push('/client-login')}
              className="text-blue-600 font-semibold hover:underline"
            >
              התחבר כאן
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
