"use client";

import { useState, FormEvent, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ui } from '@/components/ui';
import { cn } from '@/lib/cn';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('טוקן חסר. אנא בקש איפוס סיסמה חדש.');
    }
  }, [token]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('הסיסמאות אינן תואמות');
      return;
    }

    // Validate password strength
    if (password.length < 8) {
      setError('הסיסמה חייבת להכיל לפחות 8 תווים');
      return;
    }

    if (!/[a-z]/.test(password)) {
      setError('הסיסמה חייבת להכיל לפחות אות קטנה אחת');
      return;
    }

    if (!/[A-Z]/.test(password)) {
      setError('הסיסמה חייבת להכיל לפחות אות גדולה אחת');
      return;
    }

    if (!/[0-9]/.test(password)) {
      setError('הסיסמה חייבת להכיל לפחות ספרה אחת');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        setError(data.error || 'שגיאה באיפוס הסיסמה');
        return;
      }

      setSuccess(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err) {
      setError('שגיאה באיפוס הסיסמה');
    } finally {
      setLoading(false);
    }
  };

  if (!token && !error) {
    return (
      <div className="text-center">
        <div className="mb-4 text-4xl">⏳</div>
        <p className="text-neutral-600">טוען...</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className={cn(ui.card, "p-8 text-center")}>
        <div className="mb-4 text-6xl">✅</div>
        <h1 className="mb-2 text-2xl font-bold text-neutral-900">
          הסיסמה עודכנה בהצלחה!
        </h1>
        <p className="mb-6 text-neutral-600">
          עכשיו תוכל להתחבר עם הסיסמה החדשה
        </p>
        <p className="text-sm text-neutral-500">
          מעביר לדף התחברות...
        </p>
      </div>
    );
  }

  return (
    <div className={cn(ui.card, "p-8")}>
      <div className="mb-6 text-center">
        <h1 className="mb-2 text-2xl font-bold text-neutral-900">
          🔐 איפוס סיסמה
        </h1>
        <p className="text-sm text-neutral-600">
          הזן סיסמה חדשה לחשבון שלך
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="password" className={ui.label}>
            סיסמה חדשה
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={ui.input}
            placeholder="••••••••"
            required
            disabled={loading || !token}
            autoFocus
          />
          <p className="mt-1 text-xs text-neutral-500">
            לפחות 8 תווים, כולל אות גדולה, אות קטנה וספרה
          </p>
        </div>

        <div>
          <label htmlFor="confirmPassword" className={ui.label}>
            אימות סיסמה
          </label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={ui.input}
            placeholder="••••••••"
            required
            disabled={loading || !token}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !token}
          className={cn(
            "w-full rounded-lg bg-emerald-600 px-4 py-3 font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50",
            (loading || !token) && "cursor-not-allowed"
          )}
        >
          {loading ? 'מעדכן...' : 'עדכן סיסמה'}
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
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 p-4">
      <div className="w-full max-w-md">
        <Suspense fallback={
          <div className="text-center">
            <div className="mb-4 text-4xl">⏳</div>
            <p className="text-neutral-600">טוען...</p>
          </div>
        }>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </main>
  );
}
