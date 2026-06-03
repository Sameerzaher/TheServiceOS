"use client";

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ui } from '@/components/ui';
import { cn } from '@/lib/cn';

export default function ClientLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/client-portal/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        setError(data.error || 'שגיאה בהתחברות');
        return;
      }

      // Redirect to client dashboard
      router.push('/client-dashboard');
    } catch (err) {
      setError('שגיאה בהתחברות');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-4 text-6xl">👤</div>
          <h1 className="mb-2 text-3xl font-bold text-neutral-900">
            פורטל לקוחות
          </h1>
          <p className="text-neutral-600">
            התחבר כדי לצפות בתורים ובפרטים שלך
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
                אימייל
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={ui.input}
                placeholder="your@email.com"
                required
                disabled={loading}
                autoFocus
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className={ui.label}>
                  סיסמה
                </label>
                <Link href="/client-forgot-password" className="text-sm text-blue-600 hover:text-blue-700">
                  שכחת סיסמה?
                </Link>
              </div>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={ui.input}
                placeholder="••••••••"
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={cn(
                "w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50",
                loading && "cursor-not-allowed"
              )}
            >
              {loading ? 'מתחבר...' : 'התחבר'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-neutral-600">
            עדיין אין לך חשבון?{' '}
            <Link href="/client-signup" className="font-medium text-blue-600 hover:text-blue-700">
              הירשם עכשיו
            </Link>
          </div>
        </div>

        <div className={cn(ui.card, "mt-6 p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200")}>
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
            <span>💡</span>
            חדש בפורטל?
          </h3>
          <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
            <li>• צפה בכל התורים שלך במקום אחד</li>
            <li>• בטל או שנה תור בקלות</li>
            <li>• עקוב אחרי היסטוריית תשלומים</li>
            <li>• הורד חשבוניות PDF</li>
            <li>• עדכן פרטים אישיים</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
