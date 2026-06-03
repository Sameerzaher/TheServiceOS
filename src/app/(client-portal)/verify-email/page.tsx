'use client';

/**
 * Email Verification Page (for clients)
 * דף אימות אימייל ללקוחות
 */

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [resendEmail, setResendEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setMessage('חסר טוקן אימות');
      return;
    }

    verifyEmail(token);
  }, [searchParams]);

  const verifyEmail = async (token: string) => {
    try {
      const response = await fetch('/api/client-portal/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage(data.message || 'האימייל אומת בהצלחה!');
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/client-login');
        }, 3000);
      } else {
        setStatus('error');
        setMessage(data.error || 'שגיאה באימות האימייל');
      }
    } catch (error) {
      setStatus('error');
      setMessage('שגיאת רשת. אנא נסה שוב');
    }
  };

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    setResendLoading(true);
    setResendSuccess(false);

    try {
      const response = await fetch('/api/client-portal/auth/verify-email', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resendEmail }),
      });

      if (response.ok) {
        setResendSuccess(true);
      }
    } catch (error) {
      console.error('Resend error:', error);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              מאמת אימייל...
            </h1>
            <p className="text-gray-600">אנא המתן</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="text-6xl mb-4">✅</div>
            <h1 className="text-2xl font-bold text-green-600 mb-4">
              {message}
            </h1>
            <p className="text-gray-600 mb-6">
              מעביר אותך לדף ההתחברות...
            </p>
            <button
              onClick={() => router.push('/client-login')}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all"
            >
              התחבר עכשיו
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-6xl mb-4">❌</div>
            <h1 className="text-2xl font-bold text-red-600 mb-4">
              שגיאה באימות
            </h1>
            <p className="text-gray-700 mb-6">{message}</p>

            <div className="border-t pt-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                רוצה לקבל אימייל חדש?
              </h2>
              <form onSubmit={handleResend} className="space-y-4">
                <input
                  type="email"
                  required
                  dir="ltr"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  placeholder="example@email.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  disabled={resendLoading}
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all disabled:opacity-50"
                >
                  {resendLoading ? 'שולח...' : 'שלח אימייל חדש'}
                </button>
              </form>

              {resendSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mt-4">
                  אימייל נשלח בהצלחה! בדוק את תיבת הדואר שלך
                </div>
              )}
            </div>

            <button
              onClick={() => router.push('/client-login')}
              className="mt-6 text-blue-600 font-semibold hover:underline"
            >
              חזור לדף התחברות
            </button>
          </>
        )}
      </div>
    </div>
  );
}
