'use client';

/**
 * Client Reset Password Page
 * דף איפוס סיסמה ללקוחות
 */

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function ClientResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('הסיסמאות אינן תואמות');
      return;
    }

    const token = searchParams.get('token');
    if (!token) {
      setError('חסר טוקן איפוס');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/client-portal/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/client-login');
        }, 2000);
      } else {
        setError(data.error || 'שגיאה באיפוס הסיסמה');
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
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-green-600 mb-4">
            הסיסמה עודכנה בהצלחה!
          </h1>
          <p className="text-gray-600 mb-6">
            מעביר אותך לדף ההתחברות...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
          איפוס סיסמה
        </h1>
        <p className="text-center text-gray-600 mb-8">
          הזן סיסמה חדשה לחשבון שלך
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              סיסמה חדשה *
            </label>
            <input
              type="password"
              required
              dir="ltr"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="הזן את הסיסמה שוב"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'מעדכן סיסמה...' : 'עדכן סיסמה'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => router.push('/client-login')}
            className="text-green-600 font-semibold hover:underline"
          >
            חזור לדף התחברות
          </button>
        </div>
      </div>
    </div>
  );
}
