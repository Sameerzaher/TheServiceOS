"use client";

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { ui } from '@/components/ui';
import { cn } from '@/lib/cn';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        setError(data.error || 'שגיאה בשליחת הבקשה');
        return;
      }

      setSuccess(true);
    } catch (err) {
      setError('שגיאה בשליחת הבקשה');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 p-4">
        <div className="w-full max-w-md">
          <div className={cn(ui.card, "p-8 text-center")}>
            <div className="mb-4 text-6xl">✉️</div>
            <h1 className="mb-2 text-2xl font-bold text-neutral-900">
              בדוק את האימייל שלך
            </h1>
            <p className="mb-6 text-neutral-600">
              אם האימייל קיים במערכת, שלחנו אליו קישור לאיפוס הסיסמה.
            </p>
            <p className="mb-6 text-sm text-neutral-500">
              לא קיבלת? בדוק את תיקיית הספאם או נסה שוב בעוד כמה דקות.
            </p>
            <Link
              href="/login"
              className="inline-block rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
            >
              חזרה להתחברות
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold text-neutral-900">
            🔐 שכחתי סיסמה
          </h1>
          <p className="text-neutral-600">
            הזן את כתובת האימייל שלך ונשלח לך קישור לאיפוס הסיסמה
          </p>
        </div>

        <div className={cn(ui.card, "p-8")}>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className={ui.label}>
                כתובת אימייל
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={ui.input}
                placeholder="your@email.com"
                required
                disabled={loading}
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={cn(
                "w-full rounded-lg bg-emerald-600 px-4 py-3 font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50",
                loading && "cursor-not-allowed"
              )}
            >
              {loading ? 'שולח...' : 'שלח קישור לאיפוס'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="text-sm text-emerald-600 hover:text-emerald-700"
            >
              ← חזרה להתחברות
            </Link>
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-neutral-600">
          עדיין אין לך חשבון?{' '}
          <Link href="/signup" className="font-medium text-emerald-600 hover:text-emerald-700">
            הירשם עכשיו
          </Link>
        </div>
      </div>
    </main>
  );
}
