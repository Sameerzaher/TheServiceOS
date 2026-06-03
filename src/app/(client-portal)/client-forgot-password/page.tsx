'use client';

/**
 * Client Forgot Password Page
 * דף שכחת סיסמה ללקוחות
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ClientForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/client-portal/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
      } else {
        setError(data.error || 'שגיאה בשליחת בקשה');
      }
    } catch (err) {
      setError('שגיאת רשת. אנא נסה שוב');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">✉️</div>
          <h1 className="text-2xl font-bold text-green-600 mb-4">
            נשלח אימייל!
          </h1>
          <p className="text-gray-600 mb-6">
            אם האימייל קיים במערכת, נשלח אליך קישור לאיפוס סיסמה.
            <br />
            אנא בדוק את תיבת הדואר שלך.
          </p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-green-800">
              💡 לא קיבלת את האימייל? בדוק גם בתיקיית הספאם
            </p>
          </div>
          <button
            onClick={() => router.push('/client-login')}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-700 transition-all"
          >
            חזור לדף התחברות
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
          שכחת סיסמה?
        </h1>
        <p className="text-center text-gray-600 mb-8">
          הזן את כתובת האימייל שלך ונשלח לך קישור לאיפוס
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              אימייל
            </label>
            <input
              type="email"
              required
              dir="ltr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="example@email.com"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'שולח...' : 'שלח קישור איפוס'}
          </button>
        </form>

        <div className="mt-6 text-center space-y-2">
          <button
            onClick={() => router.push('/client-login')}
            className="text-green-600 font-semibold hover:underline"
          >
            חזור לדף התחברות
          </button>
          <div className="text-gray-600 text-sm">
            אין לך חשבון?{' '}
            <button
              onClick={() => router.push('/client-signup')}
              className="text-green-600 font-semibold hover:underline"
            >
              הירשם כאן
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
